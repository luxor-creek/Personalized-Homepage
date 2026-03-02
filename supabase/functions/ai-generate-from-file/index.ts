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

    const { fileBase64, fileType, fileName } = await req.json();
    if (!fileBase64 || !fileType) {
      return new Response(JSON.stringify({ error: "fileBase64 and fileType are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY");
    if (!DEEPSEEK_API_KEY) throw new Error("DEEPSEEK_API_KEY is not configured");

    const isImage = fileType.startsWith("image/");

    // Build messages based on file type
    const systemPrompt = `You are an expert page architect. You will be given ${isImage ? "an image/screenshot of a landing page or marketing material" : "the text content extracted from a document (PDF, DOCX, etc.)"}. Your job is to analyze it and create a JSON array of page sections for a drag-and-drop page builder.

Available section types and their content fields:
- "hero": text (headline), heroSubheadline, buttonText, buttonLink, secondaryButtonText, heroBadge — USE when source has a prominent headline with CTA buttons but NO large hero image or photo
- "heroImage": text (headline), heroSubheadline, heroImageUrl (leave empty string) — USE when source has a large hero/banner image or photo alongside a headline; this is a two-column image+text layout
- "heroForm": text (headline), heroSubheadline, heroFormFields (array of field names), heroFormButtonText, heroFormTitle, formRecipientEmail (leave empty) — USE when source has a lead-capture form, sign-up form, or contact form prominently in the hero area
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
- NEVER use black, dark gray, or any dark colors as backgroundColor for ANY section.
- Use light, bright, or medium-tone backgrounds only.
- Alternate between white (#ffffff) and light gray (#f8fafc or #f1f5f9) backgrounds for visual rhythm.

${isImage ? "Analyze the visual layout, text, colors, and structure from the image. Pay special attention to the hero area: if there is a large photo or image in the hero, use 'heroImage'. If there is a form/signup in the hero, use 'heroForm'. If the hero is primarily text and buttons with no prominent image, use 'hero'. Recreate the page as closely as possible using the available section types." : "Extract the key information, headlines, descriptions, features, and calls-to-action from the document text. Create a professional landing page layout from this content."}

Generate 6-12 sections. Return ONLY a valid JSON array, no markdown, no explanation.`;

    let userMessage: any;

    if (isImage) {
      const mimeType = fileType || "image/png";
      userMessage = {
        role: "user",
        content: [
          { type: "text", text: `Analyze this ${fileName ? `image (${fileName})` : "image"} and create a landing page layout based on what you see.` },
          { type: "image_url", image_url: { url: `data:${mimeType};base64,${fileBase64}` } },
        ],
      };
    } else {
      let textContent: string;
      try {
        const bytes = Uint8Array.from(atob(fileBase64), (c) => c.charCodeAt(0));
        textContent = new TextDecoder().decode(bytes);
      } catch {
        textContent = atob(fileBase64);
      }
      userMessage = {
        role: "user",
        content: `Here is the content from "${fileName || "document"}":\n\n${textContent.substring(0, 15000)}`,
      };
    }

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
          userMessage,
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
    console.error("ai-generate-from-file error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
