import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BrandLogo from "@/components/BrandLogo";
import BetaSignupForm from "@/components/BetaSignupForm";
import snovioLogo from "@/assets/snovio.svg";
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
  BarChart3,
  Check,
  Sparkles,
  Link2,
  Clock,
  Users,
  TrendingUp,
  Mail,
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
      {/* Background */}
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
            <BrandLogo className="h-9 sm:h-11" />
            <span className="text-muted-foreground/40 text-sm">×</span>
            <img src={snovioLogo} alt="Snov.io" className="h-7 sm:h-9" />
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/auth")} className="text-muted-foreground hover:text-foreground hidden sm:inline-flex">
              Log in
            </Button>
            <Button
              variant="hero"
              size="sm"
              onClick={() => document.getElementById("snovio-cta")?.scrollIntoView({ behavior: "smooth" })}
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
          {/* Partner badge */}
          <div className="inline-flex items-center gap-2 border border-primary/20 bg-primary/[0.04] rounded-full px-4 py-1.5 mb-8 animate-fade-up">
            <Zap className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary/90 tracking-wide">FOR SNOV.IO CUSTOMERS</span>
          </div>

          <h1 className="font-display text-4xl md:text-5xl lg:text-[3.5rem] xl:text-[3.75rem] text-foreground leading-[1.08] mb-6 animate-fade-up-delay">
            Your leads deserve better than{" "}
            <span className="text-gradient">a generic link.</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-10 max-w-2xl mx-auto animate-fade-up-delay-2">
            You already use Snov.io to find the right people. Now give every one of them a landing page that feels like it was built just for them—because it was.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center animate-fade-up-delay-3">
            <Button
              variant="hero"
              size="lg"
              onClick={() => document.getElementById("snovio-cta")?.scrollIntoView({ behavior: "smooth" })}
              className="hover-lift sm:h-14 sm:px-10 sm:text-base"
            >
              Connect Your Snov.io Account
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
   THE PROBLEM — WHY SNOV.IO ALONE ISN'T ENOUGH
   ═══════════════════════════════════════════════════════════════════ */
