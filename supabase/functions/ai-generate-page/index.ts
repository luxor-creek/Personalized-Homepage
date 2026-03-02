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

    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== "string" || prompt.length > 10000) {
      return new Response(JSON.stringify({ error: "prompt is required (max 10000 chars)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY");
    if (!DEEPSEEK_API_KEY) throw new Error("DEEPSEEK_API_KEY is not configured");

    const systemPrompt = `You are an expert page architect. Given a business description, generate a JSON array of page sections for a drag-and-drop page builder.

FIRST: Determine the PAGE PURPOSE from the user's description. The purpose dictates the structure:
- SALES / LEAD GENERATION PAGE (selling a service, pitching prospects, booking calls, generating leads) → Use the SALES PAGE FRAMEWORK below
- GENERAL / OTHER (marketing page, lead magnet, fundraiser, ebook, portfolio, event, informational, nonprofit, etc.) → Use the GENERAL PAGE FRAMEWORK below

Available section types and their content fields:
- "hero": text (headline), heroSubheadline, buttonText, buttonLink, secondaryButtonText, heroBadge
- "heroImage": text (headline), heroSubheadline, heroImageUrl (leave empty string)
- "heroForm": text (headline), heroSubheadline, heroFormFields (array of field names), heroFormButtonText, heroFormTitle, formRecipientEmail (leave empty)
- "headline": text
- "body": text
- "socialProof": socialProofTitle, socialProofItems (array of {platform, count, label})
- "stats": statItems (array of {value, label})
- "features": featureItems (array of {icon: emoji, title, description})
- "benefits": benefitsTitle, benefitsSubtitle, benefitItems (array of strings)
- "steps": stepsTitle, stepsSubtitle, stepItems (array of {title, description}) — 3-4 steps max
- "testimonials": testimonialItems (array of {quote, author, role}) — display ALL, no carousel
- "cards": cardsTitle, cardItems (array of {title, description, imageUrl: ""})
- "comparison": comparisonHeaderA, comparisonHeaderB, comparisonRows (array of {feature, optionA, optionB})
- "cta": text, buttonText, buttonLink
- "form": formTitle, formSubtitle, formFields (array of field names), formButtonText
- "banner": bannerText, bannerSubtext
- "faq": faqItems (array of {question, answer})
- "footer": footerColumns (array of {title, links: [{label, url}]}), footerCopyright
- "logoCloud": logoCloudTitle, logoUrls (empty array)
- "quote": quoteText, quoteAuthor, quoteRole

Each section object has:
- id: random 8-char string
- type: one of the types above
- content: object with the relevant fields
- style: object with backgroundColor (hex), textColor (hex), paddingY (e.g. "64px"), fontSize, fontWeight, textAlign, buttonColor, buttonTextColor, maxWidth, accentColor

---

SALES PAGE FRAMEWORK (use ONLY for sales/lead-gen pages):

1. ATF HERO — Use "hero" or "heroForm":
   - Headline: Dream outcome focus ("Transform your X", "Achieve Y in Z time"). Use {{first_name}} or {{company}} personalization tokens.
   - Sub-headline: Pain point → solution ("Tired of X? Our Y solution does Z.")
   - Badge: Social proof (star ratings, "Trusted by X companies")
   - Clear CTA buttons

2. IMMEDIATE SOCIAL PROOF — "socialProof" or "stats" right after hero

3. PAIN POINT SECTION — "headline" + "body" using Problem-Agitate-Solve framework

4. VALUE PROPOSITIONS — "features" or "cards" with Feature → Benefit titles

5. HOW IT WORKS — "steps" with benefit-driven title, 3-4 steps

6. TESTIMONIALS — "testimonials" with 3+ specific results-oriented quotes, ALL displayed

7. FUD REDUCTION — "benefits" or "faq" addressing objections (guarantees, risk-free, warranties)

8. CLOSER — "cta" or "heroForm" with final benefit headline + conversion action

Generate 8-12 sections. Use personalization tokens {{first_name}} and {{company}} in hero. Prioritize CLARITY over cleverness.

---

GENERAL PAGE FRAMEWORK (use for everything else — marketing, lead magnets, fundraisers, ebooks, events, portfolios, nonprofits, etc.):

Use your best judgment to create a page structure that fits the purpose. General guidelines:
- Start with a compelling hero that clearly communicates what the page is about
- Organize content logically for the specific use case (e.g., event details for events, chapter previews for ebooks, mission/impact for nonprofits, donation tiers for fundraisers)
- Use sections that make sense for the content — not every page needs testimonials, comparisons, or FAQ
- Keep copy clear, direct, and appropriate for the tone (professional, casual, urgent, inspirational — match the purpose)
- Include a clear call-to-action relevant to the goal (download, donate, register, learn more, etc.)
- Use personalization tokens {{first_name}} and {{company}} ONLY if the page is for outreach — skip them for public-facing pages like fundraisers or ebooks
- Generate 6-10 sections appropriate for the content

---

IMPORTANT COLOR RULES (apply to ALL page types):
- NEVER use black, dark gray, or any dark colors (e.g. #000000, #111111, #1a1a1a, #222222, #333333) as backgroundColor for ANY section.
- Use light, bright, or medium-tone backgrounds only (whites, light grays, pastels, soft brand colors).
- Ensure all text colors have strong contrast against the background.
- Button colors should be vibrant and clearly visible.
- Alternate between white (#ffffff) and light gray (#f8fafc or #f1f5f9) backgrounds for visual rhythm.

Return ONLY a valid JSON array, no markdown, no explanation.`;

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
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
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
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || "";

    // Extract JSON from response (strip markdown fences if present)
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error("Could not parse AI response:", raw);
      throw new Error("AI did not return valid JSON");
    }

    const sections = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify({ sections }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-generate-page error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
