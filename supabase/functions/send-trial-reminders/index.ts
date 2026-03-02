import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const escapeHtml = (str: string): string => {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(threeDaysFromNow.getTime() - 24 * 60 * 60 * 1000);

    // Find trial users whose trial expires in ~3 days (within a 24h window)
    const { data: expiringUsers, error: expErr } = await supabase
      .from("profiles")
      .select("id, user_id, email, full_name, trial_ends_at")
      .eq("plan", "trial")
      .eq("trial_reminder_sent", false)
      .gte("trial_ends_at", threeDaysAgo.toISOString())
      .lte("trial_ends_at", threeDaysFromNow.toISOString());

    if (expErr) {
      console.error("Error fetching expiring trials:", expErr);
    }

    // Find trial users whose trial expired today (within last 24h)
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const { data: expiredUsers, error: expiredErr } = await supabase
      .from("profiles")
      .select("id, user_id, email, full_name, trial_ends_at")
      .eq("plan", "trial")
      .eq("trial_expired_email_sent", false)
      .gte("trial_ends_at", oneDayAgo.toISOString())
      .lte("trial_ends_at", now.toISOString());

    if (expiredErr) {
      console.error("Error fetching expired trials:", expiredErr);
    }

    let sentCount = 0;

    // Send "trial expiring soon" emails
    for (const user of (expiringUsers || [])) {
      if (!user.email) continue;
      const safeName = escapeHtml((user.full_name || "there").slice(0, 100));
      const daysLeft = Math.max(0, Math.ceil(
        (new Date(user.trial_ends_at!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      ));

      try {
        await resend.emails.send({
          from: "Kicker Video <onboarding@resend.dev>",
          to: [user.email],
          subject: `Your trial expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""} ⏰`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #1f2937; margin-bottom: 5px;">Your trial is ending soon</h1>

              <div style="background: #fffbeb; border: 1px solid #f59e0b; padding: 20px; border-radius: 12px; margin: 20px 0;">
                <p style="margin: 0 0 12px; font-size: 16px; color: #1f2937;">
                  Hi ${safeName},
                </p>
                <p style="margin: 0 0 12px; font-size: 15px; color: #374151;">
                  Your free trial expires in <strong>${daysLeft} day${daysLeft !== 1 ? "s" : ""}</strong>.
                  Upgrade now to keep your personalized pages live and continue creating campaigns.
                </p>
              </div>

              <div style="text-align: center; margin: 24px 0;">
                <a href="https://personalized.page/pricing"
                   style="display: inline-block; background: #f59e0b; color: #1f2937; font-weight: 600; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-size: 16px;">
                  View Plans & Upgrade →
                </a>
              </div>

              <p style="color: #9ca3af; font-size: 13px; text-align: center;">
                Questions? Reply to this email or contact paul@kickervideo.com
              </p>
            </div>
          `,
        });
        // Mark as sent to prevent duplicates
        await supabase.from("profiles").update({ trial_reminder_sent: true }).eq("id", user.id);
        sentCount++;
        console.log(`Trial expiring email sent to ${user.email}`);
      } catch (e) {
        console.error(`Failed to send expiring email to ${user.email}:`, e);
      }
    }

    // Send "trial expired" emails
    for (const user of (expiredUsers || [])) {
      if (!user.email) continue;
      const safeName = escapeHtml((user.full_name || "there").slice(0, 100));

      try {
        await resend.emails.send({
          from: "Kicker Video <onboarding@resend.dev>",
          to: [user.email],
          subject: "Your trial has expired — upgrade to continue 🔒",
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #1f2937; margin-bottom: 5px;">Your trial has expired</h1>

              <div style="background: #fef2f2; border: 1px solid #ef4444; padding: 20px; border-radius: 12px; margin: 20px 0;">
                <p style="margin: 0 0 12px; font-size: 16px; color: #1f2937;">
                  Hi ${safeName},
                </p>
                <p style="margin: 0 0 12px; font-size: 15px; color: #374151;">
                  Your 14-day free trial has ended. Your personalized pages are no longer live,
                  and you can't create new campaigns until you upgrade.
                </p>
                <p style="margin: 0; font-size: 15px; color: #374151;">
                  Don't worry — all your data is saved. Upgrade to pick up right where you left off.
                </p>
              </div>

              <div style="text-align: center; margin: 24px 0;">
                <a href="https://personalized.page/pricing"
                   style="display: inline-block; background: #ef4444; color: #ffffff; font-weight: 600; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-size: 16px;">
                  Upgrade Now →
                </a>
              </div>

              <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                <p style="margin: 0; font-size: 14px; color: #374151; text-align: center;">
                  <strong>Starter:</strong> $29/mo · 25 pages &nbsp; | &nbsp;
                  <strong>Pro:</strong> $59/mo · Unlimited
                </p>
              </div>

              <p style="color: #9ca3af; font-size: 13px; text-align: center;">
                Questions? Reply to this email or contact paul@kickervideo.com
              </p>
            </div>
          `,
        });
        await supabase.from("profiles").update({ trial_expired_email_sent: true }).eq("id", user.id);
        sentCount++;
        console.log(`Trial expired email sent to ${user.email}`);
      } catch (e) {
        console.error(`Failed to send expired email to ${user.email}:`, e);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        expiring: expiringUsers?.length || 0,
        expired: expiredUsers?.length || 0,
        emailsSent: sentCount,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-trial-reminders:", error);
    return new Response(JSON.stringify({ error: "Failed to process reminders" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
