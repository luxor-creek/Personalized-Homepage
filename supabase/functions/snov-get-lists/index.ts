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
    console.log(`Fetching Snov.io lists for user ${userId}...`);

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

    const params = new URLSearchParams();
    params.append("access_token", accessToken);

    const response = await fetch(`https://api.snov.io/v1/get-user-lists?${params.toString()}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to fetch lists:", errorText);
      return jsonResponse({
        success: false,
        error: `Snov.io API error: ${response.status}. This usually means the account or plan doesn't have API access to lists.`,
      });
    }

    const listsArray = await response.json();
    console.log(`Fetched ${Array.isArray(listsArray) ? listsArray.length : 0} lists`);

    return jsonResponse({ success: true, lists: Array.isArray(listsArray) ? listsArray : [] });
  } catch (error: any) {
    console.error("Error in snov-get-lists:", error);
    return jsonResponse({ success: false, error: error.message || "An unexpected error occurred" });
  }
};

serve(handler);
