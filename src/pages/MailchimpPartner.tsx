import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BrandLogo from "@/components/BrandLogo";
import mailchimpLogo from "@/assets/mailchimp.svg";
import stepDesignImg from "@/assets/step-design.png";
import stepSyncImg from "@/assets/step-sync.png";
import stepLaunchImg from "@/assets/step-launch.png";
import stepMonitorImg from "@/assets/step-monitor.jpeg";
import missionsShowcaseImg from "@/assets/missions-showcase.png";
import {
  ArrowRight,
  ArrowDown,
  Zap,
  MousePointerClick,
  ListChecks,
  Rocket,
  Check,
  Sparkles,
  Clock,
  TrendingUp,
  MailOpen,
  MousePointer,
  Send,
  Tag,
} from "lucide-react";

/* ─── Intersection Observer hook ─── */
const useInView = (threshold = 0.12) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
};

/* ═══════════════════════════════════════════════════════════════════
   HERO
   ═══════════════════════════════════════════════════════════════════ */
const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{ background: "var(--hero-gradient)" }} />
        <div className="absolute inset-0 bg-noise opacity-[0.015]" />
        <div
          className="absolute top-[-15%] right-[-10%] w-[600px] h-[600px] rounded-full opacity-[0.04]"
          style={{ background: "radial-gradient(circle, hsl(252 55% 55%), transparent 70%)" }}
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-14 lg:py-20 relative z-10">
        {/* Nav */}
        <header className="flex items-center justify-between gap-4 mb-20 lg:mb-28 animate-fade-up">
          <div className="flex items-center gap-3 shrink-0">
            <BrandLogo className="h-7 sm:h-8" />
            <span className="text-muted-foreground/40 text-sm">×</span>
            <img src={mailchimpLogo} alt="Mailchimp" className="h-6 sm:h-7" />
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/auth")} className="text-muted-foreground hover:text-foreground hidden sm:inline-flex">
              Log in
            </Button>
            <Button
              variant="hero"
              size="sm"
              onClick={() => document.getElementById("mailchimp-cta")?.scrollIntoView({ behavior: "smooth" })}
              className="sm:h-12 sm:px-6 sm:text-base"
            >
              <span className="sm:hidden">Get Started</span>
              <span className="hidden sm:inline">Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* Hero content */}
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 border border-primary/20 bg-primary/[0.04] rounded-full px-4 py-1.5 mb-8 animate-fade-up">
            <Zap className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary/90 tracking-wide">FOR MAILCHIMP CUSTOMERS</span>
          </div>

          <h1 className="font-display text-4xl md:text-5xl lg:text-[3.5rem] xl:text-[3.75rem] text-foreground leading-[1.08] mb-6 animate-fade-up-delay">
            Your audience isn't generic.{" "}
            <span className="text-gradient">Your links shouldn't be either.</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-10 max-w-2xl mx-auto animate-fade-up-delay-2">
            You've spent years building your Mailchimp audience. Segmenting. Tagging. Personalizing every subject line. Then every subscriber clicks through to… the same page. That ends now.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center animate-fade-up-delay-3">
            <Button
              variant="hero"
              size="lg"
              onClick={() => document.getElementById("mailchimp-cta")?.scrollIntoView({ behavior: "smooth" })}
              className="hover-lift sm:h-14 sm:px-10 sm:text-base"
            >
              Connect Your Mailchimp Account
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>

          <p className="text-sm text-muted-foreground/60 mt-6 animate-fade-up-delay-3">
            Free during beta. No credit card required. Connects in under 60 seconds.
          </p>
        </div>

        {/* Scroll hint */}
        <div className="flex justify-center mt-16 lg:mt-24 animate-fade-up-delay-3">
          <button
            onClick={() => document.getElementById("the-problem")?.scrollIntoView({ behavior: "smooth" })}
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
   THE PROBLEM
   ═══════════════════════════════════════════════════════════════════ */
