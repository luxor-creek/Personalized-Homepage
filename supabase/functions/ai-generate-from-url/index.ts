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

    const { url } = await req.json();
    if (!url || typeof url !== "string" || url.length > 2000) {
      return new Response(JSON.stringify({ error: "url is required (max 2000 chars)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) throw new Error("FIRECRAWL_API_KEY is not configured");

    const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY");
    if (!DEEPSEEK_API_KEY) throw new Error("DEEPSEEK_API_KEY is not configured");

    // Step 1: Scrape the URL with Firecrawl
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log("Scraping URL:", formattedUrl);

    const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: ["markdown"],
        onlyMainContent: true,
      }),
    });

    const scrapeData = await scrapeResponse.json();
    if (!scrapeResponse.ok) {
      console.error("Firecrawl error:", scrapeData);
      throw new Error(scrapeData.error || "Failed to scrape URL");
    }

    const pageContent = scrapeData.data?.markdown || scrapeData.markdown || "";
    const pageTitle = scrapeData.data?.metadata?.title || scrapeData.metadata?.title || "";

    if (!pageContent) {
      throw new Error("Could not extract content from the URL");
    }

    // Step 2: Feed scraped content to AI to generate sections
    const systemPrompt = `You are an expert page architect. You will be given the scraped content of a landing page. Your job is to analyze the page structure, copy, and layout, then recreate it as a JSON array of page sections for a drag-and-drop page builder.

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

IMPORTANT COLOR RULES:
- NEVER use black, dark gray, or any dark colors (e.g. #000000, #111111, #1a1a1a, #222222, #333333) as backgroundColor for ANY section.
- Use light, bright, or medium-tone backgrounds only (whites, light grays, pastels, soft brand colors).
- Alternate between white (#ffffff) and light gray (#f8fafc or #f1f5f9) backgrounds for visual rhythm.

Recreate the page as closely as possible — preserve the headlines, copy, structure, and tone. Adapt it to the available section types. Generate 6-12 sections.

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
          { role: "user", content: `Here is the scraped content of a landing page titled "${pageTitle}":\n\n${pageContent.substring(0, 15000)}` },
        ],
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || "";

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
    console.error("ai-generate-from-url error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
