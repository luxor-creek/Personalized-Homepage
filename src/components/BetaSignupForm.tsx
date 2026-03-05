import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { submitBetaSignup } from "@/lib/betaSignup";

interface BetaSignupFormProps {
  source: "homepage" | "snovio" | "mailchimp";
  /** Show the tool selector (Mailchimp / Snov.io / Other) */
  showToolSelector?: boolean;
  /** Pre-select a tool */
  defaultTool?: string;
}

const inputClass =
  "w-full bg-background border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all";

const BetaSignupForm = ({ source, showToolSelector = false, defaultTool = "" }: BetaSignupFormProps) => {
  const [form, setForm] = useState({ firstName: "", lastName: "", company: "", email: "", phone: "" });
  const [tool, setTool] = useState(defaultTool);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const isValid = form.firstName && form.lastName && form.company && form.email;

  const handleSubmit = async () => {
    if (!isValid) return;
    setLoading(true);
    const { success } = await submitBetaSignup({ ...form, tool: tool || defaultTool, source });
    setLoading(false);
    if (success) setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="bg-primary/[0.06] border border-primary/20 rounded-xl px-6 py-8">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-6 h-6 text-primary" />
        </div>
        <h3 className="font-semibold text-foreground text-lg mb-2">You're on the list!</h3>
        <p className="text-sm text-muted-foreground">We'll reach out soon with your early access invite.</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border/50 rounded-2xl p-6 sm:p-8 shadow-premium max-w-lg mx-auto">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="text-left">
            <label className="text-xs font-medium text-foreground/80 uppercase tracking-wider mb-1.5 block">First Name *</label>
            <input className={inputClass} placeholder="Jane" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          </div>
          <div className="text-left">
            <label className="text-xs font-medium text-foreground/80 uppercase tracking-wider mb-1.5 block">Last Name *</label>
            <input className={inputClass} placeholder="Smith" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          </div>
        </div>
        <div className="text-left">
          <label className="text-xs font-medium text-foreground/80 uppercase tracking-wider mb-1.5 block">Company *</label>
          <input className={inputClass} placeholder="Acme Corp" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
        </div>
        <div className="text-left">
          <label className="text-xs font-medium text-foreground/80 uppercase tracking-wider mb-1.5 block">Business Email *</label>
          <input className={inputClass} type="email" placeholder="jane@acme.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="text-left">
          <label className="text-xs font-medium text-foreground/80 uppercase tracking-wider mb-1.5 block">
            Phone <span className="text-muted-foreground/50 normal-case">(optional)</span>
          </label>
          <input className={inputClass} type="tel" placeholder="+1 (555) 123-4567" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>

        {showToolSelector && (
          <div className="text-left">
            <label className="text-xs font-medium text-foreground/80 uppercase tracking-wider mb-1.5 block">Primary Tool</label>
            <div className="grid grid-cols-3 gap-2">
              {["Mailchimp", "Snov.io", "Other"].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setTool(opt)}
                  className={`text-sm py-2.5 px-3 rounded-lg border transition-all duration-200 ${
                    tool === opt
                      ? "border-primary bg-primary/[0.06] text-primary font-medium"
                      : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        <Button
          variant="hero"
          size="xl"
          className="w-full hover-lift mt-2"
          onClick={handleSubmit}
          disabled={loading || !isValid}
        >
          {loading ? "Submitting…" : "Get Early Access"}
          {!loading && <ArrowRight className="w-5 h-5" />}
        </Button>
      </div>
    </div>
  );
};

export default BetaSignupForm;
