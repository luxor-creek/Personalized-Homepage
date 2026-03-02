import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Check, ExternalLink, Eye, EyeOff, Loader2, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MailchimpOnboardingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnected?: () => void;
}

export default function MailchimpOnboardingDialog({ open, onOpenChange, onConnected }: MailchimpOnboardingDialogProps) {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);
  const [existingKey, setExistingKey] = useState(false);
  const [accountName, setAccountName] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      (async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from("integration_credentials" as any)
          .select("credentials")
          .eq("user_id", user.id)
          .eq("provider", "mailchimp")
          .maybeSingle();
        if ((data as any)?.credentials?.api_key) {
          setApiKey((data as any).credentials.api_key);
          setExistingKey(true);
          if ((data as any).credentials.account_name) {
            setAccountName((data as any).credentials.account_name);
          }
        }
      })();
    } else {
      setApiKey("");
      setShowKey(false);
      setTestResult(null);
      setExistingKey(false);
      setAccountName(null);
    }
  }, [open]);

  const handleTest = async () => {
    if (!apiKey.trim()) return;
    setTesting(true);
    setTestResult(null);
    try {
      // Save first, then test via the edge function
      await handleSave(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not logged in");

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mailchimp-get-lists`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
        }
      );

      const data = await res.json();
      if (data.success) {
        setTestResult("success");
        toast({ title: "Connected!", description: `Found ${data.lists?.length || 0} audience(s) in your Mailchimp account.` });
      } else {
        setTestResult("error");
        toast({ title: "Connection failed", description: data.error || "Could not connect to Mailchimp. Check your API key.", variant: "destructive" });
      }
    } catch (err: any) {
      setTestResult("error");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (silent = false) => {
    if (!apiKey.trim()) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      // Validate API key format: should contain a dash with server prefix
      if (!apiKey.includes("-")) {
        throw new Error("Invalid API key format. Mailchimp API keys look like: abc123def456-us21");
      }

      // Upsert credentials
      const { error } = await supabase
        .from("integration_credentials" as any)
        .upsert(
          {
            user_id: user.id,
            provider: "mailchimp",
            credentials: { api_key: apiKey.trim() },
          },
          { onConflict: "user_id,provider" }
        );

      if (error) throw error;

      setExistingKey(true);
      if (!silent) {
        toast({ title: "Saved", description: "Mailchimp API key saved." });
        onConnected?.();
      }
    } catch (err: any) {
      toast({ title: "Error saving", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
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

      setApiKey("");
      setExistingKey(false);
      setTestResult(null);
      setAccountName(null);
      toast({ title: "Disconnected", description: "Mailchimp integration removed." });
      onConnected?.();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-primary" />
            Connect Mailchimp
          </DialogTitle>
          <DialogDescription>
            Add your Mailchimp API key to import audiences and enrich contacts with personalized links.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Where to find your API key */}
          <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
            <p className="font-medium">Where to find your API key:</p>
            <p className="text-muted-foreground">
              Mailchimp → Account & Billing → Extras → API keys → Create A Key
            </p>
            <a
              href="https://us1.admin.mailchimp.com/account/api/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline text-xs"
            >
              Open Mailchimp API Keys <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* API Key input */}
          <div className="space-y-2">
            <Label>API Key</Label>
            <div className="relative">
              <Input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => { setApiKey(e.target.value); setTestResult(null); }}
                placeholder="abc123def456ghi789-us21"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              The key ends with a server prefix like <code>-us21</code>. We use this to route API calls.
            </p>
          </div>

          {/* Test result */}
          {testResult === "success" && (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 rounded-lg p-3">
              <Check className="w-4 h-4" />
              Connected to Mailchimp successfully!
            </div>
          )}
          {testResult === "error" && (
            <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3">
              Connection failed. Double-check your API key and try again.
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={handleTest}
              disabled={!apiKey.trim() || testing}
              className="flex-1"
            >
              {testing ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Testing...</>
              ) : (
                "Test & Save"
              )}
            </Button>
            {existingKey && (
              <Button variant="destructive" size="sm" onClick={handleDisconnect}>
                Disconnect
              </Button>
            )}
          </div>

          {/* Usage instructions */}
          {testResult === "success" && (
            <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-2">
              <p className="font-medium">Next steps:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Create a campaign and click "Add Contacts"</li>
                <li>Click "Import from Mailchimp"</li>
                <li>Select your Mailchimp audience</li>
                <li>We'll create personalized pages and write <code>*|PPAGE|*</code> merge field on each contact</li>
                <li>In Mailchimp, use <code>*|PPAGE|*</code> in your email template</li>
              </ol>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