const ProblemSection = () => {
  const { ref, visible } = useInView();

  return (
    <section id="the-problem" className="py-24 lg:py-32 bg-card relative section-divider">
      <div className="container mx-auto px-4 sm:px-6" ref={ref}>
        <div className="max-w-3xl mx-auto text-center mb-16">
          <p className="text-primary/90 font-medium tracking-widest uppercase text-xs mb-5">The Gap</p>
          <h2 className={`font-display text-3xl md:text-4xl lg:text-[2.75rem] text-foreground leading-[1.15] mb-6 transition-all duration-700 ${visible ? "animate-fade-up" : "opacity-0"}`}>
            You personalize everything except{" "}
            <span className="text-gradient">where the click goes.</span>
          </h2>
          <p className={`text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto transition-all duration-700 delay-100 ${visible ? "animate-fade-up" : "opacity-0"}`}>
            Your Mailchimp campaigns are dialed in. Merge tags in the subject line. Segments by behavior. Conditional content blocks. But when someone clicks your CTA, they land on a page that treats them like a stranger.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {[
            {
              icon: MailOpen,
              stat: "65%",
              label: "of email clicks don't convert",
              detail: "The email did its job. The landing page didn't.",
            },
            {
              icon: Clock,
              stat: "11 sec",
              label: "average time before a bounce",
              detail: "If the page doesn't feel relevant in the first few seconds, they're gone.",
            },
            {
              icon: TrendingUp,
              stat: "202%",
              label: "higher CTR with personalized pages",
              detail: "When the page continues the conversation the email started, people act.",
            },
          ].map((item, i) => (
            <div
              key={item.label}
              className={`text-center transition-all duration-700 ${visible ? "animate-fade-up" : "opacity-0"}`}
              style={{ animationDelay: `${0.15 + i * 0.1}s` }}
            >
              <div className="w-12 h-12 rounded-xl bg-primary/[0.06] flex items-center justify-center mx-auto mb-4">
                <item.icon className="w-5 h-5 text-primary" />
              </div>
              <p className="font-display text-3xl md:text-4xl text-foreground mb-1">{item.stat}</p>
              <p className="text-sm font-semibold text-foreground/80 mb-2">{item.label}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   THE SOLUTION
   ═══════════════════════════════════════════════════════════════════ */
const SolutionSection = () => {
  const { ref, visible } = useInView();

  return (
    <section className="py-24 lg:py-32 bg-background relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-primary/[0.015] blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10" ref={ref}>
        <div className="max-w-3xl mx-auto text-center mb-16">
          <p className="text-primary/90 font-medium tracking-widest uppercase text-xs mb-5">The Fix</p>
          <h2 className={`font-display text-3xl md:text-4xl lg:text-[2.75rem] text-foreground leading-[1.15] mb-6 transition-all duration-700 ${visible ? "animate-fade-up" : "opacity-0"}`}>
            Make every Mailchimp link{" "}
            <span className="text-gradient">feel like a personal invitation.</span>
          </h2>
          <p className={`text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto transition-all duration-700 delay-100 ${visible ? "animate-fade-up" : "opacity-0"}`}>
            Personalized.page doesn't replace Mailchimp. It completes the experience. You handle the email. We handle where the click goes. Together, every touchpoint feels intentional.
          </p>
        </div>

        <div className={`grid md:grid-cols-2 gap-6 max-w-3xl mx-auto transition-all duration-700 delay-200 ${visible ? "animate-fade-up" : "opacity-0"}`}>
          {/* Before */}
          <div className="bg-card rounded-xl border border-border/50 p-7">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/50 mb-4">Without Personalized.page</p>
            <ul className="space-y-3">
              {[
                "Subscriber clicks your campaign CTA",
                "Lands on a page that says \"Welcome\"",
                "No name, no context, no continuity",
                "Feels like a different conversation",
                "Your open rate was great. Your conversion rate wasn't.",
              ].map((line) => (
                <li key={line} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 mt-1.5 shrink-0" />
                  {line}
                </li>
              ))}
            </ul>
          </div>

          {/* After */}
          <div className="bg-primary/[0.03] rounded-xl border border-primary/20 p-7">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary/70 mb-4">With Personalized.page</p>
            <ul className="space-y-3">
              {[
                "Subscriber clicks your campaign CTA",
                "Lands on a page that greets them by name",
                "Content matches their segment and interests",
                "Personalized video, CTA, and messaging",
                "The email and the page feel like one seamless experience.",
              ].map((line) => (
                <li key={line} className="flex items-start gap-2.5 text-sm text-foreground/80">
                  <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   HOW IT WORKS — 3 STEPS
   ═══════════════════════════════════════════════════════════════════ */
const HowItWorksSection = () => {
  const { ref, visible } = useInView();

  const steps = [
    {
      num: "01",
      icon: MousePointerClick,
      title: "Connect Mailchimp",
      description: "Authorize your Mailchimp account and your audiences, segments, and tags appear instantly inside Personalized.page. No exports. No imports. No API keys to copy. Just click \"Connect\" and you're in.",
      image: stepSyncImg,
      detail: "Your Mailchimp audience data syncs automatically—including merge fields, tags, and segments.",
    },
    {
      num: "02",
      icon: ListChecks,
      title: "Choose an audience. Build a page.",
      description: "Select any Mailchimp audience, segment, or tagged group. Then pick a landing page template—or build one from scratch. Every merge field you've set up in Mailchimp (first name, company, location, you name it) is already available as a variable on the page.",
      image: stepDesignImg,
      detail: "Use *|FNAME|* in Mailchimp? It's already a drag-and-drop variable in our builder.",
    },
    {
      num: "03",
      icon: Rocket,
      title: "Launch. Every subscriber gets their own page.",
      description: "Hit generate and Personalized.page creates a unique URL for every subscriber. We write the link back to your Mailchimp list as the *|PPAGE|* merge tag. Drop it into any campaign and every recipient clicks through to a page built just for them.",
      image: stepLaunchImg,
      detail: "In your Mailchimp email, just use the *|PPAGE|* merge tag as your CTA link. Done.",
    },
  ];

  return (
    <section className="py-24 lg:py-32 bg-card relative section-divider">
      <div className="container mx-auto px-4 sm:px-6" ref={ref}>
        <div className="max-w-3xl mx-auto text-center mb-20">
          <p className="text-primary/90 font-medium tracking-widest uppercase text-xs mb-5">How It Works</p>
          <h2 className={`font-display text-3xl md:text-4xl lg:text-[2.75rem] text-foreground leading-[1.15] mb-6 transition-all duration-700 ${visible ? "animate-fade-up" : "opacity-0"}`}>
            Three clicks from your Mailchimp audience to{" "}
            <span className="text-gradient">thousands of personalized pages.</span>
          </h2>
        </div>

        <div className="space-y-24 lg:space-y-32 max-w-5xl mx-auto">
          {steps.map((step, i) => {
            const isReverse = i % 2 === 1;
            return (
              <div
                key={step.num}
                className={`grid lg:grid-cols-2 gap-10 lg:gap-16 items-center transition-all duration-700 ${visible ? "animate-fade-up" : "opacity-0"}`}
                style={{ animationDelay: `${0.1 + i * 0.15}s` }}
              >
                <div className={isReverse ? "lg:order-2" : ""}>
                  <div className="flex items-center gap-3 mb-5">
                    <span className="text-5xl font-display text-primary/15">{step.num}</span>
                    <div className="w-10 h-10 rounded-lg bg-primary/[0.06] flex items-center justify-center">
                      <step.icon className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                  <h3 className="font-display text-2xl md:text-3xl text-foreground mb-4">{step.title}</h3>
                  <p className="text-base text-muted-foreground leading-relaxed mb-4">{step.description}</p>
                  <p className="text-sm text-primary/70 font-medium flex items-start gap-2">
                    <Sparkles className="w-4 h-4 mt-0.5 shrink-0" />
                    {step.detail}
                  </p>
                </div>
                <div className={`${isReverse ? "lg:order-1" : ""}`}>
                  <div className="rounded-xl overflow-hidden border border-border/40 shadow-premium">
                    <img src={step.image} alt={step.title} className="w-full h-auto block" loading="lazy" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   USE CASES — MAILCHIMP-SPECIFIC
   ═══════════════════════════════════════════════════════════════════ */
const UseCasesSection = () => {
  const { ref, visible } = useInView();

  const cases = [
    {
      icon: Send,
      label: "Product Launches",
      headline: "Turn an announcement into a VIP reveal.",
      description: "Instead of blasting the same landing page to your whole list, give each subscriber a page that greets them by name and highlights the features most relevant to their segment. Early adopters see early-access pricing. Enterprise contacts see the enterprise pitch.",
    },
    {
      icon: Tag,
      label: "Abandoned Cart Recovery",
      headline: "\"Hey Sarah, you left something behind.\"",
      description: "Pair Mailchimp's automation triggers with a recovery page that shows the exact product they abandoned—with their name on it. It's the difference between a generic nudge and a personal conversation.",
    },
    {
      icon: MousePointer,
      label: "Event Invitations",
      headline: "Every invite feels handwritten.",
      description: "Whether it's a webinar, conference, or local meetup—each recipient gets their own invitation page with their name, their company logo, and a personalized agenda. RSVP rates go through the roof.",
    },
  ];

  return (
    <section className="py-24 lg:py-32 bg-background relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/[0.02] blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10" ref={ref}>
        <div className="max-w-3xl mx-auto text-center mb-16">
          <p className="text-primary/90 font-medium tracking-widest uppercase text-xs mb-5">Use Cases</p>
          <h2 className={`font-display text-3xl md:text-4xl lg:text-[2.75rem] text-foreground leading-[1.15] mb-6 transition-all duration-700 ${visible ? "animate-fade-up" : "opacity-0"}`}>
            Every campaign you already run—{" "}
            <span className="text-gradient">now with a personal destination.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {cases.map((c, i) => (
            <div
              key={c.label}
              className={`bg-card rounded-xl border border-border/50 p-7 h-full hover-lift transition-all duration-700 ${visible ? "animate-fade-up" : "opacity-0"}`}
              style={{ animationDelay: `${0.1 + i * 0.1}s` }}
            >
              <div className="w-11 h-11 rounded-lg bg-primary/[0.06] flex items-center justify-center mb-5">
                <c.icon className="w-5 h-5 text-primary" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-3 text-muted-foreground/60">{c.label}</p>
              <h3 className="font-semibold text-foreground text-lg mb-3 leading-snug">{c.headline}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{c.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   SHOWCASE
   ═══════════════════════════════════════════════════════════════════ */
const ShowcaseSection = () => {
  const { ref, visible } = useInView(0.08);

  return (
    <section className="py-24 lg:py-32 bg-card relative section-divider">
      <div className="container mx-auto px-4 sm:px-6" ref={ref}>
        <div className={`max-w-3xl mx-auto text-center mb-12 lg:mb-16 transition-all duration-700 ${visible ? "animate-fade-up" : "opacity-0"}`}>
          <p className="text-primary/90 font-medium tracking-widest uppercase text-xs mb-5">The Result</p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-[2.75rem] text-foreground leading-[1.15] mb-6">
            This is what your subscriber{" "}
            <span className="text-gradient">actually lands on.</span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Not a form. Not a generic page. A complete experience that knows who they are and why they're there.
          </p>
        </div>

        <div className={`max-w-5xl mx-auto transition-all duration-700 delay-200 ${visible ? "animate-fade-up" : "opacity-0"}`}>
          <div className="rounded-2xl overflow-hidden shadow-premium border border-border/40">
            <img
              src={missionsShowcaseImg}
              alt="Examples of personalized pages for different use cases"
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
   TRACKING
   ═══════════════════════════════════════════════════════════════════ */
const TrackingSection = () => {
  const { ref, visible } = useInView();

  return (
    <section className="py-24 lg:py-32 bg-background relative">
      <div className="container mx-auto px-4 sm:px-6" ref={ref}>
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center max-w-5xl mx-auto">
          <div className={`transition-all duration-700 ${visible ? "animate-fade-up" : "opacity-0"}`}>
            <p className="text-primary/90 font-medium tracking-widest uppercase text-xs mb-5">Beyond Open Rates</p>
            <h2 className="font-display text-3xl md:text-4xl text-foreground leading-[1.15] mb-6">
              Mailchimp tells you who opened.{" "}
              <span className="text-gradient">We tell you who's interested.</span>
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed mb-6">
              Open rates and click rates are the start of the story. Personalized.page shows you what happened after the click—per subscriber, in real time. You'll know who's warm before you ever pick up the phone.
            </p>
            <ul className="space-y-3">
              {[
                "Track exactly who viewed their personalized page",
                "See video plays, scroll depth, and time on page",
                "Know which CTAs got clicked—and by whom",
                "Prioritize follow-ups with engagement data, not guesswork",
              ].map((line) => (
                <li key={line} className="flex items-start gap-2.5 text-sm text-foreground/80">
                  <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  {line}
                </li>
              ))}
            </ul>
          </div>
          <div className={`transition-all duration-700 delay-200 ${visible ? "animate-fade-up" : "opacity-0"}`}>
            <div className="rounded-xl overflow-hidden border border-border/40 shadow-premium">
              <img src={stepMonitorImg} alt="Analytics dashboard showing per-subscriber engagement" className="w-full h-auto block" loading="lazy" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   RESULTS
   ═══════════════════════════════════════════════════════════════════ */
const ResultsSection = () => {
  const { ref, visible } = useInView();

  return (
    <section className="py-24 lg:py-32 bg-card relative section-divider">
      <div className="container mx-auto px-4 sm:px-6" ref={ref}>
        <div className="max-w-3xl mx-auto text-center mb-16">
          <p className="text-primary/90 font-medium tracking-widest uppercase text-xs mb-5">Real Impact</p>
          <h2 className={`font-display text-3xl md:text-4xl lg:text-[2.75rem] text-foreground leading-[1.15] mb-6 transition-all duration-700 ${visible ? "animate-fade-up" : "opacity-0"}`}>
            Same audience. Same campaign.{" "}
            <span className="text-gradient">Completely different conversion rates.</span>
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {[
            { metric: "202%", label: "Higher click-through", detail: "When every link leads somewhere personal, more people take the next step." },
            { metric: "3.8×", label: "More conversions", detail: "A personalized destination converts at multiples of a generic one." },
            { metric: "41%", label: "Longer engagement", detail: "Subscribers stay because the page was clearly built for them." },
            { metric: "< 5 min", label: "Setup time", detail: "Connect Mailchimp, pick an audience, choose a template. You're live." },
          ].map((item, i) => (
            <div
              key={item.label}
              className={`bg-background rounded-xl border border-border/50 p-6 text-center hover-lift transition-all duration-700 ${visible ? "animate-fade-up" : "opacity-0"}`}
              style={{ animationDelay: `${0.1 + i * 0.08}s` }}
            >
              <p className="font-display text-3xl text-foreground mb-1">{item.metric}</p>
              <p className="text-sm font-semibold text-primary/80 mb-2">{item.label}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   MERGE TAG EXPLAINER
   ═══════════════════════════════════════════════════════════════════ */
const MergeTagSection = () => {
  const { ref, visible } = useInView();

  return (
    <section className="py-24 lg:py-32 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6" ref={ref}>
        <div className="max-w-3xl mx-auto">
          <div className={`text-center mb-12 transition-all duration-700 ${visible ? "animate-fade-up" : "opacity-0"}`}>
            <p className="text-primary/90 font-medium tracking-widest uppercase text-xs mb-5">The Technical Bit</p>
            <h2 className="font-display text-3xl md:text-4xl text-foreground leading-[1.15] mb-6">
              One merge tag.{" "}
              <span className="text-gradient">That's all it takes.</span>
            </h2>
          </div>

          <div className={`bg-card rounded-xl border border-border/50 p-7 sm:p-10 transition-all duration-700 delay-100 ${visible ? "animate-fade-up" : "opacity-0"}`}>
            <div className="space-y-6">
              <div>
                <p className="text-sm font-semibold text-foreground mb-2">In your Mailchimp campaign, your CTA button links to:</p>
                <div className="bg-background rounded-lg border border-border px-5 py-3.5 font-mono text-sm text-foreground">
                  <span className="text-primary font-semibold">*|PPAGE|*</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground mb-2">When Sarah Jones opens your email, her link resolves to:</p>
                <div className="bg-background rounded-lg border border-border px-5 py-3.5 font-mono text-sm text-foreground">
                  personalized.page/u/<span className="text-primary font-semibold">sarah-jones</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground mb-2">When Marcus Chen opens the same email, his link resolves to:</p>
                <div className="bg-background rounded-lg border border-border px-5 py-3.5 font-mono text-sm text-foreground">
                  personalized.page/u/<span className="text-primary font-semibold">marcus-chen</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed pt-2 border-t border-border/40">
                Same email. Same template. Completely different experiences. Personalized.page writes a unique URL for every subscriber directly into your Mailchimp list as a merge field. You just drop <code className="text-primary font-mono text-xs">*|PPAGE|*</code> into your button link and forget about it.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   OBJECTION HANDLING
   ═══════════════════════════════════════════════════════════════════ */
const ObjectionSection = () => {
  const { ref, visible } = useInView();

  const objections = [
    {
      question: "\"I already personalize my emails. Isn't that enough?\"",
      answer: "Personalizing the email is half the equation. When the click leads to a generic page, the spell breaks. Personalized.page makes the post-click experience match the pre-click promise.",
    },
    {
      question: "\"Will this mess up my Mailchimp setup?\"",
      answer: "Not a chance. We add one merge field (*|PPAGE|*) to your audience. Your existing fields, segments, automations, and campaigns stay exactly as they are. It's additive, never disruptive.",
    },
    {
      question: "\"I have 50,000 subscribers. Can it handle that?\"",
      answer: "That's 50,000 personalized pages generated in minutes. One template, one click. Whether your audience is 100 or 100,000, every subscriber gets a page that looks custom-built.",
    },
    {
      question: "\"Does this replace my landing page tool?\"",
      answer: "It doesn't have to. Think of Personalized.page as the personalized layer on top of your existing workflow. Mailchimp handles the email. We handle where the link goes. Your current stack stays intact.",
    },
  ];

  return (
    <section className="py-24 lg:py-32 bg-card relative section-divider">
      <div className="container mx-auto px-4 sm:px-6" ref={ref}>
        <div className="max-w-3xl mx-auto text-center mb-16">
          <p className="text-primary/90 font-medium tracking-widest uppercase text-xs mb-5">Common Questions</p>
          <h2 className={`font-display text-3xl md:text-4xl text-foreground leading-[1.15] mb-4 transition-all duration-700 ${visible ? "animate-fade-up" : "opacity-0"}`}>
            Fair questions.{" "}
            <span className="text-gradient">Straight answers.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {objections.map((obj, i) => (
            <div
              key={i}
              className={`bg-background rounded-xl border border-border/50 p-7 transition-all duration-700 ${visible ? "animate-fade-up" : "opacity-0"}`}
              style={{ animationDelay: `${0.1 + i * 0.08}s` }}
            >
              <h3 className="font-semibold text-foreground mb-3 leading-snug">{obj.question}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{obj.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   FINAL CTA
   ═══════════════════════════════════════════════════════════════════ */
const FinalCTA = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!email) return;
    setSubmitted(true);
  };

  return (
    <section id="mailchimp-cta" className="py-24 lg:py-32 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{ background: "var(--hero-gradient)" }} />
        <div className="absolute inset-0 bg-noise opacity-[0.015]" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="max-w-xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 border border-primary/20 bg-primary/[0.04] rounded-full px-4 py-1.5 mb-8">
            <img src={mailchimpLogo} alt="Mailchimp" className="h-4" />
            <span className="text-xs font-semibold text-primary/90 tracking-wide">MAILCHIMP CUSTOMERS GET PRIORITY ACCESS</span>
          </div>

          <h2 className="font-display text-3xl md:text-4xl lg:text-[2.75rem] text-foreground leading-[1.15] mb-6">
            Your audience already trusts you.{" "}
            <span className="text-gradient">Now show them you know them.</span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-10">
            Connect your Mailchimp account, pick an audience, launch personalized pages in minutes. Free while we're in beta.
          </p>

          {submitted ? (
            <div className="bg-primary/[0.06] border border-primary/20 rounded-xl px-6 py-8">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground text-lg mb-2">You're in.</h3>
              <p className="text-sm text-muted-foreground">We'll send your early access invite within 24 hours. Check your inbox.</p>
            </div>
          ) : (
            <div className="bg-card border border-border/50 rounded-2xl p-6 sm:p-8 shadow-premium max-w-md mx-auto">
              <div className="space-y-4">
                <div>
                  <input
                    type="email"
                    placeholder="Your work email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
                  />
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
const Footer = () => (
  <footer className="py-10 border-t border-border/30 bg-card">
    <div className="container mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
      <BrandLogo className="h-6" />
      <p className="text-xs text-muted-foreground/60">
        © {new Date().getFullYear()} Personalized.page · The personalized layer for your Mailchimp campaigns.
      </p>
    </div>
  </footer>
);

/* ═══════════════════════════════════════════════════════════════════
   PAGE SHELL
   ═══════════════════════════════════════════════════════════════════ */
const MailchimpPartner = () => {
  return (
    <div className="min-h-screen bg-background">
      <Hero />
      <ProblemSection />
      <SolutionSection />
      <HowItWorksSection />
      <UseCasesSection />
      <ShowcaseSection />
      <TrackingSection />
      <MergeTagSection />
      <ResultsSection />
      <ObjectionSection />
      <FinalCTA />
      <Footer />
    </div>
  );
};

export default MailchimpPartner;
