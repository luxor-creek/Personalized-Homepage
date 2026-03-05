import VideoPlayer from "./VideoPlayer";
import { Button } from "./ui/button";
import { ArrowDown } from "lucide-react";
import { applyPersonalization } from "@/hooks/useTemplateContent";
import { renderFormattedText } from "@/lib/formatText";

interface PersonalizedHeroSectionProps {
  thumbnailUrl?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  customMessage?: string;
  logoUrl?: string | null;
  badge?: string;
  headline?: string;
  subheadline?: string;
  ctaPrimaryText?: string;
  ctaSecondaryText?: string;
  videoId?: string;
  showHeaderCta?: boolean;
  showCtaSecondary?: boolean;
  onVideoPlay?: () => void;
  onLinkClick?: (label: string, url?: string) => void;
}

const PersonalizedHeroSection = ({ 
  thumbnailUrl, 
  firstName,
  lastName,
  company,
  customMessage,
  logoUrl,
  badge,
  headline,
  subheadline,
  ctaPrimaryText = "Get in Touch",
  ctaSecondaryText = "Learn More",
  videoId = "1153753885",
  showHeaderCta = true,
  showCtaSecondary = true,
  onVideoPlay,
  onLinkClick,
}: PersonalizedHeroSectionProps) => {
  const scrollToContact = () => {
    onLinkClick?.("Get in Touch CTA", "#contact");
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
  };

  const personalizationData = {
    first_name: firstName,
    last_name: lastName || "",
    company: company,
    full_name: `${firstName || ""} ${lastName || ""}`.trim(),
  };

  const getBadge = () => {
    if (badge) return applyPersonalization(badge, personalizationData);
    return company ? `Prepared for ${company}` : "Police Recruitment Video Demo";
  };

  const getHeadline = () => {
    if (headline) return applyPersonalization(headline, personalizationData);
    if (firstName) return `${firstName}, here's our latest officer recruitment video for you to review.`;
    return "A recruitment video that actually helps your hiring pipeline.";
  };

  const getSubheadline = () => {
    if (customMessage) return customMessage;
    if (subheadline) return applyPersonalization(subheadline, personalizationData);
    if (company) return `We created this video specifically for ${company}. Watch how we help the right people self-select into the job.`;
    return "Watch how we create recruitment videos that help the right people self-select into the job.";
  };

  return (
    <section className="min-h-screen hero-gradient noise-overlay relative overflow-hidden">
      {/* Refined radial accent */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div 
          className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full opacity-[0.04]"
          style={{ background: `radial-gradient(circle, hsl(var(--primary)), transparent 70%)` }}
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-14 lg:py-24 relative z-10">
        <header className="flex items-center justify-between mb-16 lg:mb-20 animate-fade-up">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-8 md:h-10 object-contain" />
          ) : (
            <div />
          )}
          {showHeaderCta && (
          <Button variant="heroOutline" size="lg" onClick={scrollToContact} className="hover-lift">
            {ctaPrimaryText}
          </Button>
          )}
        </header>

        <div className="max-w-4xl mx-auto text-center mb-14 lg:mb-20">
          <p className="text-primary/90 font-medium tracking-widest uppercase text-xs mb-5 animate-fade-up">
            {renderFormattedText(getBadge())}
          </p>
          <h1 className="font-display text-4xl md:text-5xl lg:text-[3.5rem] xl:text-[4rem] text-foreground mb-7 animate-fade-up-delay leading-[1.1]">
            {renderFormattedText(getHeadline())}
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-up-delay-2 leading-relaxed">
            {renderFormattedText(getSubheadline())}
          </p>
        </div>

        <div className="max-w-4xl mx-auto animate-fade-up-delay-2">
          <div className="shadow-premium rounded-xl overflow-hidden">
            <VideoPlayer videoId={videoId} thumbnailUrl={thumbnailUrl} onVideoPlay={onVideoPlay} />
          </div>
        </div>

        {showCtaSecondary && (
        <div className="flex justify-center mt-14 lg:mt-20 animate-fade-up-delay-3">
          <button 
            onClick={() => {
              onLinkClick?.("Learn More CTA", "#about");
              document.getElementById("about")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-colors duration-300 group"
          >
            <span className="text-xs uppercase tracking-widest font-medium">{ctaSecondaryText}</span>
            <ArrowDown className="w-4 h-4 animate-bounce" />
          </button>
        </div>
        )}
      </div>
    </section>
  );
};

export default PersonalizedHeroSection;
