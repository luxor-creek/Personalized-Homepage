import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BrandLogo from "@/components/BrandLogo";
import snovioLogo from "@/assets/snovio.svg";
import mailchimpLogo from "@/assets/mailchimp.svg";
import {
  ArrowRight,
  ArrowDown,
  TrendingUp,
  DollarSign,
  Heart,
  Link2,
  Paintbrush,
  Rocket,
  Zap,
  ChevronRight,
  UserCheck,
  MessageSquare,
  BarChart3,
  MousePointerClick,
  X,
  ShieldCheck,
  Layers,
  Sparkles,
} from "lucide-react";

/* ─────────────────────────── Helper: Animate-on-scroll ─────────── */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

/* ═══════════════════════════════════════════════════════════════════
   SECTION 1 — HERO
   ═══════════════════════════════════════════════════════════════════ */
const HeroSection = () => {
  const navigate = useNavigate();
  return (
    <section className="relative overflow-hidden hero-gradient noise-overlay min-h-[92vh] flex items-center">
      {/* Radial accents */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute top-[-15%] right-[-10%] w-[700px] h-[700px] rounded-full opacity-[0.035]"
          style={{ background: "radial-gradient(circle, hsl(var(--primary)), transparent 70%)" }}
        />
        <div
          className="absolute bottom-[-20%] left-[-8%] w-[500px] h-[500px] rounded-full opacity-[0.025]"
          style={{ background: "radial-gradient(circle, hsl(280 55% 58%), transparent 70%)" }}
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-14 lg:py-20 relative z-10 w-full">
        {/* Nav */}
        <header className="flex items-center justify-between mb-20 lg:mb-28 animate-fade-up">
          <BrandLogo className="h-8" />
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/auth")} className="text-muted-foreground hover:text-foreground">
              Log in
            </Button>
            <Button variant="hero" size="lg" onClick={() => document.getElementById("beta-signup")?.scrollIntoView({ behavior: "smooth" })}>
              Join the Beta
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* Two-column hero */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left — Copy */}
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 bg-primary/[0.07] text-primary text-xs font-semibold tracking-widest uppercase px-4 py-2 rounded-full mb-7 animate-fade-up">
              <Sparkles className="w-3.5 h-3.5" />
              Beta Now Open
            </div>
            <h1 className="font-display text-4xl md:text-5xl lg:text-[3.4rem] xl:text-[3.75rem] text-foreground leading-[1.08] mb-6 animate-fade-up-delay">
              Stop Sending Generic Links.{" "}
              <span className="text-gradient">Start Building Connections.</span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-9 animate-fade-up-delay-2">
              Create a custom landing page for every lead on your list—automatically. Sync with Mailchimp and Snov.io to launch 1-to-1 marketing campaigns in minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 animate-fade-up-delay-3">
              <Button
                variant="hero"
                size="xl"
                onClick={() => document.getElementById("beta-signup")?.scrollIntoView({ behavior: "smooth" })}
                className="hover-lift"
              >
                Join the Beta — It's Free
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button
                variant="heroOutline"
                size="xl"
                onClick={() => document.getElementById("why-personalize")?.scrollIntoView({ behavior: "smooth" })}
                className="hover-lift"
              >
                See How It Works
              </Button>
            </div>

            {/* Integration logos inline */}
            <div className="flex items-center gap-5 mt-10 animate-fade-up-delay-3">
              <span className="text-xs text-muted-foreground/60 uppercase tracking-widest font-medium">Integrates with</span>
              <img src={mailchimpLogo} alt="Mailchimp" className="h-6 opacity-60 hover:opacity-100 transition-opacity" />
              <img src={snovioLogo} alt="Snov.io" className="h-5 opacity-60 hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Right — Split-screen visual */}
          <div className="relative animate-fade-up-delay-2 hidden lg:block">
            <div className="relative rounded-2xl overflow-hidden shadow-premium border border-border/50">
              {/* Generic side */}
              <div className="grid grid-cols-2">
                <div className="bg-muted p-6 flex flex-col items-center justify-center min-h-[340px] border-r border-border/50">
                  <div className="w-full max-w-[180px] space-y-3 opacity-50">
                    <div className="h-3 bg-border rounded-full w-3/4 mx-auto" />
                    <div className="h-2 bg-border rounded-full w-full" />
                    <div className="h-2 bg-border rounded-full w-5/6" />
                    <div className="h-8 bg-border/70 rounded-md w-2/3 mx-auto mt-4" />
                    <p className="text-[10px] text-muted-foreground/50 text-center mt-3 font-medium uppercase tracking-wider">
                      Generic page
                    </p>
                  </div>
                </div>

                {/* Personalized side */}
                <div className="bg-background p-6 flex flex-col items-center justify-center min-h-[340px] relative">
                  <div className="absolute top-3 right-3">
                    <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">Live</span>
                  </div>
                  <div className="w-full max-w-[180px] space-y-3">
                    <div className="h-3 bg-primary/20 rounded-full w-3/4 mx-auto" />
                    <p className="text-sm font-semibold text-foreground text-center">
                      Hey <span className="text-primary">Sarah</span>, ready to grow <span className="text-primary">Acme Corp</span>?
                    </p>
                    <div className="h-2 bg-muted rounded-full w-full" />
                    <div className="h-2 bg-muted rounded-full w-4/5" />
                    <div className="h-8 bg-primary rounded-md w-2/3 mx-auto mt-4 flex items-center justify-center">
                      <span className="text-[10px] text-white font-semibold">Book a Demo</span>
                    </div>
                    <p className="text-[10px] text-primary/70 text-center mt-3 font-semibold uppercase tracking-wider">
                      Personalized page
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating URL badge */}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-card border border-border/60 rounded-full px-5 py-2.5 shadow-premium flex items-center gap-2">
              <Link2 className="w-3.5 h-3.5 text-primary" />
              <code className="text-xs text-foreground/80 font-mono">personalized.page/u/<span className="text-primary font-semibold">sarah-jones</span></code>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="flex justify-center mt-16 lg:mt-24 animate-fade-up-delay-3">
          <button
            onClick={() => document.getElementById("why-personalize")?.scrollIntoView({ behavior: "smooth" })}
            className="flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-colors duration-300"
          >
            <ArrowDown className="w-4 h-4 animate-bounce" />
          </button>
        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   SECTION 2 — WHY PERSONALIZE?
   ═══════════════════════════════════════════════════════════════════ */
const WhyPersonalizeSection = () => {
  const { ref, visible } = useInView();

  const stats = [
    {
      icon: TrendingUp,
      title: "Higher Engagement",
      description: "Speak directly to their needs. Personalized pages see up to 2× more time on page.",
    },
    {
      icon: DollarSign,
      title: "Better ROI",
      description: "Turn cold traffic into warm leads instantly. Every dollar works harder when the message fits.",
    },
    {
      icon: Heart,
      title: "Brand Loyalty",
      description: "Show your customers you're paying attention. A personal touch builds trust that lasts.",
    },
  ];

  return (
    <section id="why-personalize" className="py-24 lg:py-36 bg-card relative section-divider">
      <div className="container mx-auto px-4 sm:px-6" ref={ref}>
        <div className="max-w-3xl mx-auto text-center mb-16">
          <p className="text-primary/90 font-medium tracking-widest uppercase text-xs mb-5">The Problem</p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-[2.75rem] text-foreground leading-[1.15] mb-6">
            Why Static Pages Are Costing You{" "}
            <span className="text-gradient">Conversions</span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Over 70% of customers expect personalized interactions. A static page feels like a cold call; a Personalized.page feels like a handshake.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {stats.map((stat, i) => (
            <div
              key={stat.title}
              className={`bg-background rounded-xl border border-border/50 p-7 hover-lift transition-all duration-500 ${visible ? "animate-fade-up" : "opacity-0"}`}
              style={{ animationDelay: `${i * 0.12}s` }}
            >
              <div className="w-11 h-11 rounded-lg bg-primary/[0.08] flex items-center justify-center mb-5">
                <stat.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground text-lg mb-2">{stat.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{stat.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   SECTION 3 — INTEGRATION POWER-HOUSE
   ═══════════════════════════════════════════════════════════════════ */
const IntegrationSection = () => {
  const { ref, visible } = useInView();

  const steps = [
    {
      num: "01",
      icon: Link2,
      title: "Sync",
      description: "Connect your Mailchimp or Snov.io account with one click. We securely pull your contact fields.",
    },
    {
      num: "02",
      icon: Paintbrush,
      title: "Design",
      description: "Build one template. Our engine generates thousands of unique variations—each one tailored to a lead.",
    },
    {
      num: "03",
      icon: Rocket,
      title: "Launch",
      description: "We push unique URLs back to your email list. Hit \"Send\" in your favorite tool and watch the clicks soar.",
    },
  ];

  return (
    <section className="py-24 lg:py-36 bg-background relative noise-overlay overflow-hidden">
      {/* Subtle accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/[0.02] blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10" ref={ref}>
        <div className="max-w-3xl mx-auto text-center mb-16">
          <p className="text-primary/90 font-medium tracking-widest uppercase text-xs mb-5">Workflow</p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-[2.75rem] text-foreground leading-[1.15] mb-6">
            Your Favorite Tools,{" "}
            <span className="text-gradient">Now Supercharged.</span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            We don't just make pages—we enhance your existing data. Personalized.page lives where your leads do.
          </p>

          {/* Integration logos */}
          <div className="flex items-center justify-center gap-8 mt-10">
            <div className="flex items-center gap-3 bg-card border border-border/50 rounded-xl px-5 py-3 shadow-sm hover-lift">
              <img src={mailchimpLogo} alt="Mailchimp" className="h-7" />
              <span className="text-sm font-medium text-foreground">Mailchimp</span>
            </div>
            <div className="flex items-center gap-3 bg-card border border-border/50 rounded-xl px-5 py-3 shadow-sm hover-lift">
              <img src={snovioLogo} alt="Snov.io" className="h-6" />
              <span className="text-sm font-medium text-foreground">Snov.io</span>
            </div>
          </div>
        </div>

        {/* Workflow steps */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className={`relative transition-all duration-500 ${visible ? "animate-fade-up" : "opacity-0"}`}
              style={{ animationDelay: `${i * 0.14}s` }}
            >
              <div className="bg-card rounded-xl border border-border/50 p-7 h-full hover-lift">
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-3xl font-display text-primary/20">{step.num}</span>
                  <div className="w-10 h-10 rounded-lg bg-primary/[0.08] flex items-center justify-center">
                    <step.icon className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <h3 className="font-semibold text-foreground text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </div>

              {/* Connector arrow (between cards on desktop) */}
              {i < steps.length - 1 && (
                <div className="hidden md:flex absolute top-1/2 -right-5 -translate-y-1/2 z-10 text-border">
                  <ChevronRight className="w-5 h-5" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Dashboard Preview (mock) */}
        <div
          className={`mt-16 max-w-3xl mx-auto transition-all duration-700 ${visible ? "animate-fade-up" : "opacity-0"}`}
          style={{ animationDelay: "0.5s" }}
        >
          <div className="bg-card rounded-xl border border-border/50 shadow-premium overflow-hidden">
            {/* Title bar */}
            <div className="px-5 py-3 bg-muted/50 border-b border-border/50 flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-border" />
              <div className="w-2.5 h-2.5 rounded-full bg-border" />
              <div className="w-2.5 h-2.5 rounded-full bg-border" />
              <span className="text-[10px] text-muted-foreground/50 ml-3 font-mono">Mailchimp — Audience List</span>
            </div>
            {/* Mock table */}
            <div className="p-4 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted-foreground/60 uppercase tracking-wider text-left">
                    <th className="pb-3 px-3 font-medium">Name</th>
                    <th className="pb-3 px-3 font-medium">Company</th>
                    <th className="pb-3 px-3 font-medium">Email</th>
                    <th className="pb-3 px-3 font-medium text-primary">Personalized_URL</th>
                  </tr>
                </thead>
                <tbody className="text-foreground/80">
                  {[
                    { name: "Sarah Jones", company: "Acme Corp", email: "sarah@acme.co", slug: "sarah-jones" },
                    { name: "Marcus Chen", company: "Vortex AI", email: "marcus@vortex.ai", slug: "marcus-chen" },
                    { name: "Priya Patel", company: "GreenLeaf", email: "priya@greenleaf.io", slug: "priya-patel" },
                    { name: "James Wilson", company: "BrightEdge", email: "james@brightedge.com", slug: "james-wilson" },
                  ].map((row) => (
                    <tr key={row.slug} className="border-t border-border/30 hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 px-3 font-medium">{row.name}</td>
                      <td className="py-2.5 px-3">{row.company}</td>
                      <td className="py-2.5 px-3 text-muted-foreground">{row.email}</td>
                      <td className="py-2.5 px-3">
                        <code className="text-primary bg-primary/[0.06] px-2 py-0.5 rounded text-[11px]">
                          personalized.page/u/{row.slug}
                        </code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   SECTION 4 — INTEGRATION GUIDE (Slide-out)
   ═══════════════════════════════════════════════════════════════════ */
const IntegrationGuideSlideout = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const guideSteps = [
    {
      icon: ShieldCheck,
      title: "Connect Your Data",
      description:
        "Authorize your Mailchimp or Snov.io account. We securely pull your contact fields—Name, Company, Industry—with read-only access.",
    },
    {
      icon: Layers,
      title: "Map Your Variables",
      description:
        'Drag-and-drop tags like {{first_name}} or {{company}} into your headers, buttons, and images using our visual builder.',
    },
    {
      icon: Zap,
      title: "The Auto-Enhancement",
      description:
        'Hit "Generate" and we create a unique field in your Mailchimp/Snov.io list called Personalized_URL—one unique link per contact.',
    },
    {
      icon: Rocket,
      title: "Send the Campaign",
      description:
        "In your email builder, use the merge tag *|Personalized_URL|*. Every recipient gets their own custom destination.",
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-background border-l border-border shadow-2xl z-50 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isOpen ? "translate-x-0" : "translate-x-full"
        } overflow-y-auto`}
      >
        <div className="p-6 sm:p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              <h3 className="font-display text-xl text-foreground">How to Automate Your Outreach</h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <div className="space-y-8">
            {guideSteps.map((step, i) => (
              <div key={step.title} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-9 h-9 rounded-lg bg-primary/[0.08] flex items-center justify-center shrink-0">
                    <step.icon className="w-4 h-4 text-primary" />
                  </div>
                  {i < guideSteps.length - 1 && (
                    <div className="w-px flex-1 bg-border/50 mt-2" />
                  )}
                </div>
                <div className="pb-6">
                  <p className="text-xs text-primary/70 font-semibold uppercase tracking-widest mb-1">
                    Step {i + 1}
                  </p>
                  <h4 className="font-semibold text-foreground mb-2">{step.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-primary/[0.04] rounded-xl border border-primary/10">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Tip:</strong> Your Personalized_URL field stays synced. Update a page template and every link refreshes automatically—no re-sending needed.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   SECTION 4B — GUIDE TRIGGER (Inline)
   ═══════════════════════════════════════════════════════════════════ */
const GuideTriggerSection = ({
  onOpen,
}: {
  onOpen: () => void;
}) => {
  const { ref, visible } = useInView();

  return (
    <section className="py-16 bg-card border-y border-border/30">
      <div className="container mx-auto px-4 sm:px-6" ref={ref}>
        <div
          className={`max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 transition-all duration-500 ${visible ? "animate-fade-up" : "opacity-0"}`}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/[0.08] flex items-center justify-center shrink-0">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-lg">Want to see the full workflow?</h3>
              <p className="text-sm text-muted-foreground">Step-by-step: connect, map, generate, send.</p>
            </div>
          </div>
          <Button variant="heroOutline" size="lg" onClick={onOpen} className="hover-lift shrink-0">
            Open Integration Guide
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   SECTION 5 — SECTIONS TO CUSTOMIZE GRID
   ═══════════════════════════════════════════════════════════════════ */
const CustomizationGridSection = () => {
  const { ref, visible } = useInView();

  const features = [
    {
      icon: MessageSquare,
      title: "Dynamic Headers",
      description: '"Ready to grow {{Company_Name}}?" — greet every visitor like you know them.',
      tag: "{{company}}",
    },
    {
      icon: UserCheck,
      title: "Personal Greetings",
      description: 'A warm welcome that says "Hey {{First_Name}}!" — not "Dear Valued Customer."',
      tag: "{{first_name}}",
    },
    {
      icon: BarChart3,
      title: "Smart Social Proof",
      description: "Show reviews and case studies from users in the same industry as your lead.",
      tag: "{{industry}}",
    },
    {
      icon: MousePointerClick,
      title: "Adaptive CTAs",
      description: 'Change from "Learn More" to "Buy Now" based on lead score or funnel stage.',
      tag: "{{cta_text}}",
    },
  ];

  return (
    <section className="py-24 lg:py-36 bg-background relative section-divider">
      <div className="container mx-auto px-4 sm:px-6" ref={ref}>
        <div className="max-w-3xl mx-auto text-center mb-16">
          <p className="text-primary/90 font-medium tracking-widest uppercase text-xs mb-5">Builder</p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-[2.75rem] text-foreground leading-[1.15] mb-6">
            One Template.{" "}
            <span className="text-gradient">Infinite Possibilities.</span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Dynamic content that reads the room. Use our builder to swap out more than just a name.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {features.map((feat, i) => (
            <div
              key={feat.title}
              className={`group bg-card rounded-xl border border-border/50 p-7 hover-lift transition-all duration-500 ${visible ? "animate-fade-up" : "opacity-0"}`}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 rounded-lg bg-primary/[0.08] flex items-center justify-center">
                  <feat.icon className="w-5 h-5 text-primary" />
                </div>
                <code className="text-[11px] bg-primary/[0.06] text-primary/80 px-2.5 py-1 rounded-md font-mono">
                  {feat.tag}
                </code>
              </div>
              <h3 className="font-semibold text-foreground text-lg mb-2">{feat.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feat.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   SECTION 6 — FINAL CTA + BETA SIGNUP
   ═══════════════════════════════════════════════════════════════════ */
const FinalCTASection = () => {
  const [email, setEmail] = useState("");
  const [tool, setTool] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { ref, visible } = useInView();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    // TODO: wire up to Supabase / email capture
    setSubmitted(true);
  };

  return (
    <section id="beta-signup" className="py-24 lg:py-36 hero-gradient noise-overlay relative overflow-hidden">
      {/* Accent orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-primary/[0.03] blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10" ref={ref}>
        <div
          className={`max-w-2xl mx-auto text-center transition-all duration-700 ${visible ? "animate-fade-up" : "opacity-0"}`}
        >
          <p className="text-primary/90 font-medium tracking-widest uppercase text-xs mb-5">Get Started</p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-[2.75rem] text-foreground leading-[1.15] mb-6">
            Ready to turn your list into a{" "}
            <span className="text-gradient">conversion machine?</span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-10 max-w-xl mx-auto">
            Join our Beta today and start sending pages that actually resonate. It's free while we're in beta.
          </p>

          {submitted ? (
            <div className="bg-primary/[0.06] border border-primary/20 rounded-xl px-6 py-8">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground text-lg mb-2">You're on the list!</h3>
              <p className="text-sm text-muted-foreground">We'll reach out soon with your early access invite.</p>
            </div>
          ) : (
            <div className="bg-card border border-border/50 rounded-2xl p-6 sm:p-8 shadow-premium max-w-md mx-auto">
              <div className="space-y-4">
                <div className="text-left">
                  <label className="text-xs font-medium text-foreground/80 uppercase tracking-wider mb-1.5 block">
                    Business Email
                  </label>
                  <Input
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="text-left">
                  <label className="text-xs font-medium text-foreground/80 uppercase tracking-wider mb-1.5 block">
                    Primary Tool
                  </label>
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
                <Button
                  variant="hero"
                  size="xl"
                  className="w-full hover-lift mt-2"
                  onClick={handleSubmit}
                >
                  Get Early Access
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   FOOTER
   ═══════════════════════════════════════════════════════════════════ */
const HomeFooter = () => (
  <footer className="py-10 bg-background border-t border-border/50">
    <div className="container mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
      <BrandLogo className="h-7" />
      <p className="text-xs text-muted-foreground/60">
        &copy; {new Date().getFullYear()} Personalized Page. All rights reserved.
      </p>
    </div>
  </footer>
);

/* ═══════════════════════════════════════════════════════════════════
   PAGE SHELL
   ═══════════════════════════════════════════════════════════════════ */
const HomePage = () => {
  const [guideOpen, setGuideOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <HeroSection />
      <WhyPersonalizeSection />
      <IntegrationSection />
      <GuideTriggerSection onOpen={() => setGuideOpen(true)} />
      <CustomizationGridSection />
      <FinalCTASection />
      <HomeFooter />

      <IntegrationGuideSlideout
        isOpen={guideOpen}
        onClose={() => setGuideOpen(false)}
      />
    </div>
  );
};

export default HomePage;
