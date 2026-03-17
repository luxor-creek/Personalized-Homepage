import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import BrandLogo from "@/components/BrandLogo";
import {
  Check, ArrowLeft, Crown, Zap, Building2, Loader2, MessageSquare,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const plans = [
  {
    id: "starter",
    name: "Solo",
    price: 29,
    period: "/mo",
    icon: Zap,
    description: "Personalized landing pages for your email list, ready in a few clicks.",
    features: [
      "10 page templates",
      "10 active campaigns",
      "Up to 100 personalized links per campaign",
      "CSV & Google Sheet import",
      "Mailchimp integration",
      "Page view analytics",
      "Email support",
    ],
    cta: "Upgrade to Solo",
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: 59,
    period: "/mo",
    icon: Crown,
    description: "Scale personalized outreach with more campaigns, automation, and integrations.",
    features: [
      "Unlimited page templates",
      "Unlimited personalized links",
      "50 active campaigns",
      "CSV & Google Sheet import",
      "Mailchimp integration",
      "Snov.io integration",
      "Zapier integration",
      "Priority support",
    ],
    cta: "Upgrade to Pro",
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: null,
    period: "",
    icon: Building2,
    description: "Custom solutions for organizations with advanced needs.",
    features: [
      "Everything in Pro",
      "Unlimited pages & campaigns",
      "Custom branding & white-label",
      "Dedicated account manager",
      "Custom integrations",
      "SLA & priority support",
    ],
    cta: "Contact Us",
    popular: false,
  },
];

const Pricing = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, checkingAuth } = useAuth();
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const [enterpriseDialogOpen, setEnterpriseDialogOpen] = useState(false);
  const [enterpriseForm, setEnterpriseForm] = useState({ name: "", email: "", company: "", message: "" });
  const [sendingEnterprise, setSendingEnterprise] = useState(false);

  const handleUpgrade = async (planId: string) => {
    if (planId === "enterprise") {
      setEnterpriseForm({ name: "", email: user?.email || "", company: "", message: "" });
      setEnterpriseDialogOpen(true);
      return;
    }

    setCheckingOut(planId);

    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          planId,
          successUrl: `${window.location.origin}/billing?checkout=success`,
          cancelUrl: `${window.location.origin}/pricing`,
        },
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: any) {
      toast({
        title: "Checkout failed",
        description: err.message || "Unable to start checkout. Please try again.",
        variant: "destructive",
      });
      setCheckingOut(null);
    }
  };

  const handleEnterpriseSubmit = async () => {
    setSendingEnterprise(true);
    try {
      await supabase.functions.invoke("send-enterprise-inquiry", {
        body: enterpriseForm,
      });
      toast({ title: "Request sent!", description: "We'll be in touch within 1 business day." });
      setEnterpriseDialogOpen(false);
    } catch {
      toast({ title: "Something went wrong", description: "Please try again or email us directly.", variant: "destructive" });
    } finally {
      setSendingEnterprise(false);
    }
  };

  const currentPlan = profile?.plan || "trial";

  // 7-day trial
  const trialDaysLeft = profile?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(profile.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

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

      <div className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Trial banner */}
        {currentPlan === "trial" && (
          <div className="mb-8 rounded-lg border border-primary/30 bg-primary/5 p-4 text-center">
            <p className="text-sm text-foreground">
              You're on a <strong>7-day free trial</strong> —{" "}
              {trialDaysLeft > 0
                ? <>{trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""} remaining</>
                : <span className="text-destructive font-semibold">trial expired</span>
              }.{" "}
              Upgrade to keep your pages live and unlock more capacity.
            </p>
          </div>
        )}

        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-foreground mb-2">Choose Your Plan</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Scale your personalized outreach. All paid plans include full access to templates, the page builder, and analytics.
          </p>
        </div>

        {/* Trial plan callout */}
        <div className="mb-8 rounded-xl border border-border bg-card p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <span className="text-lg">🎁</span>
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">Free Trial — 7 days</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              1 page template · Up to 100 personalized landing pages · No credit card required
            </p>
          </div>
          {currentPlan === "trial" && (
            <Badge variant="secondary" className="ml-auto shrink-0">Current</Badge>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrent = currentPlan === plan.id;
            return (
              <div
                key={plan.id}
                className={`relative bg-card rounded-xl border ${
                  plan.popular ? "border-primary shadow-lg shadow-primary/10" : "border-border"
                } p-6 flex flex-col`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                )}

                <div className="mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <plan.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                </div>

                <div className="mb-6">
                  {plan.price !== null ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-foreground">${plan.price}</span>
                      <span className="text-muted-foreground">{plan.period}</span>
                    </div>
                  ) : (
                    <div className="text-2xl font-bold text-foreground">Custom</div>
                  )}
                </div>

                <ul className="space-y-3 mb-6 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <Button variant="outline" disabled className="w-full">
                    Current Plan
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    variant={plan.popular ? "default" : "outline"}
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={!!checkingOut}
                  >
                    {checkingOut === plan.id ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Redirecting to checkout...</>
                    ) : plan.id === "enterprise" ? (
                      <><MessageSquare className="w-4 h-4 mr-2" />{plan.cta}</>
                    ) : (
                      plan.cta
                    )}
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center text-sm text-muted-foreground space-y-2">
          <p>7-day free trial on all new accounts. Cancel anytime.</p>
          <p>Questions? <a href="mailto:hello@personalized.page" className="text-primary hover:underline">Contact us</a></p>
        </div>
      </div>

      {/* Enterprise Contact Dialog */}
      <Dialog open={enterpriseDialogOpen} onOpenChange={setEnterpriseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contact Us for Enterprise</DialogTitle>
            <DialogDescription>
              Tell us about your needs and we'll put together a custom plan.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={enterpriseForm.name} onChange={(e) => setEnterpriseForm({ ...enterpriseForm, name: e.target.value })} placeholder="Your name" />
              </div>
              <div className="space-y-2">
                <Label>Company</Label>
                <Input value={enterpriseForm.company} onChange={(e) => setEnterpriseForm({ ...enterpriseForm, company: e.target.value })} placeholder="Company name" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={enterpriseForm.email} onChange={(e) => setEnterpriseForm({ ...enterpriseForm, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Tell us about your needs</Label>
              <Textarea value={enterpriseForm.message} onChange={(e) => setEnterpriseForm({ ...enterpriseForm, message: e.target.value })} rows={4} placeholder="Expected volume, integrations, timeline..." />
            </div>
            <Button onClick={handleEnterpriseSubmit} className="w-full" disabled={sendingEnterprise}>
              {sendingEnterprise ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</> : "Send Request"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Pricing;
