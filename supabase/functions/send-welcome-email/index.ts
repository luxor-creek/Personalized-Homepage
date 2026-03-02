import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

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

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, full_name } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Missing email" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const safeName = escapeHtml((full_name || "there").slice(0, 100));
    const safeEmail = escapeHtml(email.slice(0, 255));

    // Send welcome email to user
    const emailResponse = await resend.emails.send({
      from: "Kicker Video <onboarding@resend.dev>",
      to: [safeEmail],
      subject: "Welcome to Kicker Video! Your 14-day trial starts now 🎬",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1f2937; margin-bottom: 5px;">Welcome to Kicker Video!</h1>
            <p style="color: #6b7280; font-size: 16px;">Your personalized outreach platform</p>
          </div>

          <div style="background: #f9fafb; padding: 24px; border-radius: 12px; margin-bottom: 24px;">
            <p style="margin: 0 0 16px; font-size: 16px; color: #1f2937;">
              Hi ${safeName},
            </p>
            <p style="margin: 0 0 16px; font-size: 15px; color: #374151;">
              Thanks for signing up! Your <strong>14-day free trial</strong> is now active. Here's what you can do:
            </p>
            <ul style="color: #374151; font-size: 15px; line-height: 1.8; padding-left: 20px;">
              <li>Create personalized landing pages for your prospects</li>
              <li>Launch campaigns with CSV or Google Sheet imports</li>
              <li>Track page views and engagement analytics</li>
              <li>Use our visual page builder and templates</li>
            </ul>
          </div>

          <div style="text-align: center; margin-bottom: 24px;">
            <a href="https://personalized.page/admin"
               style="display: inline-block; background: #f59e0b; color: #1f2937; font-weight: 600; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-size: 16px;">
              Go to Dashboard →
            </a>
          </div>

          <div style="border-top: 1px solid #e5e7eb; padding-top: 16px; text-align: center;">
            <p style="color: #9ca3af; font-size: 13px; margin: 0;">
              Questions? Reply to this email or contact us at paul@kickervideo.com
            </p>
          </div>
        </div>
      `,
    });

    console.log("Welcome email sent:", emailResponse);

    // Also notify admin
    await resend.emails.send({
      from: "Kicker Video <onboarding@resend.dev>",
      to: ["paul@kickervideo.com"],
      subject: `New signup: ${safeName} (${safeEmail})`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1f2937;">🎉 New User Signup</h2>
          <div style="background: #f9fafb; padding: 16px; border-radius: 8px;">
            <p><strong>Name:</strong> ${safeName}</p>
            <p><strong>Email:</strong> ${safeEmail}</p>
            <p><strong>Trial:</strong> 14 days starting now</p>
          </div>
        </div>
      `,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-welcome-email:", error);
    return new Response(JSON.stringify({ error: "Failed to send welcome email" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
