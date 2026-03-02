import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import TemplateAccentProvider from "@/components/TemplateAccentProvider";
import { supabase } from "@/integrations/supabase/client";
import PersonalizedHeroSection from "@/components/PersonalizedHeroSection";
import SectionRenderer from "@/components/builder/SectionRenderer";
import WineVideoPage from "@/pages/wine/WineVideoPage";
import LogoCarousel from "@/components/LogoCarousel";
import AboutSection from "@/components/AboutSection";
import PortfolioStrip from "@/components/PortfolioStrip";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import heroThumbnail from "@/assets/hero-thumbnail.jpg";
import { applyPersonalization, type TemplateContent } from "@/hooks/useTemplateContent";

interface PersonalizedPageData {
  id: string;
  first_name: string;
  last_name: string | null;
  company: string | null;
  custom_message: string | null;
  template_id: string | null;
}

const PersonalizedLanding = () => {
  const { token } = useParams<{ token: string }>();
  const [pageData, setPageData] = useState<PersonalizedPageData | null>(null);
  const [template, setTemplate] = useState<TemplateContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPageAndTemplate = async () => {
      if (!token) {
        setError("Invalid page link");
        setLoading(false);
        return;
      }

      try {
        // Step 1: Fetch personalized page data (SECURITY DEFINER — works for anon)
        const { data, error: fetchError } = await supabase
          .rpc("get_personalized_page_by_token", { lookup_token: token });

        if (fetchError || !data || data.length === 0) {
          setError("Page not found");
          setLoading(false);
          return;
        }

        const pageRecord = data[0];

        // Check if page is paused
        if (pageRecord.is_paused) {
          setError("Page not found");
          setLoading(false);
          return;
        }

        const resolvedTemplateId = pageRecord.template_id;

        setPageData({
          id: pageRecord.id,
          first_name: pageRecord.first_name,
          last_name: pageRecord.last_name,
          company: pageRecord.company,
          custom_message: pageRecord.custom_message,
          template_id: resolvedTemplateId,
        });

        // Step 2: Fetch template via SECURITY DEFINER function (bypasses RLS for anon visitors)
        if (resolvedTemplateId) {
          const { data: templateRows, error: templateError } = await supabase
            .rpc("get_template_for_public_page", { template_uuid: resolvedTemplateId });

          if (templateError) {
            console.error("Template fetch error:", templateError);
          } else if (templateRows && templateRows.length > 0) {
            const t = templateRows[0];
            // Runtime assertion: log template resolution for debugging
            console.log(`[Template Resolution] Page ${pageRecord.id} → template ${t.id} (slug: ${t.slug})`);

            setTemplate({
              ...t,
              portfolio_videos: Array.isArray(t.portfolio_videos)
                ? t.portfolio_videos as TemplateContent["portfolio_videos"]
                : null,
              features_list: Array.isArray(t.features_list)
                ? t.features_list as TemplateContent["features_list"]
                : null,
              feature_cards: Array.isArray(t.feature_cards)
                ? t.feature_cards as TemplateContent["feature_cards"]
                : null,
              testimonials: Array.isArray(t.testimonials)
                ? t.testimonials as TemplateContent["testimonials"]
                : null,
              pricing_tiers: Array.isArray(t.pricing_tiers)
                ? t.pricing_tiers as TemplateContent["pricing_tiers"]
                : null,
              comparison_problem_items: Array.isArray(t.comparison_problem_items)
                ? t.comparison_problem_items as string[]
                : null,
              comparison_solution_items: Array.isArray(t.comparison_solution_items)
                ? t.comparison_solution_items as string[]
                : null,
              sections: Array.isArray(t.sections) ? t.sections : null,
              personalization_config: typeof t.personalization_config === 'object'
                && t.personalization_config !== null
                && !Array.isArray(t.personalization_config)
                ? t.personalization_config as Record<string, boolean>
                : null,
            } as TemplateContent);
          } else {
            console.warn(`[Template Resolution] No template found for ID ${resolvedTemplateId} — template may not be published`);
          }
        }

        // Record the page view
        // Check for return visit via localStorage
        const visitKey = `pv_${pageRecord.id}`;
        const isReturn = !!localStorage.getItem(visitKey);
        localStorage.setItem(visitKey, "1");

        const { data: pvData } = await supabase.from("page_views").insert({
          personalized_page_id: pageRecord.id,
          user_agent: navigator.userAgent,
          is_return_visit: isReturn,
        }).select("id").single();

        // Track time-on-page and scroll depth
        if (pvData?.id) {
          const pageViewId = pvData.id;
          const startTime = Date.now();
          let maxScroll = 0;

          const handleScroll = () => {
            const scrollPercent = Math.round(
              ((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight) * 100
            );
            if (scrollPercent > maxScroll) maxScroll = scrollPercent;
          };

          window.addEventListener("scroll", handleScroll, { passive: true });

          const sendEngagement = () => {
            const seconds = Math.round((Date.now() - startTime) / 1000);
            if (seconds < 1 && maxScroll === 0) return;
            // Use fetch with keepalive for reliability on page unload (supports headers unlike sendBeacon)
            const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/page_views?id=eq.${pageViewId}`;
            fetch(url, {
              method: "PATCH",
              keepalive: true,
              headers: {
                "Content-Type": "application/json",
                "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                "Prefer": "return=minimal",
              },
              body: JSON.stringify({
                time_on_page_seconds: seconds,
                max_scroll_depth: maxScroll,
              }),
            }).catch(() => {});
          };

          // Use visibilitychange (more reliable than beforeunload on mobile)
          const handleVisChange = () => {
            if (document.visibilityState === "hidden") {
              sendEngagement();
            }
          };
          document.addEventListener("visibilitychange", handleVisChange);

          // Cleanup on unmount
          return () => {
            window.removeEventListener("scroll", handleScroll);
            document.removeEventListener("visibilitychange", handleVisChange);
            sendEngagement();
          };
        }

        // Send real-time email alert to campaign owner (fire-and-forget)
        supabase.functions.invoke("notify-page-view", {
          body: { personalized_page_id: pageRecord.id },
        }).catch((err) => console.error("Alert notification failed:", err));
      } catch (err) {
        console.error("Error fetching page:", err);
        setError("Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchPageAndTemplate();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {error ? "Page Not Found" : "Template Not Published"}
          </h1>
          <p className="text-muted-foreground">
            {error || "This page's template is not currently available."}
          </p>
        </div>
      </div>
    );
  }

  const personalizationData = {
    first_name: pageData?.first_name || "",
    last_name: pageData?.last_name || "",
    company: pageData?.company || "",
    full_name: `${pageData?.first_name || ""} ${pageData?.last_name || ""}`.trim(),
  };

  const handleVideoPlay = async () => {
    if (!pageData?.id) return;
    try {
      await supabase.from("video_clicks").insert({
        personalized_page_id: pageData.id,
        user_agent: navigator.userAgent,
      });
    } catch (err) {
      console.error("Error tracking video click:", err);
    }
  };

  const handleLinkClick = async (label: string, url?: string) => {
    if (!pageData?.id) return;
    try {
      await supabase.from("link_clicks").insert({
        personalized_page_id: pageData.id,
        link_label: label,
        link_url: url || null,
        user_agent: navigator.userAgent,
      } as any);
    } catch (err) {
      console.error("Error tracking link click:", err);
    }
  };

  if (template.is_builder_template && Array.isArray(template.sections) && template.sections.length > 0) {
    return (
      <TemplateAccentProvider accentColor={template.accent_color} className="min-h-screen bg-white">
        {template.sections.map((section: any) => (
          <SectionRenderer
            key={section.id}
            section={section}
            isPreview={false}
            personalization={personalizationData}
          />
        ))}
      </TemplateAccentProvider>
    );
  }

  if (template.slug?.startsWith("wine-video")) {
    return (
      <TemplateAccentProvider accentColor={template.accent_color} className="min-h-screen">
        <WineVideoPage template={template} personalization={personalizationData} />
      </TemplateAccentProvider>
    );
  }

  // Default: Police Recruitment Template
  const policeVis = template.personalization_config || {};
  const isPoliceVisible = (key: string) => policeVis[key] !== false;

  return (
    <TemplateAccentProvider accentColor={template.accent_color} className="min-h-screen bg-background">
      <PersonalizedHeroSection 
        thumbnailUrl={template.hero_video_thumbnail_url || heroThumbnail}
        firstName={pageData?.first_name}
        lastName={pageData?.last_name || undefined}
        company={pageData?.company || undefined}
        customMessage={pageData?.custom_message || undefined}
        logoUrl={template.logo_url}
        badge={template.hero_badge || undefined}
        headline={template.hero_headline || undefined}
        subheadline={template.hero_subheadline || undefined}
        ctaPrimaryText={template.hero_cta_primary_text || undefined}
        ctaSecondaryText={template.hero_cta_secondary_text || undefined}
        videoId={template.hero_video_id || undefined}
        showHeaderCta={isPoliceVisible("show_header_cta")}
        showCtaSecondary={isPoliceVisible("show_hero_cta_secondary")}
        onVideoPlay={handleVideoPlay}
        onLinkClick={handleLinkClick}
      />
      {isPoliceVisible("show_trust") && (
        <LogoCarousel 
          imageUrl={template.client_logos_url || undefined}
          title={template.cta_banner_subtitle ? applyPersonalization(template.cta_banner_subtitle, personalizationData) : undefined}
        />
      )}
      {isPoliceVisible("show_about") && (
        <AboutSection 
          title={template.features_title ? applyPersonalization(template.features_title, personalizationData) : undefined}
          content={template.about_content ? applyPersonalization(template.about_content, personalizationData) : undefined}
        />
      )}
      {isPoliceVisible("show_portfolio_strip") && (
        <PortfolioStrip 
          imageUrl={template.portfolio_strip_url || undefined}
        />
      )}
      {isPoliceVisible("show_contact") && (
        <CTASection 
          title={template.contact_title ? applyPersonalization(template.contact_title, personalizationData) : undefined}
          subtitle={template.contact_subtitle ? applyPersonalization(template.contact_subtitle, personalizationData) : undefined}
          contactEmail={template.contact_email || undefined}
          showPrimaryButton={isPoliceVisible("show_contact_cta_primary")}
          showSecondaryButton={isPoliceVisible("show_contact_cta_secondary")}
          onLinkClick={handleLinkClick}
        />
      )}
      <Footer logoUrl={template.logo_url} />
    </TemplateAccentProvider>
  );
};

export default PersonalizedLanding;