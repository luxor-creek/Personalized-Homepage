import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { firstName, lastName, company, email, phone, source, tool } = await req.json();

    if (!firstName || !lastName || !company || !email) {
      return new Response(JSON.stringify({ error: "Missing required fields: firstName, lastName, company, email" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Insert into Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error: dbError } = await supabase.from("beta_signups").insert({
      first_name: firstName.slice(0, 100),
      last_name: lastName.slice(0, 100),
      company: company.slice(0, 200),
      email: email.slice(0, 255),
      phone: phone ? phone.slice(0, 30) : null,
      source: source || "homepage",
      tool: tool || null,
    });

    if (dbError) {
      console.error("DB insert error:", dbError);
    }

    // Send admin notification via Resend
    const safeFirst = escapeHtml(firstName.slice(0, 100));
    const safeLast = escapeHtml(lastName.slice(0, 100));
    const safeCompany = escapeHtml(company.slice(0, 200));
    const safeEmail = escapeHtml(email.slice(0, 255));
    const safePhone = phone ? escapeHtml(phone.slice(0, 30)) : "\u2014";
    const safeSource = escapeHtml(source || "homepage");
    const safeTool = tool ? escapeHtml(tool) : "\u2014";

    const sourceLabel = safeSource === "snovio" ? "Snov.io Partner Page"
      : safeSource === "mailchimp" ? "Mailchimp Partner Page"
      : "Homepage";

    const emailResponse = await resend.emails.send({
      from: "Personalized.page <onboarding@resend.dev>",
      to: ["paul@kickervideo.com"],
      subject: `New Beta Signup: ${safeFirst} ${safeLast} \u2014 ${safeCompany}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1f2937; border-bottom: 3px solid #6B3FA0; padding-bottom: 12px; margin-bottom: 24px;">
            New Beta Signup
          </h1>
          <div style="background: #f9fafb; padding: 24px; border-radius: 12px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; width: 120px; vertical-align: top;">Name</td>
                <td style="padding: 8px 0; color: #111827; font-weight: 600;">${safeFirst} ${safeLast}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; vertical-align: top;">Company</td>
                <td style="padding: 8px 0; color: #111827; font-weight: 600;">${safeCompany}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; vertical-align: top;">Email</td>
                <td style="padding: 8px 0;"><a href="mailto:${safeEmail}" style="color: #6B3FA0; font-weight: 600;">${safeEmail}</a></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; vertical-align: top;">Phone</td>
                <td style="padding: 8px 0; color: #111827;">${safePhone}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; vertical-align: top;">Source</td>
                <td style="padding: 8px 0; color: #111827;">${sourceLabel}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; vertical-align: top;">Tool</td>
                <td style="padding: 8px 0; color: #111827;">${safeTool}</td>
              </tr>
            </table>
          </div>
          <p style="color: #6b7280; font-size: 13px; margin-top: 24px;">
            This person is waiting for you to add them manually.
            <a href="https://personalized.page/admin-dashboard" style="color: #6B3FA0;">Go to Admin Dashboard →</a>
          </p>
        </div>
      `,
    });

    console.log("Beta notification email sent:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-beta-notification:", error);
    return new Response(JSON.stringify({ error: "Failed to process signup" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
