import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Check, ExternalLink, Eye, EyeOff, Loader2, LogOut, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SnovOnboardingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnected?: () => void;
}

export default function SnovOnboardingDialog({ open, onOpenChange, onConnected }: SnovOnboardingDialogProps) {
  const { toast } = useToast();
  const [userId, setUserId] = useState("");
  const [secret, setSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [connected, setConnected] = useState(false);
  const [listCount, setListCount] = useState<number | null>(null);

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
          .eq("provider", "snov")
          .maybeSingle();
        if ((data as any)?.credentials?.user_id) {
          setUserId((data as any).credentials.user_id);
          setSecret((data as any).credentials.secret);
          setConnected(true);
        } else {
          setConnected(false);
        }
        setLoading(false);
      })();
    } else {
      setUserId("");
      setSecret("");
      setShowSecret(false);
      setConnected(false);
      setListCount(null);
    }
  }, [open]);

  const handleSaveAndTest = async () => {
    if (!userId.trim() || !secret.trim()) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Save credentials
      const { error } = await supabase
        .from("integration_credentials" as any)
        .upsert({
          user_id: user.id,
          provider: "snov",
          credentials: { user_id: userId.trim(), secret: secret.trim() },
        } as any, { onConflict: "user_id,provider" });

      if (error) throw error;

      // Test by fetching lists
      const { data, error: fnError } = await supabase.functions.invoke("snov-get-lists");
      if (fnError || data?.error) throw new Error(data?.error || "Connection failed — check your credentials.");

      setConnected(true);
      setListCount(data.lists?.length || 0);
      toast({ title: "Snov.io connected!", description: `Found ${data.lists?.length || 0} prospect list(s).` });
      onConnected?.();
    } catch (err: any) {
      toast({ title: "Connection failed", description: err.message || "Check your User ID and API Secret.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("snov-get-lists");
      if (error || data?.error) throw new Error(data?.error || "Connection failed");
      setListCount(data.lists?.length || 0);
      toast({ title: "Connection verified!", description: `Found ${data.lists?.length || 0} prospect list(s).` });
    } catch (err: any) {
      toast({ title: "Connection issue", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("integration_credentials" as any)
      .delete()
      .eq("user_id", user.id)
      .eq("provider", "snov");
    setUserId("");
    setSecret("");
    setConnected(false);
    setListCount(null);
    toast({ title: "Snov.io disconnected" });
    onConnected?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-primary" />
            Snov.io Integration
          </DialogTitle>
          <DialogDescription>
            Connect your Snov.io account to import prospect lists and manage outreach campaigns.
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
                  <span className="font-medium text-green-800">Connected to Snov.io</span>
                </div>
                <p className="text-sm text-green-700">
                  API credentials saved{listCount !== null ? ` · ${listCount} prospect list(s) found` : ""}
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-2">
                <p className="font-medium">How to use:</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Create a campaign and click "Add Contacts"</li>
                  <li>Click "Import from Snov.io"</li>
                  <li>Select a source list and a target list</li>
                  <li>Use <code className="bg-muted px-1 rounded">{"{{landing_page}}"}</code> in your Snov.io email template</li>
                  <li>Launch your campaign in Snov.io</li>
                </ol>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={handleTestConnection} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
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
              {/* Not connected — credential entry */}
              <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
                <p className="font-medium text-foreground">To connect, you'll need your API credentials from Snov.io:</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Open your <strong className="text-foreground">Snov.io API settings</strong></li>
                  <li>Copy your <strong className="text-foreground">User ID</strong> and <strong className="text-foreground">API Secret</strong></li>
                  <li>Paste them below</li>
                </ol>
                <a
                  href="https://app.snov.io/account/api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-primary hover:underline text-sm font-medium mt-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open Snov.io API Settings
                </a>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="snov-uid">User ID</Label>
                  <Input
                    id="snov-uid"
                    type="text"
                    placeholder="e.g. c57a0459f6t141659ea75cccb393c5"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">A long alphanumeric string — not your email address.</p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="snov-secret">API Secret</Label>
                  <div className="relative">
                    <Input
                      id="snov-secret"
                      type={showSecret ? "text" : "password"}
                      placeholder="Paste your API Secret"
                      value={secret}
                      onChange={(e) => setSecret(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecret(!showSecret)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleSaveAndTest}
                className="w-full"
                disabled={!userId.trim() || !secret.trim() || saving}
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Connecting...</>
                ) : (
                  "Connect Snov.io"
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Your credentials are stored securely and only used to access your Snov.io account.
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
