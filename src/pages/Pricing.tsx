import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import BrandLogo from "@/components/BrandLogo";
import {
  Check, Crown, Zap, Building2, Loader2, MessageSquare, ArrowRight,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const plans = [
  {
    id: "solo",
    name: "Solo",
    price: 29,
    period: "/mo",
    icon: Zap,
    description: "For individuals getting started with personalized outreach.",
    features: [
      "10 page templates",
      "10 active campaigns",
      "Up to 100 personalized links per campaign",
      "CSV & Google Sheet import",
      "Mailchimp integration",
      "Page view analytics",
      "Email support",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: 59,
    period: "/mo",
    icon: Crown,
    description: "For teams scaling personalized campaigns without limits.",
    features: [
      "Unlimited page templates",
      "Unlimited personalized links",
      "50 active campaigns",
      "CSV & Google Sheet import",
      "Mailchimp integration",
      "Snov.io integration",
      "Zapier integration",
      "Personalized subdomain e.g. yourname.personalized.page",
      "Priority support",
    ],
    cta: "Start Free Trial",
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
  const [enterpriseDialogOpen, setEnterpriseDialogOpen] = useState(false);
  const [enterpriseForm, setEnterpriseForm] = useState({ name: "", email: "", company: "", message: "" });
  const [sendingEnterprise, setSendingEnterprise] = useState(false);
  const [enterpriseSent, setEnterpriseSent] = useState(false);

  const handleEnterpriseSubmit = async () => {
    if (!enterpriseForm.name || !enterpriseForm.email || !enterpriseForm.company) return;
    setSendingEnterprise(true);
    try {
      // Fire-and-forget — replace with your edge function if needed
      await fetch("/api/enterprise-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(enterpriseForm),
      }).catch(() => {}); // fail silently if endpoint not set up
      setEnterpriseSent(true);
    } finally {
      setSendingEnterprise(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/">
            <BrandLogo className="h-8" />
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm">
                Get Started
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-16 max-w-5xl">

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-3 tracking-tight">
            Simple, transparent pricing
          </h1>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto">
            Start free for 7 days. No credit card required. Cancel anytime.
          </p>
        </div>

        {/* Trial callout */}
        <div className="mb-10 rounded-xl border border-border bg-card p-5 flex items-start gap-4 max-w-2xl mx-auto">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0 text-lg">
            🎁
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">Free Trial — 7 days</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              1 page template · Up to 100 personalized landing pages · No credit card required
            </p>
          </div>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-card rounded-xl border ${
                plan.popular
                  ? "border-primary shadow-lg shadow-primary/10"
                  : "border-border"
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

              {plan.id === "enterprise" ? (
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => {
                    setEnterpriseForm({ name: "", email: "", company: "", message: "" });
                    setEnterpriseSent(false);
                    setEnterpriseDialogOpen(true);
                  }}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  {plan.cta}
                </Button>
              ) : (
                <Link to="/auth" className="w-full">
                  <Button
                    className="w-full"
                    variant={plan.popular ? "default" : "outline"}
                  >
                    {plan.cta}
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* Footer note */}
        <div className="mt-12 text-center text-sm text-muted-foreground space-y-2">
          <p>7-day free trial on all new accounts. No credit card required. Cancel anytime.</p>
          <p>
            Questions?{" "}
            <a href="mailto:hello@personalized.page" className="text-primary hover:underline">
              hello@personalized.page
            </a>
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-8">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link to="/">
            <BrandLogo className="h-6" />
          </Link>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Personalized Page. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Enterprise Dialog */}
      <Dialog open={enterpriseDialogOpen} onOpenChange={setEnterpriseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contact Us for Enterprise</DialogTitle>
            <DialogDescription>
              Tell us about your needs and we'll put together a custom plan.
            </DialogDescription>
          </DialogHeader>

          {enterpriseSent ? (
            <div className="py-6 text-center space-y-2">
              <p className="text-2xl">✅</p>
              <p className="font-semibold text-foreground">Request sent!</p>
              <p className="text-sm text-muted-foreground">We'll be in touch within 1 business day.</p>
            </div>
          ) : (
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={enterpriseForm.name}
                    onChange={(e) => setEnterpriseForm({ ...enterpriseForm, name: e.target.value })}
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Company</Label>
                  <Input
                    value={enterpriseForm.company}
                    onChange={(e) => setEnterpriseForm({ ...enterpriseForm, company: e.target.value })}
                    placeholder="Company name"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={enterpriseForm.email}
                  onChange={(e) => setEnterpriseForm({ ...enterpriseForm, email: e.target.value })}
                  placeholder="you@company.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Tell us about your needs</Label>
                <Textarea
                  value={enterpriseForm.message}
                  onChange={(e) => setEnterpriseForm({ ...enterpriseForm, message: e.target.value })}
                  rows={4}
                  placeholder="Expected volume, integrations, timeline..."
                />
              </div>
              <Button
                onClick={handleEnterpriseSubmit}
                className="w-full"
                disabled={sendingEnterprise || !enterpriseForm.name || !enterpriseForm.email || !enterpriseForm.company}
              >
                {sendingEnterprise
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</>
                  : "Send Request"
                }
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Pricing;
