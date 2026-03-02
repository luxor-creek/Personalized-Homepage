import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { getMailchimpCredentials, mailchimpFetch } from "../_shared/get-mailchimp-credentials.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface MailchimpMember {
  id: string;
  email_address: string;
  merge_fields: Record<string, string>;
  status: string;
}

interface SendRequest {
  listId: string;        // Mailchimp audience ID
  campaignId: string;    // Our campaign ID
  templateId?: string;   // Our template ID
}

// Ensure the PPAGE merge field exists on the audience
async function ensureMergeField(apiKey: string, server: string, listId: string): Promise<void> {
  // Check if PPAGE merge field already exists
  const res = await mailchimpFetch(apiKey, server, `/lists/${listId}/merge-fields?count=100`);
  if (!res.ok) throw new Error(`Failed to fetch merge fields: ${await res.text()}`);

  const data = await res.json();
  const exists = (data.merge_fields || []).some((f: any) => f.tag === "PPAGE");

  if (!exists) {
    console.log("Creating PPAGE merge field on audience...");
    const createRes = await mailchimpFetch(apiKey, server, `/lists/${listId}/merge-fields`, {
      method: "POST",
      body: JSON.stringify({
        name: "Personalized Page",
        tag: "PPAGE",
        type: "url",
        public: false,
      }),
    });
    if (!createRes.ok) {
      const errText = await createRes.text();
      // 400 with "already exists" is fine
      if (!errText.includes("already exists")) {
        throw new Error(`Failed to create PPAGE merge field: ${errText}`);
      }
    }
    console.log("PPAGE merge field created");
  }
}

// Fetch all subscribed members from a list (paginated)
async function fetchMembers(apiKey: string, server: string, listId: string): Promise<MailchimpMember[]> {
  const allMembers: MailchimpMember[] = [];
  let offset = 0;
  const count = 100;
  let hasMore = true;

  while (hasMore) {
    const res = await mailchimpFetch(
      apiKey, server,
      `/lists/${listId}/members?status=subscribed&count=${count}&offset=${offset}&fields=members.id,members.email_address,members.merge_fields,members.status`
    );

    if (!res.ok) throw new Error(`Failed to fetch members: ${await res.text()}`);

    const data = await res.json();
    const members = data.members || [];
    allMembers.push(...members);

    if (members.length < count) {
      hasMore = false;
    } else {
      offset += count;
    }

    // Safety cap at 2000 members
    if (allMembers.length >= 2000) hasMore = false;
  }

  return allMembers;
}

// Update a single member's merge field with their personalized page URL
async function updateMemberMergeField(
  apiKey: string,
  server: string,
  listId: string,
  subscriberHash: string,
  pageUrl: string
): Promise<{ success: boolean; error?: string }> {
  const res = await mailchimpFetch(
    apiKey, server,
    `/lists/${listId}/members/${subscriberHash}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        merge_fields: { PPAGE: pageUrl },
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    return { success: false, error: errText };
  }
  return { success: true };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const jwt = authHeader.replace("Bearer ", "").trim();
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(jwt);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub as string;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { listId, campaignId, templateId }: SendRequest = await req.json();

    // Verify campaign belongs to user
    const { data: campaignData, error: campaignError } = await supabase
      .from("campaigns")
      .select("user_id")
      .eq("id", campaignId)
      .single();

    if (campaignError || !campaignData || campaignData.user_id !== userId) {
      return new Response(
        JSON.stringify({ success: false, error: "Access denied" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!listId || !campaignId) {
      throw new Error("Missing required fields: listId and campaignId");
    }

    const { apiKey, server } = await getMailchimpCredentials(authClient, userId);

    // Step 1: Ensure PPAGE merge field exists
    console.log("Ensuring PPAGE merge field exists...");
    await ensureMergeField(apiKey, server, listId);

    // Step 2: Fetch all subscribed members
    console.log(`Fetching members from audience ${listId}...`);
    const members = await fetchMembers(apiKey, server, listId);

    if (members.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No subscribed members found in audience", added: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${members.length} members...`);
    const baseUrl = Deno.env.get("SITE_BASE_URL") || "https://video.kickervideo.com";
    let addedCount = 0;
    let errorCount = 0;
    const results: Array<{ email: string; success: boolean; pageUrl?: string; error?: string }> = [];

    for (const member of members) {
      try {
        const email = member.email_address;
        const firstName = member.merge_fields?.FNAME || email.split("@")[0] || "Friend";
        const lastName = member.merge_fields?.LNAME || null;
        const company = member.merge_fields?.COMPANY || member.merge_fields?.MMERGE3 || null;

        // Create personalized page
        const { data: pageData, error: pageError } = await supabase
          .from("personalized_pages")
          .insert({
            campaign_id: campaignId,
            first_name: firstName,
            last_name: lastName,
            company: company,
            email: email,
            template_id: templateId || null,
          })
          .select("token")
          .single();

        if (pageError) {
          results.push({ email, success: false, error: pageError.message });
          errorCount++;
          continue;
        }

        const pageUrl = `${baseUrl}/view/${pageData.token}`;

        // MD5 hash of lowercase email = subscriber hash for Mailchimp API
        const encoder = new TextEncoder();
        const data = encoder.encode(email.toLowerCase());
        const hashBuffer = await crypto.subtle.digest("MD5", data);
        const subscriberHash = Array.from(new Uint8Array(hashBuffer))
          .map(b => b.toString(16).padStart(2, "0"))
          .join("");

        // Update merge field with personalized page URL
        const updateResult = await updateMemberMergeField(apiKey, server, listId, subscriberHash, pageUrl);

        if (updateResult.success) {
          addedCount++;
          results.push({ email, success: true, pageUrl });
        } else {
          errorCount++;
          results.push({ email, success: false, pageUrl, error: updateResult.error });
        }

        // Rate limiting — Mailchimp allows 10 concurrent connections
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        results.push({ email: member.email_address, success: false, error: errorMessage });
        errorCount++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Enriched ${addedCount} contacts with personalized links`,
        added: addedCount,
        errors: errorCount,
        total: members.length,
        mergeTag: "*|PPAGE|*",
        results,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error in mailchimp-send-campaign:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
