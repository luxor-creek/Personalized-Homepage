import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { getSnovCredentials, getSnovAccessToken } from "../_shared/get-snov-credentials.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const jsonResponse = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

interface SnovProspect {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  emails: Array<{ email: string; status: string }>;
  locality?: string;
  company?: string;
}

interface SendCampaignRequest {
  listId: number;
  campaignId: string;
  snovCampaignListId: number;
  templateId?: string;
}

async function getProspectsFromList(accessToken: string, listId: number): Promise<SnovProspect[]> {
  console.log(`Fetching prospects from list ${listId}...`);
  const allProspects: SnovProspect[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const formData = new URLSearchParams();
    formData.append("access_token", accessToken);
    formData.append("listId", listId.toString());
    formData.append("page", page.toString());
    formData.append("perPage", "100");

    const response = await fetch("https://api.snov.io/v1/prospect-list", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to fetch prospects (page ${page}): ${error}`);
    }

    const data = await response.json();
    if (data.prospects && data.prospects.length > 0) {
      allProspects.push(...data.prospects);
      page++;
    } else {
      hasMore = false;
    }
    if (allProspects.length >= 1000) hasMore = false;
  }

  console.log(`Total prospects fetched: ${allProspects.length}`);
  return allProspects;
}

async function addProspectToSnovList(
  accessToken: string,
  listId: number,
  prospect: { email: string; firstName: string; lastName: string; company?: string; landingPageUrl: string }
): Promise<{ success: boolean; error?: string; snov?: unknown }> {
  const formData = new URLSearchParams();
  formData.append("access_token", accessToken);
  formData.append("email", prospect.email);
  formData.append("fullName", `${prospect.firstName} ${prospect.lastName}`.trim());
  formData.append("firstName", prospect.firstName);
  formData.append("lastName", prospect.lastName);
  formData.append("listId", listId.toString());
  formData.append("updateContact", "1");
  if (prospect.company) formData.append("companyName", prospect.company);
  formData.append("customFields[landing_page]", prospect.landingPageUrl);

  const response = await fetch("https://api.snov.io/v1/add-prospect-to-list", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData.toString(),
  });

  const responseText = await response.text();
  if (!response.ok) return { success: false, error: responseText };

  try {
    const data = JSON.parse(responseText);
    if (data.success) return { success: true, snov: data };
    return { success: false, error: data.message || "Unknown error", snov: data };
  } catch {
    return { success: true };
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return jsonResponse({ success: false, error: "Not authenticated. Please log in again." });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await authClient.auth.getUser();
    if (userError || !user) {
      return jsonResponse({ success: false, error: "Session expired. Please log in again." });
    }

    const userId = user.id;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { listId, campaignId, snovCampaignListId, templateId }: SendCampaignRequest = await req.json();

    if (!listId || !campaignId || !snovCampaignListId) {
      return jsonResponse({ success: false, error: "Missing required fields: listId, campaignId, or snovCampaignListId" });
    }

    // Verify campaign ownership
    const { data: campaignData, error: campaignError } = await supabase
      .from("campaigns")
      .select("user_id")
      .eq("id", campaignId)
      .single();

    if (campaignError || !campaignData) {
      return jsonResponse({ success: false, error: "Campaign not found. It may have been deleted." });
    }
    if (campaignData.user_id !== userId) {
      return jsonResponse({ success: false, error: "You don't have access to this campaign." });
    }

    let clientId: string, clientSecret: string;
    try {
      ({ clientId, clientSecret } = await getSnovCredentials(authClient, userId));
    } catch (e: any) {
      if (e.message === "SNOV_NOT_CONFIGURED") {
        return jsonResponse({
          success: false,
          error: "Snov.io is not connected. Go to Settings \u2192 Integrations to add your Snov.io API credentials.",
          code: "SNOV_NOT_CONFIGURED",
        });
      }
      throw e;
    }

    const accessToken = await getSnovAccessToken(clientId, clientSecret);
    const prospects = await getProspectsFromList(accessToken, listId);

    if (prospects.length === 0) {
      return jsonResponse({ success: true, message: "No prospects found in the selected list.", added: 0, errors: 0, total: 0 });
    }

    const baseUrl = Deno.env.get("SITE_BASE_URL") || "https://video.kickervideo.com";
    let addedCount = 0;
    let errorCount = 0;
    const results: Array<{ email: string; success: boolean; pageUrl?: string; error?: string }> = [];

    for (const prospect of prospects) {
      const primaryEmail = prospect.emails?.find(e => e.status === "valid")?.email || prospect.emails?.[0]?.email;
      if (!primaryEmail) { results.push({ email: "unknown", success: false, error: "No valid email" }); errorCount++; continue; }

      try {
        const firstName = prospect.firstName || prospect.name?.split(" ")[0] || "Friend";
        const lastName = prospect.lastName || prospect.name?.split(" ").slice(1).join(" ") || null;

        const { data: pageData, error: pageError } = await supabase
          .from("personalized_pages")
          .insert({ campaign_id: campaignId, first_name: firstName, last_name: lastName, company: prospect.company || null, template_id: templateId || null })
          .select("token")
          .single();

        if (pageError) { results.push({ email: primaryEmail, success: false, error: pageError.message }); errorCount++; continue; }

        const pageUrl = `${baseUrl}/view/${pageData.token}`;
        const addResult = await addProspectToSnovList(accessToken, snovCampaignListId, {
          email: primaryEmail, firstName, lastName: lastName || "", company: prospect.company, landingPageUrl: pageUrl,
        });

        if (addResult.success) { addedCount++; results.push({ email: primaryEmail, success: true, pageUrl }); }
        else { errorCount++; results.push({ email: primaryEmail, success: false, pageUrl, error: addResult.error }); }

        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        results.push({ email: primaryEmail, success: false, error: errorMessage });
        errorCount++;
      }
    }

    return jsonResponse({
      success: true,
      message: `Added ${addedCount} of ${prospects.length} prospects`,
      added: addedCount,
      errors: errorCount,
      total: prospects.length,
      snovCampaignListId,
      results,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error in snov-send-campaign:", error);
    return jsonResponse({ success: false, error: errorMessage });
  }
};

serve(handler);
