import { useMemo } from "react";
import { renderFormattedText } from "@/lib/formatText";

interface AboutSectionProps {
  title?: string;
  content?: string;
}

const DEFAULT_TITLE = "Why Departments Choose Kicker Video";
const DEFAULT_CONTENT = `Most police recruitment videos aren't broken.
They're just outdated.

They were made for a time when interest was high and competition was low. Today, recruits are more cautious, more informed, and quicker to walk away if something feels unrealistic or unclear.

We see the same pattern again and again.
Departments invest in a video that looks professional, but doesn't answer the questions candidates are really asking. The result. Fewer qualified applicants and more drop-off later in the process.

**Kicker builds recruitment videos with one goal.**
**Help the right people self-select into the job.**

That means showing the work honestly. Letting officers speak in their own words. Being clear about expectations, career paths, and what the job actually demands.

We recently wrapped a recruitment video for the Pittsburgh Police Department using this approach. The department saw stronger engagement and better-fit applicants because the video did its job early in the funnel.

If your current recruitment video is more than a few years old, it's worth asking a simple question.
*Is it helping your pipeline. Or quietly hurting it.*`;

const AboutSection = ({ 
  title = DEFAULT_TITLE,
  content = DEFAULT_CONTENT 
}: AboutSectionProps) => {

  // Parse content into paragraphs
  const parsedContent = useMemo(() => {
    const paragraphs = content.split('\n\n').filter(p => p.trim());
    
    return paragraphs.map((paragraph, index) => {
      // Handle line breaks within paragraph
      const lines = paragraph.split('\n');
      
      return {
        key: index,
        lines,
      };
    });
  }, [content]);

  // Parse title for gradient effect
  const renderTitle = () => renderFormattedText(title);

  return (
    <section id="about" className="py-24 lg:py-36 bg-card relative section-divider">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center mb-14">
          <h2 className="font-display text-3xl md:text-4xl lg:text-[2.75rem] text-foreground mb-6 leading-[1.15]">
            {renderTitle()}
          </h2>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="space-y-7 text-base md:text-lg text-muted-foreground leading-[1.75]">
            {parsedContent.map((para) => (
              <p key={para.key}>
                {para.lines.map((line, i) => (
                  <span key={i}>
                    {renderFormattedText(line)}
                    {i < para.lines.length - 1 && <br />}
                  </span>
                ))}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
