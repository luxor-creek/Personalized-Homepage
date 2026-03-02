import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Authenticate the request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const jwt = authHeader.replace("Bearer ", "").trim();
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(jwt);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { question } = await req.json();
    if (!question || typeof question !== "string" || question.length > 2000) {
      return new Response(JSON.stringify({ error: "question is required (max 2000 chars)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role for cache operations
    const supabase = createClient(supabaseUrl, serviceKey);

    const normalized = normalize(question);

    // 1. Check cache — exact normalized match
    const { data: exactMatch } = await supabase
      .from("chat_cache")
      .select("id, answer, category")
      .eq("question_normalized", normalized)
      .limit(1)
      .single();

    if (exactMatch) {
      await supabase.from("chat_cache").update({ hit_count: exactMatch.hit_count + 1 || 1 }).eq("id", exactMatch.id);
      return new Response(JSON.stringify({ answer: exactMatch.answer, cached: true, category: exactMatch.category }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Check cache — fuzzy match
    const words = normalized.split(" ").filter(w => w.length > 3);
    if (words.length >= 2) {
      const searchTerm = words.slice(0, 4).join(" ");
      const { data: fuzzyMatches } = await supabase
        .from("chat_cache")
        .select("id, question_normalized, answer, category, hit_count")
        .textSearch("question_normalized", searchTerm.split(" ").join(" & "), { type: "plain" });

      if (fuzzyMatches && fuzzyMatches.length > 0) {
        let bestMatch = fuzzyMatches[0];
        let bestScore = 0;
        for (const m of fuzzyMatches) {
          const mWords = new Set(m.question_normalized.split(" "));
          const overlap = words.filter(w => mWords.has(w)).length;
          const score = overlap / Math.max(words.length, mWords.size);
          if (score > bestScore) {
            bestScore = score;
            bestMatch = m;
          }
        }
        if (bestScore > 0.4) {
          await supabase.from("chat_cache").update({ hit_count: (bestMatch.hit_count || 0) + 1 }).eq("id", bestMatch.id);
          return new Response(JSON.stringify({ answer: bestMatch.answer, cached: true, category: bestMatch.category }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    // 3. Fall back to AI
    const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY");
    if (!DEEPSEEK_API_KEY) throw new Error("DEEPSEEK_API_KEY is not configured");

    const systemPrompt = `You are the Personalized Page AI Assistant — a helpful, friendly support bot for the Personalized Page platform.

You help users with:
- Creating and managing campaigns
- Adding contacts (via CSV upload, Google Sheets import, manual entry, Snov.io sync, LinkedIn enrichment)
- Editing and customizing landing page templates
- Using the page builder (sections, columns, images, videos, QR codes, buttons)
- Understanding personalization variables ({{first_name}}, {{last_name}}, {{company}}, {{company_name}}, {{full_name}}, {{landing_page}}, {{custom_field}})
- Using the AI copywriter feature
- Understanding analytics (page views, video clicks)
- Integrations (Snov.io, Resend, Zapier webhooks)
- Account management, billing, and plan limits

Key facts about the platform:
- Users create campaigns, then add contacts to generate unique personalized landing pages
- Templates can be edited in a visual editor with drag-and-drop sections
- The page builder supports headlines, text, images, videos, buttons, QR codes, forms, and multi-column layout
- Personalization tokens like {{first_name}} are replaced with actual contact data on the live page
- Google Sheets import requires the sheet to be shared as "Anyone with the link can view"
- CSV uploads support automatic AI-powered column mapping
- The LinkedIn enrichment tool pulls name, email, and company from LinkedIn profiles via Snov.io
- Zapier integration allows webhook triggers on page views and form submissions
- Plans: Trial (14 days, 3 pages, 1 campaign), Starter ($29/mo, 25 pages, 50 campaigns), Pro ($59/mo, unlimited)

Rules:
- Keep answers concise but thorough (2-4 paragraphs max)
- Use numbered steps for how-to guides
- Be encouraging and helpful
- If you don't know the answer, say so and suggest contacting support
- Never reveal technical implementation details (database schemas, API keys, etc.)
- Refer to backend infrastructure as "the platform" not "Supabase"
- Always refer to the product as "Personalized Page" — never "Kicker" or "Kicker Video"`;

    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content?.trim();
    if (!answer) throw new Error("No answer from AI");

    // 4. Cache the answer
    await supabase.from("chat_cache").insert({
      question: question.trim(),
      question_normalized: normalized,
      answer,
      category: "ai_generated",
      hit_count: 1,
    });

    return new Response(JSON.stringify({ answer, cached: false, category: "ai_generated" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-assistant-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
