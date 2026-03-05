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

async function fetchCampaignAnalytics(accessToken: string, snovCampaignId?: number): Promise<unknown> {
  const params = new URLSearchParams();
  params.append("access_token", accessToken);
  if (snovCampaignId) params.append("campaign_id", snovCampaignId.toString());

  const response = await fetch(`https://api.snov.io/v2/statistics/campaign-analytics?${params.toString()}`);
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch campaign analytics: ${error}`);
  }
  return response.json();
}

async function fetchCampaignReplies(accessToken: string, snovCampaignId: number): Promise<unknown> {
  const params = new URLSearchParams();
  params.append("access_token", accessToken);
  params.append("campaign_id", snovCampaignId.toString());
  const response = await fetch(`https://api.snov.io/v1/campaigns/${snovCampaignId}/replies?${params.toString()}`);
  if (!response.ok) return { replies: [] };
  return response.json();
}

async function fetchCampaignOpens(accessToken: string, snovCampaignId: number): Promise<unknown> {
  const params = new URLSearchParams();
  params.append("access_token", accessToken);
  params.append("campaign_id", snovCampaignId.toString());
  const response = await fetch(`https://api.snov.io/v1/campaigns/${snovCampaignId}/opened?${params.toString()}`);
  if (!response.ok) return { recipients: [] };
  return response.json();
}

async function fetchCampaignClicks(accessToken: string, snovCampaignId: number): Promise<unknown> {
  const params = new URLSearchParams();
  params.append("access_token", accessToken);
  params.append("campaign_id", snovCampaignId.toString());
  const response = await fetch(`https://api.snov.io/v1/campaigns/${snovCampaignId}/link-clicks?${params.toString()}`);
  if (!response.ok) return { recipients: [] };
  return response.json();
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
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return jsonResponse({ success: false, error: "Session expired. Please log in again." });
    }

    const userId = user.id;

    const url = new URL(req.url);
    const snovCampaignIdParam = url.searchParams.get("snovCampaignId");
    const snovCampaignId = snovCampaignIdParam ? parseInt(snovCampaignIdParam, 10) : undefined;

    console.log(`Fetching Snov.io stats${snovCampaignId ? ` for campaign ${snovCampaignId}` : " (all campaigns)"}...`);

    let clientId: string, clientSecret: string;
    try {
      ({ clientId, clientSecret } = await getSnovCredentials(supabase, userId));
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
    const analytics = await fetchCampaignAnalytics(accessToken, snovCampaignId);

    let replies = null;
    let opens = null;
    let clicks = null;

    if (snovCampaignId) {
      [replies, opens, clicks] = await Promise.all([
        fetchCampaignReplies(accessToken, snovCampaignId),
        fetchCampaignOpens(accessToken, snovCampaignId),
        fetchCampaignClicks(accessToken, snovCampaignId),
      ]);
    }

    return jsonResponse({ success: true, analytics, replies, opens, clicks });
  } catch (error: any) {
    console.error("Error in snov-get-campaign-stats:", error);
    return jsonResponse({ success: false, error: error.message || "An unexpected error occurred" });
  }
};

serve(handler);
