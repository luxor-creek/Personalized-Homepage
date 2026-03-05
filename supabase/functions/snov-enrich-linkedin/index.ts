import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { getSnovCredentials, getSnovAccessToken } from "../_shared/get-snov-credentials.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Extract domain from company name or URL
function extractDomain(company: string): string | null {
  if (!company) return null;
  if (company.includes(".") && !company.includes(" ")) return company.toLowerCase();
  return company.toLowerCase().replace(/[^a-z0-9]/g, "") + ".com";
}

// Use Snov.io email finder to get email from name + domain
async function findEmailByName(token: string, firstName: string, lastName: string, domain: string): Promise<string | null> {
  try {
    const startRes = await fetch("https://api.snov.io/v2/email-finder/start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ first_name: firstName, last_name: lastName, domain }),
    });

    const startData = await startRes.json();
    console.log("Email finder start:", JSON.stringify(startData));

    const taskHash = startData.data?.task_hash;
    if (!taskHash) {
      const v1Res = await fetch("https://api.snov.io/v1/get-emails-from-names", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: token, firstName, lastName, domain }),
      });
      const v1Data = await v1Res.json();
      console.log("Email finder V1 fallback:", JSON.stringify(v1Data));
      if (v1Data.data?.emails?.[0]?.email) return v1Data.data.emails[0].email;
      if (v1Data.emails?.[0]?.email) return v1Data.emails[0].email;
      return null;
    }

    for (let i = 0; i < 8; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const resultRes = await fetch(
        `https://api.snov.io/v2/email-finder/result?task_hash=${taskHash}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const resultData = await resultRes.json();
      console.log(`Email finder poll ${i + 1}:`, JSON.stringify(resultData));

      if (resultData.status === "completed" || resultData.data?.status === "completed") {
        const emails = resultData.data?.emails || resultData.emails;
        if (emails?.[0]?.email) return emails[0].email;
        return null;
      }
      if (resultData.status === "failed") return null;
    }
    return null;
  } catch (err) {
    console.error("Email finder error:", err);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated. Please log in again." }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Session expired. Please log in again." }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;

    const { linkedin_url } = await req.json();
    if (!linkedin_url || !linkedin_url.includes("linkedin.com")) {
      return new Response(JSON.stringify({ error: "Valid LinkedIn URL is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { clientId, clientSecret } = await getSnovCredentials(supabaseClient, userId);
    const token = await getSnovAccessToken(clientId, clientSecret);

    // Step 1: Start LinkedIn profile enrichment
    const startRes = await fetch("https://api.snov.io/v2/li-profiles-by-urls/start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ urls: [linkedin_url] }),
    });

    const startData = await startRes.json();
    console.log("Snov enrichment start response:", JSON.stringify(startData));

    if (!startData.success && !startData.data?.task_hash) {
      console.log("V2 failed, trying V1 email finder by URL...");
      const v1Res = await fetch("https://api.snov.io/v1/get-profile-by-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: token, url: linkedin_url }),
      });
      const v1Data = await v1Res.json();
      console.log("V1 fallback response:", JSON.stringify(v1Data));

      if (v1Data.data || v1Data.firstName) {
        const d = v1Data.data || v1Data;
        return new Response(JSON.stringify({
          success: true,
          contact: {
            first_name: d.firstName || d.first_name || "",
            last_name: d.lastName || d.last_name || "",
            email: d.emails?.[0]?.email || d.email || "",
            company: d.currentJob?.[0]?.companyName || d.company || "",
            job_title: d.currentJob?.[0]?.position || d.position || "",
            photo_url: d.photo || d.avatar || d.image || "",
            linkedin_url,
          },
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "No contact data found for this LinkedIn profile" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const taskHash = startData.data?.task_hash;

    // Step 2: Poll for profile results (up to 30s)
    const maxAttempts = 10;
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((r) => setTimeout(r, 3000));

      const resultRes = await fetch(
        `https://api.snov.io/v2/li-profiles-by-urls/result?task_hash=${taskHash}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const resultData = await resultRes.json();
      console.log(`Poll attempt ${i + 1}:`, JSON.stringify(resultData));

      const isCompleted = resultData.status === "completed" || resultData.data?.status === "completed";
      const results = Array.isArray(resultData.data) ? resultData.data : resultData.data?.results;

      if (isCompleted && results?.length > 0) {
        const entry = results[0];
        const profile = entry.result || entry;
        if (!profile) {
          return new Response(JSON.stringify({ error: "No contact data found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const position = profile.positions?.[0];
        const companyName = position?.name || profile.currentCompany || profile.company || "";
        const jobTitle = position?.title || profile.currentPosition || profile.position || "";
        const firstName = profile.first_name || profile.firstName || "";
        const lastName = profile.last_name || profile.lastName || "";
        let email = profile.emails?.[0]?.email || profile.email || "";
        const photoUrl = profile.photo || profile.avatar || profile.image || profile.profile_pic || "";

        // Step 3: If no email found, use Email Finder with name + company domain
        if (!email && firstName && lastName && companyName) {
          const domain = extractDomain(companyName);
          if (domain) {
            console.log(`No email from profile. Trying email finder: ${firstName} ${lastName} @ ${domain}`);
            const foundEmail = await findEmailByName(token, firstName, lastName, domain);
            if (foundEmail) {
              email = foundEmail;
              console.log(`Email finder found: ${foundEmail}`);
            }
          }
        }

        return new Response(JSON.stringify({
          success: true,
          contact: {
            first_name: firstName,
            last_name: lastName,
            email,
            company: companyName,
            job_title: jobTitle,
            photo_url: photoUrl,
            linkedin_url,
          },
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const isFailed = resultData.status === "failed" || resultData.data?.status === "failed";
      if (isFailed) {
        return new Response(JSON.stringify({ error: "Enrichment failed for this profile" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ error: "Enrichment timed out. Try again in a moment." }), {
      status: 408,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in snov-enrich-linkedin:", error);
    return new Response(JSON.stringify({ error: error.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
