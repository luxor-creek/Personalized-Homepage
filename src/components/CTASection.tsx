import { Button } from "./ui/button";
import { Mail, ExternalLink } from "lucide-react";
import { renderFormattedText } from "@/lib/formatText";

interface CTASectionProps {
  title?: string;
  subtitle?: string;
  contactEmail?: string;
  showPrimaryButton?: boolean;
  showSecondaryButton?: boolean;
  onLinkClick?: (label: string, url?: string) => void;
}

const CTASection = ({ 
  title = "Ready to Get Started?",
  subtitle = "Let's discuss how personalized landing pages can help you connect with your audience.",
  contactEmail = "hello@personalized.page",
  showPrimaryButton = true,
  showSecondaryButton = true,
  onLinkClick,
}: CTASectionProps) => {

  // Parse title for gradient effect
  const renderTitle = () => {
    // Check if title contains "Recruitment Strategy" to apply gradient
    if (title.includes("Recruitment Strategy")) {
      const parts = title.split("Recruitment Strategy");
      return (
        <>
          {parts[0]}
          <span className="text-gradient block mt-2">Recruitment Strategy?</span>
          {parts[1]?.replace("?", "")}
        </>
      );
    }
    return renderFormattedText(title);
  };

  return (
    <section id="contact" className="py-20 lg:py-32 hero-gradient relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            {renderTitle()}
          </h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
            {renderFormattedText(subtitle)}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            {showPrimaryButton && (
            <Button variant="hero" size="xl" asChild>
              <a href={`mailto:${contactEmail}`} onClick={() => onLinkClick?.("Contact Us", `mailto:${contactEmail}`)}>
                <Mail className="w-5 h-5" />
                Contact Us
              </a>
            </Button>
            )}
            {showSecondaryButton && (
            <Button variant="heroOutline" size="xl" asChild>
              <a href="https://personalized.page" target="_blank" rel="noopener noreferrer" onClick={() => onLinkClick?.("Visit Website", "https://personalized.page")}>
                <ExternalLink className="w-5 h-5" />
                Visit Website
              </a>
            </Button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center text-muted-foreground">
            <a 
              href={`mailto:${contactEmail}`}
              className="flex items-center gap-2 hover:text-primary transition-colors"
            >
              <Mail className="w-4 h-4" />
              {contactEmail}
            </a>
            <span className="hidden sm:block text-border">|</span>
            <a 
              href="https://personalized.page" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-primary transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              personalized.page
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
