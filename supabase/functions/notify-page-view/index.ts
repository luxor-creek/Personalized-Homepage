import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const escapeHtml = (str: string): string => {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { personalized_page_id } = await req.json();

    if (!personalized_page_id) {
      return new Response(JSON.stringify({ error: "personalized_page_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role to look up data across tables
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get the personalized page + campaign + owner info
    const { data: page, error: pageError } = await supabase
      .from("personalized_pages")
      .select("id, first_name, last_name, company, email, campaign_id")
      .eq("id", personalized_page_id)
      .single();

    if (pageError || !page) {
      console.error("Page not found:", pageError);
      return new Response(JSON.stringify({ error: "Page not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get campaign and owner
    const { data: campaign, error: campError } = await supabase
      .from("campaigns")
      .select("id, name, user_id, alert_on_view")
      .eq("id", page.campaign_id)
      .single();

    if (campError || !campaign) {
      console.error("Campaign not found:", campError);
      return new Response(JSON.stringify({ error: "Campaign not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Skip email if alerts are disabled for this campaign
    if (!campaign.alert_on_view) {
      console.log("Alert disabled for campaign", campaign.id);
      return new Response(JSON.stringify({ success: true, skipped: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get campaign owner's email
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("user_id", campaign.user_id)
      .single();

    if (profileError || !profile?.email) {
      console.error("Owner profile not found:", profileError);
      return new Response(JSON.stringify({ error: "Owner not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prospectName = escapeHtml(`${page.first_name} ${page.last_name || ""}`.trim());
    const prospectCompany = escapeHtml(page.company || "Unknown");
    const prospectEmail = escapeHtml(page.email || "Not provided");
    const campaignName = escapeHtml(campaign.name);
    const ownerName = escapeHtml(profile.full_name || "there");
    const timestamp = new Date().toLocaleString("en-US", {
      timeZone: "America/New_York",
      dateStyle: "medium",
      timeStyle: "short",
    });

    // Send alert email to campaign owner
    const emailResponse = await resend.emails.send({
      from: "Kicker Video <onboarding@resend.dev>",
      to: [profile.email],
      subject: `👀 ${prospectName} just viewed their page`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #1f2937; margin-bottom: 5px; font-size: 22px;">🔔 Page View Alert</h1>
            <p style="color: #6b7280; font-size: 14px;">A prospect just viewed their personalized page</p>
          </div>

          <div style="background: #f9fafb; padding: 20px; border-radius: 12px; margin-bottom: 24px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 120px;">Prospect</td>
                <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600;">${prospectName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Company</td>
                <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">${prospectCompany}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Email</td>
                <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">${prospectEmail}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Campaign</td>
                <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">${campaignName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Viewed at</td>
                <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">${timestamp}</td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; margin-bottom: 24px;">
            <a href="https://personalized.page/admin"
               style="display: inline-block; background: #f59e0b; color: #1f2937; font-weight: 600; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-size: 15px;">
              View Campaign Dashboard →
            </a>
          </div>

          <div style="border-top: 1px solid #e5e7eb; padding-top: 12px; text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              This is an automated alert from Kicker Video. Follow up while they're engaged!
            </p>
          </div>
        </div>
      `,
    });

    console.log("Page view alert sent:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in notify-page-view:", error);
    return new Response(JSON.stringify({ error: error.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
