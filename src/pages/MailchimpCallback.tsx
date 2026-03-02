import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

export default function MailchimpCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Connecting to Mailchimp...");

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      setStatus("error");
      setMessage("No authorization code received from Mailchimp.");
      return;
    }

    (async () => {
      try {
        const session = (await supabase.auth.getSession()).data.session;
        if (!session) {
          setStatus("error");
          setMessage("You need to be logged in. Please log in and try again.");
          return;
        }

        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mailchimp-oauth`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              "Content-Type": "application/json",
              apikey: import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
            body: JSON.stringify({ code }),
          }
        );

        const data = await res.json();

        if (data.success) {
          setStatus("success");
          setMessage(`Connected to Mailchimp as ${data.account_name || data.login_email || "your account"}!`);
          // Redirect back to admin settings after 2 seconds
          setTimeout(() => {
            navigate("/admin?tab=settings&mailchimp=connected");
          }, 1500);
        } else {
          setStatus("error");
          setMessage(data.error || "Failed to connect to Mailchimp.");
        }
      } catch (err: any) {
        setStatus("error");
        setMessage(err.message || "Something went wrong.");
      }
    })();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4 max-w-sm mx-auto p-8">
        {status === "loading" && (
          <>
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
            <p className="text-lg font-medium text-foreground">{message}</p>
            <p className="text-sm text-muted-foreground">Exchanging credentials...</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
            <p className="text-lg font-medium text-foreground">{message}</p>
            <p className="text-sm text-muted-foreground">Redirecting to dashboard...</p>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle className="w-12 h-12 text-red-500 mx-auto" />
            <p className="text-lg font-medium text-foreground">Connection Failed</p>
            <p className="text-sm text-muted-foreground">{message}</p>
            <button
              onClick={() => navigate("/admin?tab=settings")}
              className="text-primary hover:underline text-sm mt-4 inline-block"
            >
              Back to Settings
            </button>
          </>
        )}
      </div>
    </div>
  );
}
