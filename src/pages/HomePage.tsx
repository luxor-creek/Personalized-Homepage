import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BetaSignupForm from "@/components/BetaSignupForm";
import BrandLogo from "@/components/BrandLogo";
import snovioLogo from "@/assets/snovio.svg";
import mailchimpLogo from "@/assets/mailchimp.svg";
import stepDesignImg from "@/assets/step-design.png";
import stepSyncImg from "@/assets/step-sync.png";
import stepLaunchImg from "@/assets/step-launch.png";
import stepMonitorImg from "@/assets/step-monitor.jpeg";
import missionsShowcaseImg from "@/assets/missions-showcase.png";
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
  Eye,
  X,
  ShieldCheck,
  Layers,
  Sparkles,
  Briefcase,
  HeartHandshake,
  Ticket,
  GraduationCap,
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
        <header className="flex items-center justify-between gap-4 mb-20 lg:mb-28 animate-fade-up">
          <BrandLogo className="h-7 sm:h-8 shrink-0" />
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/auth")} className="text-muted-foreground hover:text-foreground hidden sm:inline-flex">
              Log in
            </Button>
            <Button
              variant="hero"
              size="sm"
              onClick={() => document.getElementById("beta-signup")?.scrollIntoView({ behavior: "smooth" })}
              className="sm:h-12 sm:px-6 sm:text-base"
            >
              <span className="sm:hidden">Join Beta</span>
              <span className="hidden sm:inline">Join the Beta</span>
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
              Turn Your Email List Into Thousands of{" "}
              <span className="text-gradient">Personalized Landing Pages.</span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-9 animate-fade-up-delay-2">
              Stop sending leads to a generic homepage. Personalized.page crafts a unique 1-to-1 experience for every contact, featuring their own name, company logo, and tailored content to drive action.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 animate-fade-up-delay-3">
              <Button
                variant="hero"
                size="lg"
                onClick={() => document.getElementById("beta-signup")?.scrollIntoView({ behavior: "smooth" })}
                className="hover-lift sm:h-14 sm:px-10 sm:text-base"
              >
                Join the Beta — It's Free
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button
                variant="heroOutline"
                size="lg"
                onClick={() => document.getElementById("why-personalize")?.scrollIntoView({ behavior: "smooth" })}
                className="hover-lift sm:h-14 sm:px-10 sm:text-base"
              >
                See How It Works
              </Button>
            </div>

            {/* Integration logos inline */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-5 mt-10 animate-fade-up-delay-3">
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
   SECTION 1B — MISSIONS SHOWCASE (the "wow")
   ═══════════════════════════════════════════════════════════════════ */
const MissionsShowcaseSection = () => {
  const { ref, visible } = useInView(0.08);

  return (
    <section className="py-20 lg:py-28 bg-card relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6" ref={ref}>
        <div
          className={`max-w-3xl mx-auto text-center mb-12 lg:mb-16 transition-all duration-700 ${visible ? "animate-fade-up" : "opacity-0"}`}
        >
          <p className="text-primary/90 font-medium tracking-widest uppercase text-xs mb-5">See It In Action</p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-[2.75rem] text-foreground leading-[1.15] mb-6">
            Create a Template.{" "}
            <span className="text-gradient">Personalize to Thousands.</span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Personalized.page builds hyper-personalized pages that convert outreach into meetings and deals.
          </p>
        </div>

        <div
          className={`max-w-5xl mx-auto transition-all duration-700 delay-200 ${visible ? "animate-fade-up" : "opacity-0"}`}
        >
          <div className="rounded-2xl overflow-hidden shadow-premium border border-border/40 bw-to-color">
            <img
              src={missionsShowcaseImg}
              alt="Six personalized page examples: nonprofit donation reports, VIP executive invitations, corporate onboarding portals, milestone celebrations, support ticket responses, and exclusive event access"
              className="w-full h-auto block"
              loading="lazy"
            />
          </div>
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
   SECTION 3 — HOW IT WORKS (4 alternating feature sections)
   ═══════════════════════════════════════════════════════════════════ */

interface WorkflowStepProps {
  stepNum: string;
  label: string;
  title: React.ReactNode;
  description: string;
  image: string;
  imageAlt: string;
  reverse?: boolean;
  bgClass?: string;
  icon: React.ElementType;
}

const WorkflowStep = ({ stepNum, label, title, description, image, imageAlt, reverse = false, bgClass = "bg-background", icon: Icon }: WorkflowStepProps) => {
  const { ref, visible } = useInView(0.1);

  return (
    <section className={`py-20 lg:py-28 ${bgClass} relative overflow-hidden`}>
      <div className="container mx-auto px-4 sm:px-6" ref={ref}>
        <div className={`grid lg:grid-cols-2 gap-12 lg:gap-16 items-center ${reverse ? "lg:direction-rtl" : ""}`}>
          {/* Text side */}
          <div className={`${reverse ? "lg:order-2" : ""} max-w-lg ${reverse ? "lg:ml-auto" : ""}`}>
            <div
              className={`transition-all duration-700 ${visible ? "animate-fade-up" : "opacity-0"}`}
            >
              <div className="flex items-center gap-3 mb-6">
                <span className="text-4xl font-display text-primary/15">{stepNum}</span>
                <div className="w-10 h-10 rounded-lg bg-primary/[0.08] flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xs font-semibold text-primary/80 uppercase tracking-widest">{label}</span>
              </div>
              <h2 className="font-display text-3xl md:text-4xl lg:text-[2.5rem] text-foreground leading-[1.15] mb-5">
                {title}
              </h2>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                {description}
              </p>
            </div>
          </div>

          {/* Image side */}
          <div className={`${reverse ? "lg:order-1" : ""}`}>
            <div
              className={`transition-all duration-700 delay-150 ${visible ? "animate-fade-up" : "opacity-0"}`}
            >
              <div className="rounded-xl overflow-hidden shadow-premium border border-border/40">
                <img
                  src={image}
                  alt={imageAlt}
                  className="w-full h-auto block"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const WorkflowSections = () => (
  <>
    {/* Section header */}
    <section className="pt-24 lg:pt-36 pb-8 bg-background relative">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-primary/90 font-medium tracking-widest uppercase text-xs mb-5">How It Works</p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-[2.75rem] text-foreground leading-[1.15] mb-6">
            Your Favorite Tools,{" "}
            <span className="text-gradient">Now Supercharged.</span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Personalization is no longer a luxury. Now, it's automatic. Four steps from data to delivered.
          </p>

          {/* Integration logos */}
          <div className="flex items-center justify-center gap-6 mt-10">
            <Link to="/mailchimp" className="flex items-center gap-3 bg-card border border-border/50 rounded-xl px-5 py-3 shadow-sm hover-lift no-underline">
              <img src={mailchimpLogo} alt="Mailchimp" className="h-7" />
              <span className="text-sm font-medium text-foreground">Mailchimp</span>
            </Link>
            <Link to="/snovio" className="flex items-center gap-3 bg-card border border-border/50 rounded-xl px-5 py-3 shadow-sm hover-lift no-underline">
              <img src={snovioLogo} alt="Snov.io" className="h-6" />
              <span className="text-sm font-medium text-foreground">Snov.io</span>
            </Link>
          </div>
        </div>
      </div>
    </section>

    {/* Step 1: Design */}
    <WorkflowStep
      stepNum="01"
      label="Design"
      icon={Paintbrush}
      title={<>Build one template. <span className="text-gradient">Generate thousands.</span></>}
      description="Pick a conversion-optimized layout or start from scratch. Drag-and-drop personalization tags like {{first_name}} and {{company}} into your headers, images, and CTAs. One template, infinite unique variations."
      image={stepDesignImg}
      imageAlt="Page builder with personalization variables and section editing"
      bgClass="bg-background"
    />

    {/* Step 2: Sync */}
    <WorkflowStep
      stepNum="02"
      label="Sync"
      icon={Link2}
      title={<>Connect your audience <span className="text-gradient">in one click.</span></>}
      description="Import contacts from Mailchimp, Snov.io, CSV, Google Sheets, or add them manually. We securely pull your contact fields—Name, Company, Industry—and map them to your template variables."
      image={stepSyncImg}
      imageAlt="Add Contacts panel showing CSV upload, Google Sheets, Snov.io and Mailchimp imports"
      reverse
      bgClass="bg-card"
    />

    {/* Step 3: Launch */}
    <WorkflowStep
      stepNum="03"
      label="Launch"
      icon={Rocket}
      title={<>Every lead gets <span className="text-gradient">their own page.</span></>}
      description="Hit generate and we create a unique landing page for every contact—each with its own URL. Copy links, export as CSV, or push them straight back to your email tool. Hit 'Send' and watch the clicks soar."
      image={stepLaunchImg}
      imageAlt="Campaign dashboard showing contacts with personalized landing page links and live status"
      bgClass="bg-background"
    />

    {/* Step 4: Monitor */}
    <WorkflowStep
      stepNum="04"
      label="Monitor"
      icon={Eye}
      title={<>Track every view, click, and <span className="text-gradient">conversion.</span></>}
      description="See who's engaging in real time. Page views, video plays, link clicks, average time on page, scroll depth, and return visits—all at the per-prospect level. Know exactly which leads are hot."
      image={stepMonitorImg}
      imageAlt="Campaign analytics showing per-prospect engagement stats including views, clicks, and scroll depth"
      reverse
      bgClass="bg-card"
    />
  </>
);

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
        'Hit "Generate" and we create a unique field in your Mailchimp/Snov.io list called PPAGE—one unique link per contact.',
    },
    {
      icon: Rocket,
      title: "Send the Campaign",
      description:
        "In your email builder, use the merge tag *|PPAGE|* in Mailchimp or the corresponding Snov.io variable. Every recipient gets their own custom destination.",
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
              <strong className="text-foreground">Tip:</strong> Your PPAGE field stays synced. Update a page template and every link refreshes automatically—no re-sending needed.
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
   SECTION — USE CASE GRID
   ═══════════════════════════════════════════════════════════════════ */
const UseCaseGridSection = () => {
  const { ref, visible } = useInView();

  const useCases = [
    {
      icon: Briefcase,
      role: "A Founder / SDR",
      action: "Send custom product demos to every lead in your Snov.io list.",
      result: "More meetings booked.",
      accent: "bg-blue-500/[0.08] text-blue-600",
    },
    {
      icon: HeartHandshake,
      role: "A Non-Profit",
      action: "Show donors exactly how their specific contribution helped.",
      result: "40% higher donor retention.",
      accent: "bg-rose-500/[0.08] text-rose-600",
    },
    {
      icon: Ticket,
      role: "An Event Host",
      action: 'Send "Golden Ticket" invites with the guest\'s name and photo.',
      result: "Sold-out RSVP lists.",
      accent: "bg-amber-500/[0.08] text-amber-600",
    },
    {
      icon: GraduationCap,
      role: "A Recruiter",
      action: 'Create a custom "Why You\'d Love Us" page for top-tier talent.',
      result: "Higher candidate interest.",
      accent: "bg-emerald-500/[0.08] text-emerald-600",
    },
  ];

  return (
    <section className="py-24 lg:py-36 bg-card relative section-divider">
      <div className="container mx-auto px-4 sm:px-6" ref={ref}>
        <div className="max-w-3xl mx-auto text-center mb-16">
          <p className="text-primary/90 font-medium tracking-widest uppercase text-xs mb-5">Use Cases</p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-[2.75rem] text-foreground leading-[1.15] mb-6">
            Built for the way{" "}
            <span className="text-gradient">you actually work.</span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Personalized.page isn't a one-trick tool. Here's how different teams are using it to drive real results.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {useCases.map((uc, i) => (
            <div
              key={uc.role}
              className={`bg-background rounded-xl border border-border/50 p-7 hover-lift transition-all duration-500 ${visible ? "animate-fade-up" : "opacity-0"}`}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${uc.accent.split(" ")[0]}`}>
                  <uc.icon className={`w-5 h-5 ${uc.accent.split(" ")[1]}`} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-primary/70 uppercase tracking-widest mb-1">If you are…</p>
                  <h3 className="font-semibold text-foreground text-lg">{uc.role}</h3>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                <span className="text-foreground/70 font-medium">Use Personalized.page to </span>
                {uc.action}
              </p>
              <div className="flex items-center gap-2 pt-3 border-t border-border/40">
                <ArrowRight className="w-3.5 h-3.5 text-primary" />
                <span className="text-sm font-semibold text-foreground">{uc.result}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   SECTION — USE CASE STORIES
   ═══════════════════════════════════════════════════════════════════ */
const UseCaseStoriesSection = () => {
  const { ref, visible } = useInView();

  const stories = [
    {
      icon: HeartHandshake,
      label: "Fundraising",
      headline: "Donors don't give to organizations; they give to impact.",
      description: "Show them the specific project they are funding with a page built just for them. Replace mass appeal with a personal connection that drives 40% higher retention.",
      accent: "bg-rose-500/[0.08] text-rose-600",
    },
    {
      icon: Ticket,
      label: "Invitations",
      headline: "Standard invites get lost in the noise.",
      description: 'A personalized invitation says "You aren\'t just a seat in the room—you\'re the reason for the event." Turn every guest into a VIP.',
      accent: "bg-amber-500/[0.08] text-amber-600",
    },
    {
      icon: UserCheck,
      label: "Customer Success",
      headline: "Turn a support ticket into a 'Thank You' moment.",
      description: "Greet your customers with a custom portal that remembers their history. Transform transactional touchpoints into loyalty-building experiences.",
      accent: "bg-emerald-500/[0.08] text-emerald-600",
    },
  ];

  return (
    <section className="py-24 lg:py-36 bg-background relative overflow-hidden">
      {/* Subtle accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/[0.02] blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10" ref={ref}>
        <div className="max-w-3xl mx-auto text-center mb-16">
          <p className="text-primary/90 font-medium tracking-widest uppercase text-xs mb-5">Beyond Sales</p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-[2.75rem] text-foreground leading-[1.15] mb-6">
            One tool.{" "}
            <span className="text-gradient">Every touchpoint.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {stories.map((story, i) => (
            <div
              key={story.label}
              className={`relative transition-all duration-500 ${visible ? "animate-fade-up" : "opacity-0"}`}
              style={{ animationDelay: `${i * 0.12}s` }}
            >
              <div className="bg-card rounded-xl border border-border/50 p-7 h-full hover-lift">
                <div className={`w-11 h-11 rounded-lg flex items-center justify-center mb-5 ${story.accent.split(" ")[0]}`}>
                  <story.icon className={`w-5 h-5 ${story.accent.split(" ")[1]}`} />
                </div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-3 text-muted-foreground/60">{story.label}</p>
                <h3 className="font-semibold text-foreground text-lg mb-3 leading-snug">{story.headline}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{story.description}</p>
              </div>
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
  const { ref, visible } = useInView();

  return (
    <section id="beta-signup" className="py-24 lg:py-36 hero-gradient noise-overlay relative overflow-hidden">
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

          <BetaSignupForm source="homepage" showToolSelector />
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
      <MissionsShowcaseSection />
      <WhyPersonalizeSection />
      <WorkflowSections />
      <UseCaseGridSection />
      <UseCaseStoriesSection />
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