const ProblemSection = () => {
  const { ref, visible } = useInView();

  return (
    <section id="the-problem" className="py-24 lg:py-32 bg-card relative section-divider">
      <div className="container mx-auto px-4 sm:px-6" ref={ref}>
        <div className="max-w-3xl mx-auto text-center mb-16">
          <p className="text-primary/90 font-medium tracking-widest uppercase text-xs mb-5">The Gap</p>
          <h2 className={`font-display text-3xl md:text-4xl lg:text-[2.75rem] text-foreground leading-[1.15] mb-6 transition-all duration-700 ${visible ? "animate-fade-up" : "opacity-0"}`}>
            Snov.io gets you in the door.{" "}
            <span className="text-gradient">What happens next?</span>
          </h2>
          <p className={`text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto transition-all duration-700 delay-100 ${visible ? "animate-fade-up" : "opacity-0"}`}>
            You've built the list. You've crafted the email. The prospect clicks your link and lands on… the same page everyone else sees. A generic URL. No name. No context. No reason to stay.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {[
            {
              icon: Mail,
              stat: "72%",
              label: "of cold emails get ignored",
              detail: "Not because the lead is wrong—because the destination is.",
            },
            {
              icon: Clock,
              stat: "8 sec",
              label: "average time on a generic page",
              detail: "That's not enough time to make a first impression, let alone a sale.",
            },
            {
              icon: TrendingUp,
              stat: "3×",
              label: "higher conversion with personalization",
              detail: "When a prospect sees their name, their company, their problem—they stay.",
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
   THE SOLUTION — BOLT-ON VALUE
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
            The missing piece in your{" "}
            <span className="text-gradient">Snov.io workflow.</span>
          </h2>
          <p className={`text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto transition-all duration-700 delay-100 ${visible ? "animate-fade-up" : "opacity-0"}`}>
            Personalized.page isn't a replacement for anything in your stack. It's the thing that makes everything you're already doing work harder. Think of it as the last mile between "great email" and "booked meeting."
          </p>
        </div>

        {/* Before/After */}
        <div className={`grid md:grid-cols-2 gap-6 max-w-3xl mx-auto transition-all duration-700 delay-200 ${visible ? "animate-fade-up" : "opacity-0"}`}>
          {/* Before */}
          <div className="bg-card rounded-xl border border-border/50 p-7">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/50 mb-4">Without Personalized.page</p>
            <ul className="space-y-3">
              {[
                "Lead clicks your link",
                "Sees a generic landing page",
                "No name, no context, no hook",
                "Bounces in under 10 seconds",
                "Your email was good. The destination wasn't.",
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
                "Lead clicks your link",
                "Sees a page built for them—by name",
                "Their company, their problem, their solution",
                "Custom video, CTA, and content",
                "They don't just land. They stay, click, and book.",
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
      title: "Connect Snov.io",
      description: "One click. That's it. Authorize your Snov.io account and Personalized.page pulls in your campaigns, lists, and prospect data automatically. No CSV exports. No copy-paste marathons. No developer needed.",
      image: stepSyncImg,
      detail: "You'll see your Snov.io campaigns appear inside our dashboard within seconds.",
    },
    {
      num: "02",
      icon: ListChecks,
      title: "Pick a list. Pick a template.",
      description: "Select a campaign or prospect list from Snov.io, then choose (or build) a landing page template. Our builder already knows your merge fields—first name, company, title, industry. Drag, drop, done.",
      image: stepDesignImg,
      detail: "Every variable from your Snov.io list becomes a live merge field on the page.",
    },
    {
      num: "03",
      icon: Rocket,
      title: "Hit Launch. That's the whole workflow.",
      description: "Personalized.page generates a unique URL for every single prospect on your list. One page per person. One click to launch. Drop the links into your Snov.io drip campaign and watch what happens.",
      image: stepLaunchImg,
      detail: "Each prospect gets personalized.page/u/their-name — a page that feels like you spent an hour on it.",
    },
  ];

  return (
    <section className="py-24 lg:py-32 bg-card relative section-divider">
      <div className="container mx-auto px-4 sm:px-6" ref={ref}>
        <div className="max-w-3xl mx-auto text-center mb-20">
          <p className="text-primary/90 font-medium tracking-widest uppercase text-xs mb-5">How It Works</p>
          <h2 className={`font-display text-3xl md:text-4xl lg:text-[2.75rem] text-foreground leading-[1.15] mb-6 transition-all duration-700 ${visible ? "animate-fade-up" : "opacity-0"}`}>
            Three clicks between your Snov.io list and{" "}
            <span className="text-gradient">hundreds of personalized pages.</span>
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
   SHOWCASE — WHAT THE PROSPECT ACTUALLY SEES
   ═══════════════════════════════════════════════════════════════════ */
const ShowcaseSection = () => {
  const { ref, visible } = useInView(0.08);

  return (
    <section className="py-24 lg:py-32 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6" ref={ref}>
        <div className={`max-w-3xl mx-auto text-center mb-12 lg:mb-16 transition-all duration-700 ${visible ? "animate-fade-up" : "opacity-0"}`}>
          <p className="text-primary/90 font-medium tracking-widest uppercase text-xs mb-5">The Result</p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-[2.75rem] text-foreground leading-[1.15] mb-6">
            This is what your prospect{" "}
            <span className="text-gradient">actually sees.</span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Not a generic page. Not a template. A page that knows their name, their company, and exactly why they should care.
          </p>
        </div>

        <div className={`max-w-5xl mx-auto transition-all duration-700 delay-200 ${visible ? "animate-fade-up" : "opacity-0"}`}>
          <div className="rounded-2xl overflow-hidden shadow-premium border border-border/40 bw-to-color">
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
   RESULTS — WHAT CHANGES
   ═══════════════════════════════════════════════════════════════════ */
const ResultsSection = () => {
  const { ref, visible } = useInView();

  return (
    <section className="py-24 lg:py-32 bg-card relative section-divider">
      <div className="container mx-auto px-4 sm:px-6" ref={ref}>
        <div className="max-w-3xl mx-auto text-center mb-16">
          <p className="text-primary/90 font-medium tracking-widest uppercase text-xs mb-5">Real Impact</p>
          <h2 className={`font-display text-3xl md:text-4xl lg:text-[2.75rem] text-foreground leading-[1.15] mb-6 transition-all duration-700 ${visible ? "animate-fade-up" : "opacity-0"}`}>
            Same list. Same emails.{" "}
            <span className="text-gradient">Radically different results.</span>
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {[
            { metric: "3×", label: "More replies", detail: "When every link is personal, every open becomes a conversation." },
            { metric: "47%", label: "Longer page visits", detail: "Prospects stay because the page was clearly built for them." },
            { metric: "2.5×", label: "More meetings booked", detail: "A personalized CTA converts. A generic one hopes." },
            { metric: "< 5 min", label: "Setup time", detail: "Connect, pick a list, choose a template. You're live." },
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
   TRACKING — KNOW WHAT HAPPENS AFTER THE CLICK
   ═══════════════════════════════════════════════════════════════════ */
const TrackingSection = () => {
  const { ref, visible } = useInView();

  return (
    <section className="py-24 lg:py-32 bg-background relative">
      <div className="container mx-auto px-4 sm:px-6" ref={ref}>
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center max-w-5xl mx-auto">
          <div className={`transition-all duration-700 ${visible ? "animate-fade-up" : "opacity-0"}`}>
            <p className="text-primary/90 font-medium tracking-widest uppercase text-xs mb-5">Full Visibility</p>
            <h2 className="font-display text-3xl md:text-4xl text-foreground leading-[1.15] mb-6">
              Know exactly who viewed, clicked,{" "}
              <span className="text-gradient">and is ready to talk.</span>
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed mb-6">
              Snov.io tells you who opened the email. Personalized.page tells you what they did next. Every page view, video play, scroll depth, and CTA click—tracked per prospect, in real time.
            </p>
            <ul className="space-y-3">
              {[
                "See which prospects watched your video to the end",
                "Know who clicked your CTA (and who didn't)",
                "Track scroll depth to gauge interest level",
                "Prioritize follow-ups based on actual engagement",
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
              <img src={stepMonitorImg} alt="Analytics dashboard showing per-prospect engagement" className="w-full h-auto block" loading="lazy" />
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
      question: "\"I already have landing pages. Why do I need this?\"",
      answer: "Your current pages serve everyone the same experience. Personalized.page builds a unique page per prospect—automatically. You design one template, we generate hundreds of variations using your Snov.io data.",
    },
    {
      question: "\"Is this going to complicate my workflow?\"",
      answer: "The opposite. Connect Snov.io, pick a list, choose a template. That's three clicks. The URLs feed right back into your drip campaigns. It's less work than what you're doing now.",
    },
    {
      question: "\"What if my list is huge?\"",
      answer: "That's the point. Whether it's 50 prospects or 5,000—every single one gets a page that looks like you spent an hour on it. The whole thing takes minutes.",
    },
    {
      question: "\"Does this replace anything in my stack?\"",
      answer: "Not a thing. Personalized.page is a bolt-on. Snov.io finds the leads. Your emails get the opens. We make sure that when they click, they land somewhere that converts.",
    },
  ];

  return (
    <section className="py-24 lg:py-32 bg-card relative section-divider">
      <div className="container mx-auto px-4 sm:px-6" ref={ref}>
        <div className="max-w-3xl mx-auto text-center mb-16">
          <p className="text-primary/90 font-medium tracking-widest uppercase text-xs mb-5">Common Questions</p>
          <h2 className={`font-display text-3xl md:text-4xl text-foreground leading-[1.15] mb-4 transition-all duration-700 ${visible ? "animate-fade-up" : "opacity-0"}`}>
            Yeah, we get it.{" "}
            <span className="text-gradient">Let's talk about it.</span>
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
  return (
    <section id="snovio-cta" className="py-24 lg:py-32 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{ background: "var(--hero-gradient)" }} />
        <div className="absolute inset-0 bg-noise opacity-[0.015]" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="max-w-xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 border border-primary/20 bg-primary/[0.04] rounded-full px-4 py-1.5 mb-8">
            <img src={snovioLogo} alt="Snov.io" className="h-4" />
            <span className="text-xs font-semibold text-primary/90 tracking-wide">SNOV.IO CUSTOMERS GET PRIORITY ACCESS</span>
          </div>

          <h2 className="font-display text-3xl md:text-4xl lg:text-[2.75rem] text-foreground leading-[1.15] mb-6">
            Your Snov.io list is ready.{" "}
            <span className="text-gradient">Give it somewhere to land.</span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-10">
            Connect your account, pick a list, launch personalized pages in minutes. Free while we're in beta.
          </p>

          <BetaSignupForm source="snovio" defaultTool="Snov.io" />
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
        © {new Date().getFullYear()} Personalized.page · A bolt-on for your outreach stack, not a replacement.
      </p>
    </div>
  </footer>
);

/* ═══════════════════════════════════════════════════════════════════
   PAGE SHELL
   ═══════════════════════════════════════════════════════════════════ */
const SnovioPartner = () => {
  return (
    <div className="min-h-screen bg-background">
      <Hero />
      <ProblemSection />
      <SolutionSection />
      <HowItWorksSection />
      <ShowcaseSection />
      <TrackingSection />
      <ResultsSection />
      <ObjectionSection />
      <FinalCTA />
      <Footer />
    </div>
  );
};

export default SnovioPartner;
