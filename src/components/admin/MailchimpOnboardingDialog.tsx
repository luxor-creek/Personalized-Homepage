import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Check, Loader2, LogOut, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const MAILCHIMP_CLIENT_ID = "583851819514";
const REDIRECT_URI = "https://personalized.page/auth/mailchimp/callback";

interface MailchimpOnboardingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnected?: () => void;
}

export default function MailchimpOnboardingDialog({ open, onOpenChange, onConnected }: MailchimpOnboardingDialogProps) {
  const { toast } = useToast();
  const [connected, setConnected] = useState(false);
  const [accountName, setAccountName] = useState<string | null>(null);
  const [loginEmail, setLoginEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      setLoading(true);
      (async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }
        const { data } = await supabase
          .from("integration_credentials" as any)
          .select("credentials")
          .eq("user_id", user.id)
          .eq("provider", "mailchimp")
          .maybeSingle();
        const creds = (data as any)?.credentials;
        if (creds?.access_token || creds?.api_key) {
          setConnected(true);
          setAccountName(creds.account_name || null);
          setLoginEmail(creds.login_email || null);
        } else {
          setConnected(false);
          setAccountName(null);
          setLoginEmail(null);
        }
        setLoading(false);
      })();
    }
  }, [open]);

  const handleConnect = () => {
    const authUrl = `https://login.mailchimp.com/oauth2/authorize?response_type=code&client_id=${MAILCHIMP_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
    window.location.href = authUrl;
  };

  const handleDisconnect = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase
        .from("integration_credentials" as any)
        .delete()
        .eq("user_id", user.id)
        .eq("provider", "mailchimp");

      setConnected(false);
      setAccountName(null);
      setLoginEmail(null);
      toast({ title: "Disconnected", description: "Mailchimp integration removed." });
      onConnected?.();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleTestConnection = async () => {
    setLoading(true);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session) throw new Error("Not logged in");

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mailchimp-get-lists`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );
      const data = await res.json();
      if (data.success) {
        toast({ title: "Connection verified!", description: `Found ${data.lists?.length || 0} audience(s).` });
      } else {
        toast({ title: "Connection issue", description: data.error, variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-yellow-600" />
            Mailchimp Integration
          </DialogTitle>
          <DialogDescription>
            Connect your Mailchimp account to import audiences and enrich contacts with personalized links.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : connected ? (
            <>
              {/* Connected state */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-800">Connected to Mailchimp</span>
                </div>
                {(accountName || loginEmail) && (
                  <p className="text-sm text-green-700">
                    {accountName && <span className="font-medium">{accountName}</span>}
                    {accountName && loginEmail && <span> · </span>}
                    {loginEmail && <span>{loginEmail}</span>}
                  </p>
                )}
              </div>

              {/* How to use */}
              <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-2">
                <p className="font-medium">How to use:</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Create a campaign and click "Add Contacts"</li>
                  <li>Click "Import from Mailchimp"</li>
                  <li>Select your audience</li>
                  <li>We'll create personalized pages and write <code className="bg-muted px-1 rounded">*|PPAGE|*</code> to each contact</li>
                  <li>In Mailchimp, use <code className="bg-muted px-1 rounded">*|PPAGE|*</code> in your email template for the link</li>
                </ol>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={handleTestConnection} disabled={loading}>
                  Test Connection
                </Button>
                <Button variant="destructive" size="sm" onClick={handleDisconnect}>
                  <LogOut className="w-4 h-4 mr-1" />
                  Disconnect
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Not connected state */}
              <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
                <p className="text-muted-foreground">
                  Click the button below to securely connect your Mailchimp account. You'll be redirected to Mailchimp to authorize access, then sent back here automatically.
                </p>
              </div>

              <Button onClick={handleConnect} className="w-full h-12 text-base gap-2" size="lg">
                <Mail className="w-5 h-5" />
                Connect with Mailchimp
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                We only access your audience lists and contact merge fields. We never send emails on your behalf.
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
