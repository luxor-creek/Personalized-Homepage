import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const jwt = authHeader.replace("Bearer ", "").trim();
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(jwt);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { text, sectionType, tone, context } = await req.json();
    if (!text || typeof text !== "string" || text.length > 10000) {
      return new Response(JSON.stringify({ error: "text is required (max 10000 chars)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY");
    if (!DEEPSEEK_API_KEY) throw new Error("DEEPSEEK_API_KEY is not configured");

    const toneInstruction = tone === "professional" ? "Use a professional, authoritative tone."
      : tone === "casual" ? "Use a friendly, conversational tone."
      : tone === "bold" ? "Use a bold, urgent, high-energy tone."
      : "Use a clear, compelling tone.";

    const systemPrompt = `You are a world-class copywriter for landing pages. Rewrite the given text to be more compelling, persuasive, and conversion-focused.

Section type: ${sectionType || "general"}
${toneInstruction}
${context ? `Page context: ${context}` : ""}

CRITICAL RULES:
- Keep the same general meaning but make it significantly better
- Keep it concise — shorter is usually better for landing pages
- If the original text contains personalization tokens like {{first_name}}, {{company}}, {{company_name}}, {{last_name}}, {{full_name}}, {{landing_page}}, or {{custom_field}}, keep them EXACTLY as-is in the same position
- Do NOT add any new {{...}} tokens that were not in the original text
- Do NOT invent or insert variables that the user did not include
- If the original text has NO {{...}} tokens, do NOT add any
- Preserve any formatting markup like [[color:primary]] ... [[/color:primary]] or [[size:large]] ... [[/size:large]]
- Return ONLY the rewritten text, no quotes, no explanation, no markdown`;

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
          { role: "user", content: text },
        ],
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const rewritten = data.choices?.[0]?.message?.content?.trim() || text;

    return new Response(JSON.stringify({ rewritten }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-rewrite-copy error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
