import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import BrandLogo from "@/components/BrandLogo";
import {
  ArrowLeft, CreditCard, Crown, Clock, Zap, Building2,
  ExternalLink, Loader2, AlertTriangle
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

const Billing = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, checkingAuth, handleLogout } = useAuth();

  const [pageCount, setPageCount] = useState(0);
  const [campaignCount, setCampaignCount] = useState(0);
  const [loadingUsage, setLoadingUsage] = useState(true);
  const [managingBilling, setManagingBilling] = useState(false);

  useEffect(() => {
    if (user) fetchUsage();
  }, [user]);

  const fetchUsage = async () => {
    setLoadingUsage(true);
    try {
      const { count: pages } = await supabase
        .from("personalized_pages")
        .select("*, campaigns!inner(user_id)", { count: "exact", head: true })
        .eq("campaigns.user_id", user!.id);

      const { count: campaigns } = await supabase
        .from("campaigns")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id);

      setPageCount(pages || 0);
      setCampaignCount(campaigns || 0);
    } catch {
      // fail silently
    } finally {
      setLoadingUsage(false);
    }
  };

  const handleManageBilling = async () => {
    setManagingBilling(true);

    // TODO: Replace with actual Stripe customer portal
    // const { data } = await supabase.functions.invoke("create-portal-session", {
    //   body: { returnUrl: window.location.href },
    // });
    // if (data?.url) window.location.href = data.url;

    setTimeout(() => {
      toast({
        title: "Stripe not connected yet",
        description: "Billing portal will be available once Stripe is integrated.",
      });
      setManagingBilling(false);
    }, 1500);
  };

  const currentPlan = profile?.plan || "trial";
  const maxPages = profile?.max_pages || 3;
  const maxCampaigns = profile?.max_campaigns || 1;
  const isUnlimited = maxPages >= 999999;
  const trialEndsAt = profile?.trial_ends_at ? new Date(profile.trial_ends_at) : null;
  const trialDaysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;
  const trialExpired = currentPlan === "trial" && trialEndsAt && trialEndsAt < new Date();

  const planIcon = currentPlan === "pro" ? Crown
    : currentPlan === "starter" ? Zap
    : currentPlan === "enterprise" ? Building2
    : Clock;

  const planLabel = currentPlan === "pro" ? "Pro"
    : currentPlan === "starter" ? "Starter"
    : currentPlan === "enterprise" ? "Enterprise"
    : "Free Trial";

  const planPrice = currentPlan === "pro" ? "$59/mo"
    : currentPlan === "starter" ? "$29/mo"
    : currentPlan === "enterprise" ? "Custom"
    : "Free";

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <BrandLogo className="h-8" />
          <Button variant="ghost" size="sm" onClick={() => navigate("/workspace")}>
            <ArrowLeft className="w-4 h-4 mr-2" />Back to Dashboard
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Billing & Subscription</h1>

        {/* Trial expired warning */}
        {trialExpired && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Your trial has expired</p>
              <p className="text-sm text-muted-foreground">Upgrade to keep your pages live and continue creating campaigns.</p>
              <Button size="sm" className="mt-2" onClick={() => navigate("/pricing")}>
                View Plans
              </Button>
            </div>
          </div>
        )}

        {/* Current Plan Card */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-foreground">{planLabel}</h2>
                  <Badge variant={currentPlan === "trial" ? "secondary" : "default"} className="capitalize">
                    {currentPlan}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{planPrice}</p>
              </div>
            </div>
            {currentPlan !== "enterprise" && (
              <Button variant="outline" size="sm" onClick={() => navigate("/pricing")}>
                {currentPlan === "trial" ? "Upgrade" : "Change Plan"}
              </Button>
            )}
          </div>

          {currentPlan === "trial" && trialEndsAt && (
            <div className="bg-muted rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted-foreground">Trial period</span>
                <span className={`font-medium ${trialExpired ? "text-destructive" : "text-foreground"}`}>
                  {trialExpired ? "Expired" : `${trialDaysLeft} day${trialDaysLeft !== 1 ? "s" : ""} left`}
                </span>
              </div>
              <Progress value={trialExpired ? 100 : Math.max(5, ((14 - trialDaysLeft) / 14) * 100)} className="h-2" />
            </div>
          )}

          {(currentPlan === "starter" || currentPlan === "pro") && (
            <Button variant="outline" size="sm" onClick={handleManageBilling} disabled={managingBilling}>
              {managingBilling ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Loading...</>
              ) : (
                <><ExternalLink className="w-4 h-4 mr-2" />Manage Billing</>
              )}
            </Button>
          )}
        </div>

        {/* Usage Card */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-semibold text-foreground mb-4">Usage</h3>
          {loadingUsage ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Personalized Pages Created</span>
                  <span className="font-medium text-foreground">
                    {pageCount} / {isUnlimited ? "∞" : maxPages}
                  </span>
                </div>
                {!isUnlimited && (
                  <Progress value={Math.min(100, (pageCount / maxPages) * 100)} className="h-2" />
                )}
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Campaigns</span>
                  <span className="font-medium text-foreground">
                    {campaignCount} / {isUnlimited ? "∞" : maxCampaigns}
                  </span>
                </div>
                {!isUnlimited && (
                  <Progress value={Math.min(100, (campaignCount / maxCampaigns) * 100)} className="h-2" />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Account Info */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-semibold text-foreground mb-4">Account</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="text-foreground">{user?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Member since</span>
              <span className="text-foreground">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Billing;
