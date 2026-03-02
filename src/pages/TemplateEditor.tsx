import { useState, useEffect } from "react";
import TemplateAccentProvider from "@/components/TemplateAccentProvider";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useTemplateEditor } from "@/hooks/useTemplateEditor";
import EditorSidebar from "@/components/editor/EditorSidebar";
import EditableText from "@/components/editor/EditableText";
import EditableVideo from "@/components/editor/EditableVideo";
import EditableImage from "@/components/editor/EditableImage";
import RichTextEditor from "@/components/editor/RichTextEditor";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import clientLogos from "@/assets/client-logos.png";
import portfolioStrip from "@/assets/portfolio-strip.png";
import { ArrowDown, Play, DollarSign, Mail, ExternalLink, X, Check, Upload, Trash2, AlertTriangle } from "lucide-react";
import EditableSampleRequestForm from "@/components/editor/EditableSampleRequestForm";
import ButtonToggleWrapper from "@/components/editor/ButtonToggleWrapper";
import { supabase } from "@/integrations/supabase/client";

const DEFAULT_ABOUT_CONTENT = `Most police recruitment videos aren't broken.
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

const TemplateEditor = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isPreviewOnly = searchParams.get("preview") === "true";
  const { toast } = useToast();
  const {
    template,
    loading,
    saving,
    error,
    hasChanges,
    updateField,
    saveChanges,
    discardChanges,
  } = useTemplateEditor(slug);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [activeCampaignCount, setActiveCampaignCount] = useState(0);
  const [activeCampaignNames, setActiveCampaignNames] = useState<string[]>([]);

  // Check if this template is used by any active campaigns with personalized pages
  useEffect(() => {
    const checkActiveCampaigns = async () => {
      if (!template?.id) return;
      try {
        const { data: campaigns } = await supabase
          .from("campaigns")
          .select("id, name")
          .eq("template_id", template.id);
        
        if (!campaigns || campaigns.length === 0) {
          setActiveCampaignCount(0);
          setActiveCampaignNames([]);
          return;
        }

        let count = 0;
        const names: string[] = [];
        for (const campaign of campaigns) {
          const { count: pageCount } = await supabase
            .from("personalized_pages")
            .select("*", { count: "exact", head: true })
            .eq("campaign_id", campaign.id);
          if (pageCount && pageCount > 0) {
            count++;
            names.push(campaign.name);
          }
        }
        setActiveCampaignCount(count);
        setActiveCampaignNames(names);
      } catch (err) {
        console.error("Error checking active campaigns:", err);
      }
    };
    checkActiveCampaigns();
  }, [template?.id]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !template) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload an image file.", variant: "destructive" });
      return;
    }
    setUploadingLogo(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${template.id}/logo.${ext}`;
      const { error: uploadError } = await supabase.storage.from("template-logos").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("template-logos").getPublicUrl(path);
      updateField("logo_url", urlData.publicUrl);
      toast({ title: "Logo uploaded!" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = () => {
    updateField("logo_url", null);
  };

  const handleSave = async () => {
    const success = await saveChanges();
    if (success) {
      // Stay on page to allow more edits
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      if (confirm("You have unsaved changes. Are you sure you want to leave?")) {
        navigate("/workspace");
      }
    } else {
      navigate("/workspace");
    }
  };

  const handlePreview = () => {
    // Open preview in new tab with cache-busting timestamp
    // Use current origin to ensure we stay on preview domain (not published)
    const origin = window.location.origin;
    const cacheBuster = `?t=${Date.now()}`;
    
    let previewPath = "";
    if (template?.slug?.startsWith("police-recruitment")) {
      previewPath = "/police-recruitment";
    } else if (template?.slug?.startsWith("b2b-demo")) {
      previewPath = "/b2b-demo";
    } else if (template?.slug?.startsWith("wine-video")) {
      previewPath = "/wine-video";
    }
    
    if (previewPath) {
      window.open(`${origin}${previewPath}${cacheBuster}`, "_blank");
    }
  };

  const handleInsertToken = (token: string) => {
    toast({
      title: "Token copied!",
      description: `${token} copied to clipboard. Paste it into any text field.`,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading editor...</div>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Template Not Found</h1>
          <p className="text-muted-foreground mb-4">{error || "The requested template does not exist."}</p>
          <Button onClick={() => navigate("/workspace")}>Back to Workspace</Button>
        </div>
      </div>
    );
  }


  // Wine Video template
  const WINE_SECTION_TOGGLES = [
    { key: "show_features", label: "Features Section" },
    { key: "show_process", label: "Process Steps" },
    { key: "show_portfolio", label: "Portfolio / Examples" },
    { key: "show_testimonials", label: "Testimonials" },
    { key: "show_comparison", label: "Problem vs Solution" },
    { key: "show_pricing", label: "Pricing / Custom" },
    { key: "show_cta_banner", label: "CTA Banner" },
    { key: "show_form", label: "Request Form" },
    { key: "show_contact", label: "Final CTA" },
  ];

  const sectionVisibility = template.personalization_config || {};
  const handleSectionVisibilityChange = (key: string, visible: boolean) => {
    updateField("personalization_config", { ...sectionVisibility, [key]: visible });
  };
  const isSectionVisible = (key: string) => sectionVisibility[key] !== false;

  if (template.slug.startsWith("wine-video")) {
    return (
      <TemplateAccentProvider accentColor={template.accent_color} className="min-h-screen bg-[#f0f4f8]">
        {/* Sidebar */}
        {!isPreviewOnly && (
          <EditorSidebar
            templateName={template.name}
            hasChanges={hasChanges}
            isSaving={saving}
            onSave={handleSave}
            onCancel={handleCancel}
            onPreview={handlePreview}
            onInsertToken={handleInsertToken}
            accentColor={template.accent_color}
            onAccentColorChange={(color) => updateField("accent_color", color)}
            sectionToggles={WINE_SECTION_TOGGLES}
            sectionVisibility={sectionVisibility}
            onSectionVisibilityChange={handleSectionVisibilityChange}
          />
        )}

        {/* Live campaign warning */}
        {!isPreviewOnly && activeCampaignCount > 0 && (
          <div className="lg:mr-80 bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p>
                <strong>Heads up:</strong> This template is used by the campaign{activeCampaignNames.length > 1 ? 's' : ''} <strong>{activeCampaignNames.join(', ')}</strong> with live Personalized Page links. Any changes you save could break those live links.
              </p>
              <p className="mt-1 text-amber-700">
                To edit safely, go back and clone this template first — then edit the clone instead.
              </p>
            </div>
          </div>
        )}

        {/* Main content - with right margin for sidebar */}
        <div className={isPreviewOnly ? "" : "lg:mr-80"}>
          {/* Header */}
          <header className="py-4 px-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative group">
                {template.logo_url ? (
                  <div className="flex items-center gap-2">
                    <img src={template.logo_url} alt="Logo" className="h-8 object-contain" />
                    <button onClick={handleRemoveLogo} className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive" title="Remove logo"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors text-sm text-muted-foreground">
                    <Upload className="w-4 h-4" />
                    {uploadingLogo ? "Uploading..." : "Upload Logo (optional)"}
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploadingLogo} />
                  </label>
                )}
              </div>
              <span className="text-muted-foreground">×</span>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-foreground">
                  <RichTextEditor
                    value={template.hero_badge || "Personalized for {{company}}"}
                    onChange={(value) => updateField("hero_badge", value)}
                    fieldName="Header Company Badge"
                    supportsPersonalization
                    isHeadline
                  />
                </span>
              </div>
            </div>
            <ButtonToggleWrapper configKey="show_header_cta" visible={isSectionVisible("show_header_cta")} onToggle={handleSectionVisibilityChange}>
              <Button variant="outline" className="gap-2">
                <EditableText
                  value={template.hero_cta_primary_text || "Get a Free Video"}
                  onChange={(value) => updateField("hero_cta_primary_text", value)}
                  fieldName="Header CTA"
                />
              </Button>
            </ButtonToggleWrapper>
          </header>

          {/* Hero Section */}
          <section className="py-12 px-6">
            <div className="max-w-6xl mx-auto">
              <div className="p-8 md:p-12 bg-white rounded-3xl shadow-sm">
                <div className="flex items-center gap-2 text-primary mb-6">
                  <span className="text-sm font-medium uppercase tracking-wide">
                    <EditableText
                      value={template.hero_badge || "Personalized for {{company}}"}
                      onChange={(value) => updateField("hero_badge", value)}
                      fieldName="Hero Personalization Badge"
                      supportsPersonalization
                    />
                  </span>
                </div>

                <div className="grid md:grid-cols-2 gap-8 items-start">
                  <div>
                    <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight mb-4">
                      <RichTextEditor
                        value={template.hero_headline}
                        onChange={(value) => updateField("hero_headline", value)}
                        fieldName="Hero Headline"
                        supportsPersonalization
                        isHeadline
                      />
                    </h1>
                    <div className="text-lg text-muted-foreground mb-8">
                      <RichTextEditor
                        value={template.hero_subheadline || "$20 each? We will produce a custom video for each of your wine's for $20."}
                        onChange={(value) => updateField("hero_subheadline", value)}
                        fieldName="Hero Subheadline"
                        supportsPersonalization
                      />
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <ButtonToggleWrapper configKey="show_hero_cta_primary" visible={isSectionVisible("show_hero_cta_primary")} onToggle={handleSectionVisibilityChange}>
                        <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                          <EditableText
                            value={template.hero_cta_primary_text || "Get a Free Video"}
                            onChange={(value) => updateField("hero_cta_primary_text", value)}
                            fieldName="Hero CTA"
                          />
                        </Button>
                      </ButtonToggleWrapper>
                    </div>
                  </div>

                  {/* Video */}
                  <div className="relative">
                    <EditableVideo
                      videoId={template.hero_video_id || "76979871"}
                      thumbnailUrl={template.hero_video_thumbnail_url || undefined}
                      onVideoChange={(videoId) => updateField("hero_video_id", videoId)}
                      onThumbnailChange={(url) => updateField("hero_video_thumbnail_url", url)}
                    />
                    <div className="mt-3 text-muted-foreground">
                      <RichTextEditor
                        value={template.hero_cta_secondary_text || "{{first_name}}, take a look at this video demo."}
                        onChange={(value) => updateField("hero_cta_secondary_text", value)}
                        fieldName="Video Caption"
                        supportsPersonalization
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Simple Video Production Section */}
          {isSectionVisible("show_features") && (
          <section className="py-16 px-6">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                <RichTextEditor
                  value={template.features_title || "Simple Video Production"}
                  onChange={(value) => updateField("features_title", value)}
                  fieldName="Features Title"
                  isHeadline
                />
              </h2>
              <div className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
                <RichTextEditor
                  value={template.features_subtitle || "We turn your existing wine product pages into short, elegant videos that highlight each bottle, then prepare those videos for modern discovery across search, social, and video platforms."}
                  onChange={(value) => updateField("features_subtitle", value)}
                  fieldName="Features Subtitle"
                />
              </div>

              {/* Feature Cards - Editable */}
              <div className="grid md:grid-cols-3 gap-6">
                {(template.feature_cards?.length > 0 
                  ? template.feature_cards 
                  : [
                      { title: "No Filming", subtitle: "No camera crews" },
                      { title: "No Scriptwriting", subtitle: "Content comes from your pages" },
                      { title: "No Delay", subtitle: "Fast Turnaround" },
                    ]
                ).map((card: any, index: number) => (
                  <div key={index} className="p-6 bg-white rounded-lg text-center">
                    <div className="text-2xl font-bold text-foreground mb-2">
                      <EditableText
                        value={card.title || ""}
                        onChange={(value) => {
                          const newCards = [...(template.feature_cards?.length > 0 
                            ? template.feature_cards 
                            : [
                                { title: "No Filming", subtitle: "No camera crews" },
                                { title: "No Scriptwriting", subtitle: "Content comes from your pages" },
                                { title: "No Delay", subtitle: "Fast Turnaround" },
                              ])];
                          newCards[index] = { ...newCards[index], title: value };
                          updateField("feature_cards", newCards);
                        }}
                        fieldName={`Feature Card ${index + 1} Title`}
                      />
                    </div>
                    <div className="text-muted-foreground">
                      <EditableText
                        value={card.subtitle || ""}
                        onChange={(value) => {
                          const newCards = [...(template.feature_cards?.length > 0 
                            ? template.feature_cards 
                            : [
                                { title: "No Filming", subtitle: "No camera crews" },
                                { title: "No Scriptwriting", subtitle: "Content comes from your pages" },
                                { title: "No Delay", subtitle: "Fast Turnaround" },
                              ])];
                          newCards[index] = { ...newCards[index], subtitle: value };
                          updateField("feature_cards", newCards);
                        }}
                        fieldName={`Feature Card ${index + 1} Subtitle`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
          )}

          {/* Process Section */}
          {isSectionVisible("show_process") && (
          <section className="py-16 px-6 bg-white">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-12 text-center">
                <RichTextEditor
                  value={template.about_content || "A simple process built for busy wine marketers"}
                  onChange={(value) => updateField("about_content", value)}
                  fieldName="Process Section Title"
                  isHeadline
                />
              </h2>

              {/* Process Steps */}
              <div className="grid md:grid-cols-5 gap-6">
                {(template.pricing_tiers?.length > 0
                  ? template.pricing_tiers
                  : [
                      { number: 1, title: "Send URLs", description: "Send the URL's of each product. This can be links or a csv spreadsheet." },
                      { number: 2, title: "Template", description: "We create the branded template for your approval and revisions." },
                      { number: 3, title: "Production", description: "We produce all videos within 2-3 days." },
                      { number: 4, title: "Review", description: "You review them." },
                      { number: 5, title: "Delivery", description: "Delivery to you." },
                    ]
                ).map((step: any, index: number) => (
                  <div key={index} className="text-center">
                    <div className="relative mb-4">
                      <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground text-xl font-bold flex items-center justify-center mx-auto">
                        {step.number || index + 1}
                      </div>
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">
                      <EditableText
                        value={step.title || ""}
                        onChange={(value) => {
                          const defaults = [
                            { number: 1, title: "Send URLs", description: "Send the URL's of each product. This can be links or a csv spreadsheet." },
                            { number: 2, title: "Template", description: "We create the branded template for your approval and revisions." },
                            { number: 3, title: "Production", description: "We produce all videos within 2-3 days." },
                            { number: 4, title: "Review", description: "You review them." },
                            { number: 5, title: "Delivery", description: "Delivery to you." },
                          ];
                          const current = template.pricing_tiers?.length > 0 ? [...template.pricing_tiers] : [...defaults];
                          current[index] = { ...current[index], title: value };
                          updateField("pricing_tiers", current);
                        }}
                        fieldName={`Process Step ${index + 1} Title`}
                      />
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      <EditableText
                        value={step.description || ""}
                        onChange={(value) => {
                          const defaults = [
                            { number: 1, title: "Send URLs", description: "Send the URL's of each product. This can be links or a csv spreadsheet." },
                            { number: 2, title: "Template", description: "We create the branded template for your approval and revisions." },
                            { number: 3, title: "Production", description: "We produce all videos within 2-3 days." },
                            { number: 4, title: "Review", description: "You review them." },
                            { number: 5, title: "Delivery", description: "Delivery to you." },
                          ];
                          const current = template.pricing_tiers?.length > 0 ? [...template.pricing_tiers] : [...defaults];
                          current[index] = { ...current[index], description: value };
                          updateField("pricing_tiers", current);
                        }}
                        fieldName={`Process Step ${index + 1} Description`}
                      />
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
          )}

          {/* Other Examples / Portfolio Section */}
          {isSectionVisible("show_portfolio") && (
          <section className="py-16 px-6">
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                  <RichTextEditor
                    value={template.testimonials_subtitle || "Other Examples"}
                    onChange={(value) => updateField("testimonials_subtitle", value)}
                    fieldName="Portfolio Section Title"
                    isHeadline
                  />
                </h2>
              </div>
              <div className="text-lg text-muted-foreground mb-10 max-w-3xl">
                <RichTextEditor
                  value={template.portfolio_strip_url || "Here are a few other videos our automated system produced using only the product webpage URL's. Scripted, voiced, and edited in less than an hour."}
                  onChange={(value) => updateField("portfolio_strip_url", value)}
                  fieldName="Portfolio Section Description"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {(template.portfolio_videos?.length > 0 
                  ? template.portfolio_videos 
                  : [
                      { title: "Product overview", videoId: "1084786498" },
                      { title: "Brand story", videoId: "1084786498" },
                      { title: "Event/trade show", videoId: "1084786498" },
                    ]
                ).map((item: any, index: number) => (
                  <div key={index} className="overflow-hidden rounded-lg group bg-white">
                    <div className="relative aspect-video bg-black">
                      <EditableVideo
                        videoId={item.videoId || "1084786498"}
                        onVideoChange={(videoId) => {
                          const defaultVideos: Array<{ title: string; videoId: string }> = [
                            { title: "Product overview", videoId: "1084786498" },
                            { title: "Brand story", videoId: "1084786498" },
                            { title: "Event/trade show", videoId: "1084786498" },
                          ];
                          const currentVideos = template.portfolio_videos?.length > 0 
                            ? template.portfolio_videos as Array<{ title: string; videoId: string }>
                            : defaultVideos;
                          const newVideos = [...currentVideos];
                          newVideos[index] = { ...newVideos[index], videoId };
                          updateField("portfolio_videos", newVideos);
                        }}
                      />
                    </div>
                    <div className="p-4 bg-white">
                      <EditableText
                        value={item.title}
                        onChange={(value) => {
                          const defaultVideos: Array<{ title: string; videoId: string }> = [
                            { title: "Product overview", videoId: "1084786498" },
                            { title: "Brand story", videoId: "1084786498" },
                            { title: "Event/trade show", videoId: "1084786498" },
                          ];
                          const currentVideos = template.portfolio_videos?.length > 0 
                            ? template.portfolio_videos as Array<{ title: string; videoId: string }>
                            : defaultVideos;
                          const newVideos = [...currentVideos];
                          newVideos[index] = { ...newVideos[index], title: value };
                          updateField("portfolio_videos", newVideos);
                        }}
                        fieldName={`Portfolio Video ${index + 1} Title`}
                        className="font-medium text-foreground"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
          )}

          {/* Testimonials Section */}
          {isSectionVisible("show_testimonials") && (
          <section className="py-16 px-6 bg-white">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-10 text-center">
                <RichTextEditor
                  value={template.testimonials_title || "What teams like {{company}} say"}
                  onChange={(value) => updateField("testimonials_title", value)}
                  fieldName="Testimonials Title"
                  supportsPersonalization
                  isHeadline
                />
              </h2>

              {/* Testimonial Cards - Editable */}
              <div className="grid md:grid-cols-3 gap-6">
                {(template.testimonials?.length > 0 
                  ? template.testimonials 
                  : [
                      { quote: "Kicker made complex messaging simple and engaging. Fast, on-budget, and on-brand." },
                      { quote: "Smooth process from brief to delivery. Their team felt like an extension of ours." },
                      { quote: "The videos moved the needle on demos and deal velocity. Highly recommend." },
                    ]
                ).map((testimonial: any, index: number) => (
                  <div key={index} className="p-6 bg-gray-50 rounded-lg border-0">
                    <div className="w-6 h-6 text-primary mb-4">❝</div>
                    <div className="text-foreground leading-relaxed">
                      <EditableText
                        value={typeof testimonial === 'string' ? testimonial : (testimonial.quote || "")}
                        onChange={(value) => {
                          const existingTestimonials = template.testimonials?.length > 0 
                            ? template.testimonials 
                            : [
                                { quote: "Kicker made complex messaging simple and engaging. Fast, on-budget, and on-brand." },
                                { quote: "Smooth process from brief to delivery. Their team felt like an extension of ours." },
                                { quote: "The videos moved the needle on demos and deal velocity. Highly recommend." },
                              ];
                          const newTestimonials = [...existingTestimonials];
                          newTestimonials[index] = { quote: value };
                          updateField("testimonials", newTestimonials);
                        }}
                        fieldName={`Testimonial ${index + 1}`}
                        multiline
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
          )}

          {/* Comparison Section - Problem vs Solution */}
          {isSectionVisible("show_comparison") && (
          <section className="py-16 px-6 bg-muted/30">
            <div className="max-w-6xl mx-auto">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Problem Side */}
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4">
                    THE PROBLEM
                  </p>
                  <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8">
                    <RichTextEditor
                      value={template.comparison_problem_title || "Why Viaxo Exists"}
                      onChange={(value) => updateField("comparison_problem_title", value)}
                      fieldName="Problem Title"
                      isHeadline
                    />
                  </h2>
                  <div className="space-y-4">
                    {(template.comparison_problem_items?.length > 0 
                      ? template.comparison_problem_items 
                      : ["Traditional video production doesn't scale", "Static pages underperform in engagement", "Search and AI discovery prioritize video"]
                    ).map((item, index) => (
                      <div key={index} className="flex items-center gap-4 bg-white rounded-lg p-4 shadow-sm">
                        <X className="w-5 h-5 text-red-500 flex-shrink-0" />
                        <EditableText
                          value={item}
                          onChange={(value) => {
                            const newItems = [...(template.comparison_problem_items || [])];
                            newItems[index] = value;
                            updateField("comparison_problem_items", newItems);
                          }}
                          fieldName={`Problem Item ${index + 1}`}
                          className="flex-1"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Solution Side */}
                <div className="p-8 bg-white rounded-lg border border-gray-200">
                  <p className="text-xs font-medium uppercase tracking-wider text-primary mb-4">
                    THE SOLUTION
                  </p>
                  <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                    <RichTextEditor
                      value={template.comparison_solution_title || "Infrastructure for Practical Video at Scale"}
                      onChange={(value) => updateField("comparison_solution_title", value)}
                      fieldName="Solution Title"
                      isHeadline
                    />
                  </h3>
                  <div className="text-muted-foreground mb-6">
                    <RichTextEditor
                      value={template.comparison_solution_description || "Viaxo provides infrastructure that makes video practical across entire catalogs and campaigns."}
                      onChange={(value) => updateField("comparison_solution_description", value)}
                      fieldName="Solution Description"
                    />
                  </div>
                  <div className="space-y-3">
                    {(template.comparison_solution_items?.length > 0 
                      ? template.comparison_solution_items 
                      : ["Automated generation from existing content", "Template-driven consistency", "Bulk processing capability", "White-label delivery"]
                    ).map((item, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-primary flex-shrink-0" />
                        <EditableText
                          value={item}
                          onChange={(value) => {
                            const newItems = [...(template.comparison_solution_items || [])];
                            newItems[index] = value;
                            updateField("comparison_solution_items", newItems);
                          }}
                          fieldName={`Solution Item ${index + 1}`}
                          className="flex-1"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
          )}

          {/* Pricing Section */}
          {isSectionVisible("show_pricing") && (
          <section className="py-16 px-6">
            <div className="max-w-5xl mx-auto">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                    <RichTextEditor
                      value={template.pricing_title || "Want something more custom?"}
                      onChange={(value) => updateField("pricing_title", value)}
                      fieldName="Pricing Title"
                      isHeadline
                    />
                  </h2>
                  <div className="text-lg text-muted-foreground mb-8">
                    <RichTextEditor
                      value={template.pricing_subtitle || "Project-based pricing with options for scope. Social clips can start under $1k; multi-location shoots may exceed $10k."}
                      onChange={(value) => updateField("pricing_subtitle", value)}
                      fieldName="Pricing Subtitle"
                    />
                  </div>

                  <ul className="space-y-4 mb-8">
                    {(template.comparison_solution_items?.length > 0
                      ? template.comparison_solution_items
                      : [
                          "Transparent estimates before kickoff",
                          "21-city crew network, minimal travel costs",
                          "Live action, animation, or hybrid",
                        ]
                    ).map((item: string, index: number) => (
                      <li key={index} className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-primary flex-shrink-0" />
                        <EditableText
                          value={item}
                          onChange={(value) => {
                            const defaults = ["Transparent estimates before kickoff", "21-city crew network, minimal travel costs", "Live action, animation, or hybrid"];
                            const current = template.comparison_solution_items?.length > 0 ? [...template.comparison_solution_items] : [...defaults];
                            current[index] = value;
                            updateField("comparison_solution_items", current);
                          }}
                          fieldName={`Pricing Feature ${index + 1}`}
                          className="flex-1 text-foreground"
                        />
                      </li>
                    ))}
                  </ul>

                  <div className="flex flex-wrap gap-3">
                    <ButtonToggleWrapper configKey="show_pricing_cta" visible={isSectionVisible("show_pricing_cta")} onToggle={handleSectionVisibilityChange}>
                      <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                        <EditableText
                          value={template.hero_cta_primary_text || "Get a Free Video"}
                          onChange={(value) => updateField("hero_cta_primary_text", value)}
                          fieldName="Pricing CTA"
                        />
                      </Button>
                    </ButtonToggleWrapper>
                  </div>
                </div>

                <div className="rounded-2xl overflow-hidden">
                  <EditableImage
                    src={template.custom_section_image_url || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&h=400&fit=crop"}
                    alt="Custom section"
                    onImageChange={(url) => updateField("custom_section_image_url", url)}
                    className="w-full h-full object-cover"
                    templateId={template.id}
                  />
                </div>
              </div>
            </div>
          </section>
          )}

          {/* CTA Banner Section */}
          {isSectionVisible("show_cta_banner") && (
          <section className="py-16 px-6" style={{ background: `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.85))` }}>
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary-foreground">
                <span className="[&_.group]:text-primary-foreground">
                  <RichTextEditor
                    value={template.cta_banner_title || "Let's work together, {{first_name}}"}
                    onChange={(value) => updateField("cta_banner_title", value)}
                    fieldName="CTA Banner Title"
                    supportsPersonalization
                    isHeadline
                  />
                </span>
              </h2>
              <div className="text-lg mb-8 text-primary-foreground/80">
                <span className="[&_.group]:text-primary-foreground/80">
                  <RichTextEditor
                    value={template.cta_banner_subtitle || "We're excited to show {{company}} what's possible. Get started in minutes."}
                    onChange={(value) => updateField("cta_banner_subtitle", value)}
                    fieldName="CTA Banner Subtitle"
                    supportsPersonalization
                  />
                </span>
              </div>
            </div>
          </section>
          )}

          {/* Sample Request Form Section */}
          {isSectionVisible("show_form") && (
          <EditableSampleRequestForm
            formTitle={template.form_section_title ?? "Request a Sample Video"}
            formSubtitle={template.form_section_subtitle ?? "See what Kicker can do with your content. We'll generate a sample video from your existing page—no creative brief required."}
            onTitleChange={(value) => updateField("form_section_title", value)}
            onSubtitleChange={(value) => updateField("form_section_subtitle", value)}
            formSteps={template.form_steps}
            onStepsChange={(steps) => updateField("form_steps", steps)}
          />
          )}

          {/* Final CTA Section */}
          {isSectionVisible("show_contact") && (
          <section className="py-16 px-6 bg-white">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                <RichTextEditor
                  value={template.contact_title || "Let's make {{company}} the obvious choice"}
                  onChange={(value) => updateField("contact_title", value)}
                  fieldName="Contact Title"
                  supportsPersonalization
                  isHeadline
                />
              </h2>
              <div className="text-lg text-muted-foreground mb-8">
                <RichTextEditor
                  value={template.contact_subtitle || "Book a quick brainstorm with a senior producer. We'll scope ideas, timelines, and budget in one call."}
                  onChange={(value) => updateField("contact_subtitle", value)}
                  fieldName="Contact Subtitle"
                  supportsPersonalization
                />
              </div>

              <div className="flex flex-wrap gap-4 justify-center">
                <ButtonToggleWrapper configKey="show_final_cta" visible={isSectionVisible("show_final_cta")} onToggle={handleSectionVisibilityChange}>
                  <Button size="lg" className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                    <EditableText
                      value={template.hero_cta_primary_text || "Get a Free Video"}
                      onChange={(value) => updateField("hero_cta_primary_text", value)}
                      fieldName="Final CTA"
                    />
                  </Button>
                </ButtonToggleWrapper>
              </div>
            </div>
          </section>
          )}

          {/* Footer */}
          <footer className="py-8 px-6 bg-gray-50 border-t">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
              {template.logo_url ? (
                <img src={template.logo_url} alt="Logo" className="h-6 object-contain" />
              ) : null}
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} Kicker Video. Professional video production.
              </p>
            </div>
          </footer>
        </div>
      </TemplateAccentProvider>
    );
  }

  // B2B Demo template
  if (template.slug === "b2b-demo") {
    // Default feature list items
    const defaultFeatureList = [
      { title: "Script to screen in weeks, not months.", description: "Detailed pre‑pro and rapid iteration." },
      { title: "On‑brand, on‑budget.", description: "Clear scopes; no surprises." },
      { title: "Local crews in 21 cities.", description: "Lower travel costs across US & Canada." },
    ];
    
    // Default feature cards
    const defaultFeatureCards = [
      { title: "A guided process", description: "Kickoff, creative brief, pre‑pro, production, post. Aligned and transparent at every step." },
      { title: "AI‑assisted efficiency", description: "Faster scripting, storyboards, and revisions without sacrificing quality." },
      { title: "Outcomes that convert", description: "Sales‑ready demos, explainer videos, and launch assets your team can deploy fast." },
      { title: "Seamless collaboration", description: "We plug into your workflow with timely check‑ins and clear revision windows." },
    ];
    
    // Default testimonials
    const defaultTestimonials = [
      { quote: "They distilled our complex platform into a crisp, 2‑minute demo that our sales team uses daily.", author: "VP Marketing, SaaS" },
      { quote: "Fast, organized, and on brand. The process was seamless even across two locations.", author: "Director of Product Marketing, Healthcare" },
      { quote: "Great value for the quality. Clear scope and quick iterations saved us weeks.", author: "Head of Comms, Manufacturing" },
    ];
    
    // Default pricing tiers
    const defaultPricingTiers = [
      { name: "Social & cut‑downs", description: "Short‑form assets, repurposed edits", price: "From <$1k", features: [":15–:45 edits • captions • thumbnails", "Fast turnaround"], cta: "Request scope", featured: false },
      { name: "Product demo / explainer", description: "90–120s primary asset + cut‑downs", price: "$3k–$8k", features: ["Script, storyboard, VO/music", "Animation or live‑action"], cta: "Start your demo", featured: true },
      { name: "Multi‑location shoot", description: "Crews in 21 cities to reduce travel", price: "$8k–$25k", features: ["Producer + crew + gear", "Full post‑production", "Price depends on # of locations"], cta: "Get a quote", featured: false },
    ];

    const featureList = (template.features_list as typeof defaultFeatureList)?.length > 0 ? template.features_list as typeof defaultFeatureList : defaultFeatureList;
    const featureCards = (template.feature_cards as typeof defaultFeatureCards)?.length > 0 ? template.feature_cards as typeof defaultFeatureCards : defaultFeatureCards;
    const testimonials = (template.testimonials as typeof defaultTestimonials)?.length > 0 ? template.testimonials as typeof defaultTestimonials : defaultTestimonials;
    const pricingTiers = (template.pricing_tiers as typeof defaultPricingTiers)?.length > 0 ? template.pricing_tiers as typeof defaultPricingTiers : defaultPricingTiers;

    return (
      <TemplateAccentProvider accentColor={template.accent_color} className="min-h-screen bg-white">
        {/* Sidebar */}
        {!isPreviewOnly && (
          <EditorSidebar
            templateName={template.name}
            hasChanges={hasChanges}
            isSaving={saving}
            onSave={handleSave}
            onCancel={handleCancel}
            onPreview={handlePreview}
            onInsertToken={handleInsertToken}
            accentColor={template.accent_color}
            onAccentColorChange={(color) => updateField("accent_color", color)}
            sectionToggles={[
              { key: "show_trust", label: "Trust Logos" },
              { key: "show_features", label: "Features Section" },
              { key: "show_testimonials", label: "Testimonials" },
              { key: "show_pricing", label: "Pricing Tiers" },
              { key: "show_portfolio_cta", label: "Portfolio CTA" },
              { key: "show_form", label: "Contact Form" },
            ]}
            sectionVisibility={sectionVisibility}
            onSectionVisibilityChange={handleSectionVisibilityChange}
          />
        )}

        {/* Live campaign warning */}
        {!isPreviewOnly && activeCampaignCount > 0 && (
          <div className="lg:mr-80 bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p>
                <strong>Heads up:</strong> This template is used by the campaign{activeCampaignNames.length > 1 ? 's' : ''} <strong>{activeCampaignNames.join(', ')}</strong> with live Personalized Page links. Any changes you save could break those live links.
              </p>
              <p className="mt-1 text-amber-700">
                To edit safely, go back and clone this template first — then edit the clone instead.
              </p>
            </div>
          </div>
        )}

        {/* Main content - with right margin for sidebar */}
        <div className={isPreviewOnly ? "" : "lg:mr-80"}>
          {/* Hero Section */}
          <section className="pt-24 pb-16 bg-gradient-to-b from-amber-50/50 to-white">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto text-center">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-8">
                  <RichTextEditor
                    value={template.hero_badge || "Kicker Video — B2B Video Production"}
                    onChange={(value) => updateField("hero_badge", value)}
                    fieldName="Hero Badge"
                    supportsPersonalization
                    isHeadline
                  />
                </div>

                {/* Headline */}
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                  <RichTextEditor
                    value={template.hero_headline}
                    onChange={(value) => updateField("hero_headline", value)}
                    fieldName="Hero Headline"
                    supportsPersonalization
                    isHeadline
                  />
                </h1>

                {/* Subheadline */}
                <div className="text-lg md:text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
                  <RichTextEditor
                    value={template.hero_subheadline || "Built for marketing and product leaders who need a clear, on‑brand story."}
                    onChange={(value) => updateField("hero_subheadline", value)}
                    fieldName="Hero Subheadline"
                    supportsPersonalization
                  />
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                  <ButtonToggleWrapper configKey="show_hero_cta_primary" visible={isSectionVisible("show_hero_cta_primary")} onToggle={handleSectionVisibilityChange}>
                    <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6">
                      <Play className="w-4 h-4 mr-2" />
                      <EditableText
                        value={template.hero_cta_primary_text || "Book a 15‑min strategy call"}
                        onChange={(value) => updateField("hero_cta_primary_text", value)}
                        fieldName="Primary CTA"
                      />
                    </Button>
                  </ButtonToggleWrapper>
                  <ButtonToggleWrapper configKey="show_hero_cta_secondary" visible={isSectionVisible("show_hero_cta_secondary")} onToggle={handleSectionVisibilityChange}>
                    <Button variant="outline" size="lg" className="border-primary/30 text-foreground hover:bg-primary/10 hover:text-foreground">
                      <DollarSign className="w-4 h-4 mr-2" />
                      <EditableText
                        value={template.hero_cta_secondary_text || "Get pricing"}
                        onChange={(value) => updateField("hero_cta_secondary_text", value)}
                        fieldName="Secondary CTA"
                      />
                    </Button>
                  </ButtonToggleWrapper>
                </div>

                {/* Video Player */}
                <div className="max-w-3xl mx-auto rounded-xl overflow-hidden shadow-2xl">
                  <EditableVideo
                    videoId={template.hero_video_id || "76979871"}
                    thumbnailUrl={template.hero_video_thumbnail_url || undefined}
                    onVideoChange={(videoId) => updateField("hero_video_id", videoId)}
                    onThumbnailChange={(url) => updateField("hero_video_thumbnail_url", url)}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Trust Logos */}
          {isSectionVisible("show_trust") && (
          <section className="py-12 bg-white border-y border-gray-100">
            <div className="container mx-auto px-4 text-center">
              <div className="text-gray-500 text-sm font-medium mb-6">
                <RichTextEditor
                  value={template.about_content || "Trusted by B2B teams across the US & Canada"}
                  onChange={(value) => updateField("about_content", value)}
                  fieldName="Trust Section Text"
                  supportsPersonalization
                />
              </div>
              <div className="flex justify-center">
                <EditableImage
                  src={template.client_logos_url || clientLogos}
                  alt="Client logos"
                  onImageChange={(url) => updateField("client_logos_url", url)}
                  fieldName="Client Logos"
                  className="max-w-2xl opacity-60"
                  templateId={template.id}
                />
              </div>
            </div>
          </section>
          )}

          {/* Features Section */}
          {isSectionVisible("show_features") && (
          <section className="py-20 bg-white">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 text-center">
                  <RichTextEditor
                    value={template.features_title || "Clarity, speed, and on‑brand delivery"}
                    onChange={(value) => updateField("features_title", value)}
                    fieldName="Features Title"
                    supportsPersonalization
                    isHeadline
                  />
                </h2>
                <div className="text-lg text-gray-600 text-center mb-12 max-w-2xl mx-auto">
                  <RichTextEditor
                    value={template.features_subtitle || "We blend senior creative teams with AI‑assisted tooling to cut timelines and keep costs predictable."}
                    onChange={(value) => updateField("features_subtitle", value)}
                    fieldName="Features Subtitle"
                    supportsPersonalization
                  />
                </div>

                {/* Check List */}
                <div className="space-y-4 mb-12">
                  {featureList.map((item: any, index: number) => (
                    <div key={index} className="flex items-start gap-3">
                      <Check className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <span className="font-semibold text-gray-700">
                          <EditableText
                            value={item.title}
                            onChange={(value) => {
                              const newList = [...featureList];
                              newList[index] = { ...newList[index], title: value };
                              updateField("features_list", newList);
                            }}
                            fieldName={`Feature ${index + 1} Title`}
                          />
                        </span>
                        <span className="text-gray-700 ml-1">
                          <EditableText
                            value={item.description}
                            onChange={(value) => {
                              const newList = [...featureList];
                              newList[index] = { ...newList[index], description: value };
                              updateField("features_list", newList);
                            }}
                            fieldName={`Feature ${index + 1} Description`}
                          />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Feature Cards */}
                <div className="grid md:grid-cols-2 gap-6">
                  {featureCards.map((card: any, index: number) => (
                    <div key={index} className="border border-gray-200 bg-gray-50/50 rounded-lg p-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        <EditableText
                          value={card.title}
                          onChange={(value) => {
                            const newCards = [...featureCards];
                            newCards[index] = { ...newCards[index], title: value };
                            updateField("feature_cards", newCards);
                          }}
                          fieldName={`Card ${index + 1} Title`}
                        />
                      </h3>
                      <div className="text-gray-600">
                        <RichTextEditor
                          value={card.description}
                          onChange={(value) => {
                            const newCards = [...featureCards];
                            newCards[index] = { ...newCards[index], description: value };
                            updateField("feature_cards", newCards);
                          }}
                          fieldName={`Card ${index + 1} Description`}
                          supportsPersonalization
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
          )}

          {/* Testimonials Section */}
          {isSectionVisible("show_testimonials") && (
          <section className="py-20 bg-gray-50">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 text-center">
                  <RichTextEditor
                    value={template.testimonials_title || "What B2B teams say"}
                    onChange={(value) => updateField("testimonials_title", value)}
                    fieldName="Testimonials Title"
                    supportsPersonalization
                    isHeadline
                  />
                </h2>
                <div className="text-lg text-gray-600 text-center mb-12">
                  <RichTextEditor
                    value={template.testimonials_subtitle || "Marketing, product, and comms leaders across tech, healthcare, energy, and manufacturing."}
                    onChange={(value) => updateField("testimonials_subtitle", value)}
                    fieldName="Testimonials Subtitle"
                    supportsPersonalization
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  {testimonials.map((testimonial: any, index: number) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="text-primary/30 text-3xl mb-4">❝</div>
                      <blockquote className="text-gray-700 mb-4">
                        <RichTextEditor
                          value={testimonial.quote}
                          onChange={(value) => {
                            const newTestimonials = [...testimonials];
                            newTestimonials[index] = { ...newTestimonials[index], quote: value };
                            updateField("testimonials", newTestimonials);
                          }}
                          fieldName={`Testimonial ${index + 1} Quote`}
                          supportsPersonalization
                        />
                      </blockquote>
                      <p className="text-sm text-gray-500 font-medium">
                        <EditableText
                          value={testimonial.author}
                          onChange={(value) => {
                            const newTestimonials = [...testimonials];
                            newTestimonials[index] = { ...newTestimonials[index], author: value };
                            updateField("testimonials", newTestimonials);
                          }}
                          fieldName={`Testimonial ${index + 1} Author`}
                        />
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
          )}

          {/* Pricing Section */}
          {isSectionVisible("show_pricing") && (
          <section className="py-20 bg-white">
            <div className="container mx-auto px-4">
              <div className="max-w-5xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 text-center">
                  <RichTextEditor
                    value={template.pricing_title || "Project‑based pricing"}
                    onChange={(value) => updateField("pricing_title", value)}
                    fieldName="Pricing Title"
                    supportsPersonalization
                    isHeadline
                  />
                </h2>
                <div className="text-lg text-gray-600 text-center mb-12">
                  <RichTextEditor
                    value={template.pricing_subtitle || "Every project is scoped to your needs. Typical ranges shown below."}
                    onChange={(value) => updateField("pricing_subtitle", value)}
                    fieldName="Pricing Subtitle"
                    supportsPersonalization
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  {pricingTiers.map((tier: any, index: number) => (
                    <div 
                      key={index} 
                      className={`border rounded-lg p-6 ${tier.featured ? 'border-primary/30 bg-primary/5 ring-2 ring-primary/20' : 'border-gray-200 bg-white'}`}
                    >
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        <EditableText
                          value={tier.name}
                          onChange={(value) => {
                            const newTiers = [...pricingTiers];
                            newTiers[index] = { ...newTiers[index], name: value };
                            updateField("pricing_tiers", newTiers);
                          }}
                          fieldName={`Tier ${index + 1} Name`}
                        />
                      </h3>
                      <p className="text-sm text-gray-500 mb-4">
                        <EditableText
                          value={tier.description}
                          onChange={(value) => {
                            const newTiers = [...pricingTiers];
                            newTiers[index] = { ...newTiers[index], description: value };
                            updateField("pricing_tiers", newTiers);
                          }}
                          fieldName={`Tier ${index + 1} Description`}
                        />
                      </p>
                      <p className="text-3xl font-bold text-gray-900 mb-4">
                        <EditableText
                          value={tier.price}
                          onChange={(value) => {
                            const newTiers = [...pricingTiers];
                            newTiers[index] = { ...newTiers[index], price: value };
                            updateField("pricing_tiers", newTiers);
                          }}
                          fieldName={`Tier ${index + 1} Price`}
                        />
                      </p>
                      <ul className="space-y-2 mb-6">
                        {(tier.features || []).map((feature: string, fIndex: number) => (
                          <li key={fIndex} className="flex items-center gap-2 text-gray-600 text-sm">
                            <Check className="w-4 h-4 text-primary" />
                            <EditableText
                              value={feature}
                              onChange={(value) => {
                                const newTiers = [...pricingTiers];
                                const newFeatures = [...(newTiers[index].features || [])];
                                newFeatures[fIndex] = value;
                                newTiers[index] = { ...newTiers[index], features: newFeatures };
                                updateField("pricing_tiers", newTiers);
                              }}
                              fieldName={`Tier ${index + 1} Feature ${fIndex + 1}`}
                            />
                          </li>
                        ))}
                      </ul>
                      <Button 
                        variant={tier.featured ? "default" : "outline"} 
                        className={`w-full ${tier.featured ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : 'border-gray-300 hover:bg-primary/10 hover:text-foreground'}`}
                      >
                        <EditableText
                          value={tier.cta}
                          onChange={(value) => {
                            const newTiers = [...pricingTiers];
                            newTiers[index] = { ...newTiers[index], cta: value };
                            updateField("pricing_tiers", newTiers);
                          }}
                          fieldName={`Tier ${index + 1} CTA`}
                        />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
          )}

          {/* Work/Portfolio CTA Section */}
          {isSectionVisible("show_portfolio_cta") && (
          <section className="py-16 bg-gray-50 border-y border-gray-200">
            <div className="container mx-auto px-4">
              <div className="max-w-3xl mx-auto text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  <RichTextEditor
                    value={template.cta_banner_title || "Want to see more examples?"}
                    onChange={(value) => updateField("cta_banner_title", value)}
                    fieldName="Portfolio CTA Title"
                    supportsPersonalization
                    isHeadline
                  />
                </h3>
                <div className="text-gray-600 mb-8">
                  <RichTextEditor
                    value={template.cta_banner_subtitle || "Explore explainer, brand, trade show, and testimonial work across tech, healthcare, energy, and manufacturing."}
                    onChange={(value) => updateField("cta_banner_subtitle", value)}
                    fieldName="Portfolio CTA Subtitle"
                    supportsPersonalization
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <ButtonToggleWrapper configKey="show_portfolio_cta_primary" visible={isSectionVisible("show_portfolio_cta_primary")} onToggle={handleSectionVisibilityChange}>
                    <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                      <Mail className="w-4 h-4 mr-2" />
                      <EditableText
                        value={template.hero_cta_primary_text || "Request a curated reel"}
                        onChange={(value) => updateField("hero_cta_primary_text", value)}
                        fieldName="Portfolio CTA Primary"
                      />
                    </Button>
                  </ButtonToggleWrapper>
                  <ButtonToggleWrapper configKey="show_portfolio_cta_secondary" visible={isSectionVisible("show_portfolio_cta_secondary")} onToggle={handleSectionVisibilityChange}>
                    <Button variant="outline" size="lg" className="border-primary/30 text-foreground hover:bg-primary/10 hover:text-foreground">
                      <EditableText
                        value={template.hero_cta_secondary_text || "Get a sample brief"}
                        onChange={(value) => updateField("hero_cta_secondary_text", value)}
                        fieldName="Portfolio CTA Secondary"
                      />
                    </Button>
                  </ButtonToggleWrapper>
                </div>
              </div>
            </div>
          </section>
          )}

          {/* Contact Section with Sample Request Form */}
          {isSectionVisible("show_form") && (
          <EditableSampleRequestForm
            formTitle={template.form_section_title || "Request a Sample Video"}
            formSubtitle={template.form_section_subtitle || "See what Kicker can do with your content. We'll generate a sample video from your existing page—no creative brief required."}
            onTitleChange={(value) => updateField("form_section_title", value)}
            onSubtitleChange={(value) => updateField("form_section_subtitle", value)}
            formSteps={template.form_steps}
            onStepsChange={(steps) => updateField("form_steps", steps)}
          />
          )}

          {/* Footer */}
          <footer className="py-6 bg-gray-100 border-t border-gray-200">
            <div className="container mx-auto px-4 text-center">
              <p className="text-sm text-gray-500">
                © {new Date().getFullYear()} Kicker Video. All rights reserved.
              </p>
            </div>
          </footer>
        </div>
      </TemplateAccentProvider>
    );
  }

  // Default template (Police Recruitment) - Full page with all sections
  return (
    <TemplateAccentProvider accentColor={template.accent_color} className="min-h-screen bg-background">
      {/* Sidebar */}
      {!isPreviewOnly && (
        <EditorSidebar
          templateName={template.name}
          hasChanges={hasChanges}
          isSaving={saving}
          onSave={handleSave}
          onCancel={handleCancel}
          onPreview={handlePreview}
          onInsertToken={handleInsertToken}
          accentColor={template.accent_color}
          onAccentColorChange={(color) => updateField("accent_color", color)}
          sectionToggles={[
            { key: "show_trust", label: "Trust Logos" },
            { key: "show_about", label: "About Section" },
            { key: "show_portfolio_strip", label: "Portfolio Strip" },
            { key: "show_contact", label: "CTA / Contact" },
          ]}
          sectionVisibility={sectionVisibility}
          onSectionVisibilityChange={handleSectionVisibilityChange}
        />
      )}

        {/* Live campaign warning */}
        {!isPreviewOnly && activeCampaignCount > 0 && (
          <div className="lg:mr-80 bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p>
                <strong>Heads up:</strong> This template is used by the campaign{activeCampaignNames.length > 1 ? 's' : ''} <strong>{activeCampaignNames.join(', ')}</strong> with live Personalized Page links. Any changes you save could break those live links.
              </p>
              <p className="mt-1 text-amber-700">
                To edit safely, go back and clone this template first — then edit the clone instead.
              </p>
            </div>
          </div>
        )}

        {/* Main content - with right margin for sidebar */}
        <div className={isPreviewOnly ? "" : "lg:mr-80"}>
        {/* Hero Section */}
        <section className={`${isPreviewOnly ? "min-h-0" : "min-h-screen"} hero-gradient relative overflow-hidden`}>
          {/* Subtle background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div 
              className="absolute inset-0" 
              style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, hsl(252 64% 60%) 1px, transparent 0)`,
                backgroundSize: '40px 40px'
              }}
            />
          </div>

          <div className="container mx-auto px-4 py-12 lg:py-20 relative z-10">
            {/* Header */}
            <header className="flex items-center justify-between mb-12 lg:mb-16">
              <div className="relative group">
                {template.logo_url ? (
                  <div className="flex items-center gap-2">
                    <img src={template.logo_url} alt="Logo" className="h-8 md:h-10 object-contain" />
                    <button onClick={handleRemoveLogo} className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive" title="Remove logo"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors text-sm text-muted-foreground">
                    <Upload className="w-4 h-4" />
                    {uploadingLogo ? "Uploading..." : "Upload Logo (optional)"}
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploadingLogo} />
                  </label>
                )}
              </div>
              <ButtonToggleWrapper configKey="show_header_cta" visible={isSectionVisible("show_header_cta")} onToggle={handleSectionVisibilityChange}>
                <Button variant="outline" size="lg">
                  <EditableText
                    value={template.hero_cta_primary_text || "Get in Touch"}
                    onChange={(value) => updateField("hero_cta_primary_text", value)}
                    fieldName="Header CTA"
                  />
                </Button>
              </ButtonToggleWrapper>
            </header>

            {/* Main Content */}
            <div className="max-w-5xl mx-auto text-center mb-12 lg:mb-16">
              <div className="text-primary font-medium tracking-wider uppercase mb-4">
                <RichTextEditor
                  value={template.hero_badge || ""}
                  onChange={(value) => updateField("hero_badge", value)}
                  fieldName="Hero Badge"
                  supportsPersonalization
                  isHeadline
                />
              </div>
              
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                <RichTextEditor
                  value={template.hero_headline}
                  onChange={(value) => updateField("hero_headline", value)}
                  fieldName="Hero Headline"
                  supportsPersonalization
                  isHeadline
                />
              </h1>
              
              <div className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                <RichTextEditor
                  value={template.hero_subheadline || ""}
                  onChange={(value) => updateField("hero_subheadline", value)}
                  fieldName="Hero Subheadline"
                  supportsPersonalization
                />
              </div>
            </div>

            {/* Video Player */}
            <div className="max-w-4xl mx-auto">
              <EditableVideo
                videoId={template.hero_video_id || "1153753885"}
                thumbnailUrl={template.hero_video_thumbnail_url || undefined}
                onVideoChange={(videoId) => updateField("hero_video_id", videoId)}
                onThumbnailChange={(url) => updateField("hero_video_thumbnail_url", url)}
              />
            </div>

            {/* Scroll indicator */}
            <div className="flex justify-center mt-12 lg:mt-16">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <EditableText
                  value={template.hero_cta_secondary_text || "Learn More"}
                  onChange={(value) => updateField("hero_cta_secondary_text", value)}
                  fieldName="Scroll CTA"
                  className="text-sm uppercase tracking-wider"
                />
                <ArrowDown className="w-5 h-5 animate-bounce" />
              </div>
            </div>
          </div>
        </section>

        {/* Logo Carousel Section */}
        {isSectionVisible("show_trust") && (
        <section className="py-12 bg-secondary/30 border-y border-border/50">
          <div className="container mx-auto px-4">
            <p className="text-center text-sm text-muted-foreground uppercase tracking-wider mb-8">
              <EditableText
                value={template.cta_banner_subtitle || "Trusted by public organizations nationwide"}
                onChange={(value) => updateField("cta_banner_subtitle", value)}
                fieldName="Trust Section Text"
              />
            </p>
            
            <div className="flex justify-center">
              <EditableImage
                src={template.client_logos_url || clientLogos}
                alt="Client logos"
                onImageChange={(url) => updateField("client_logos_url", url)}
                fieldName="Client Logos"
                className="max-w-full"
              />
            </div>
          </div>
        </section>
        )}

        {/* About Section */}
        {isSectionVisible("show_about") && (
        <section id="about" className="py-20 lg:py-32 bg-card relative">
          {/* Accent line */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-1 bg-primary rounded-full" />

          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
                <RichTextEditor
                  value={template.features_title || "Why Departments Choose Kicker Video"}
                  onChange={(value) => updateField("features_title", value)}
                  fieldName="About Section Title"
                  supportsPersonalization
                  isHeadline
                />
              </h2>
            </div>

            <div className="max-w-3xl mx-auto">
              <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
                <RichTextEditor
                  value={template.about_content || DEFAULT_ABOUT_CONTENT}
                  onChange={(value) => updateField("about_content", value)}
                  fieldName="About Section Body"
                  supportsPersonalization
                />
              </div>
            </div>
          </div>
        </section>
        )}

        {/* Portfolio Strip */}
        {isSectionVisible("show_portfolio_strip") && (
        <section className="bg-background">
          <div className="w-full">
            <EditableImage
              src={template.portfolio_strip_url || portfolioStrip}
              alt="Portfolio examples"
              onImageChange={(url) => updateField("portfolio_strip_url", url)}
              fieldName="Portfolio Strip"
            />
          </div>
        </section>
        )}

        {/* CTA Section */}
        {isSectionVisible("show_contact") && (
        <section id="contact" className="py-20 lg:py-32 hero-gradient relative overflow-hidden">
          {/* Background accent */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
                <RichTextEditor
                  value={template.contact_title || "Ready to Transform Your Recruitment Strategy?"}
                  onChange={(value) => updateField("contact_title", value)}
                  fieldName="Contact Title"
                  supportsPersonalization
                  isHeadline
                />
              </h2>
              <div className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
                <RichTextEditor
                  value={template.contact_subtitle || "Let's discuss how Kicker Video can help your department attract the next generation of law enforcement professionals."}
                  onChange={(value) => updateField("contact_subtitle", value)}
                  fieldName="Contact Subtitle"
                  supportsPersonalization
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <ButtonToggleWrapper configKey="show_contact_cta_primary" visible={isSectionVisible("show_contact_cta_primary")} onToggle={handleSectionVisibilityChange}>
                  <Button variant="hero" size="xl" asChild>
                    <a href="mailto:hello@kickervideo.com">
                      <Mail className="w-5 h-5" />
                      Contact Us
                    </a>
                  </Button>
                </ButtonToggleWrapper>
                <ButtonToggleWrapper configKey="show_contact_cta_secondary" visible={isSectionVisible("show_contact_cta_secondary")} onToggle={handleSectionVisibilityChange}>
                  <Button variant="heroOutline" size="xl" asChild>
                    <a href="https://kickervideo.com" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-5 h-5" />
                      Visit Website
                    </a>
                  </Button>
                </ButtonToggleWrapper>
              </div>

              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center text-muted-foreground">
                <a 
                  href="mailto:hello@kickervideo.com" 
                  className="flex items-center gap-2 hover:text-primary transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  <EditableText
                    value={template.contact_email || "hello@kickervideo.com"}
                    onChange={(value) => updateField("contact_email", value)}
                    fieldName="Contact Email"
                  />
                </a>
                <span className="hidden sm:block text-border">|</span>
                <a 
                  href="https://kickervideo.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-primary transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  kickervideo.com
                </a>
              </div>
            </div>
          </div>
        </section>
        )}

        {/* Footer */}
        <footer className="py-8 bg-background border-t border-border">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              {template.logo_url ? (
                <img src={template.logo_url} alt="Logo" className="h-6 object-contain" />
              ) : null}

              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} Kicker Video. Professional video production.
              </p>

              <a 
                href="https://kickervideo.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                kickervideo.com
              </a>
            </div>
          </div>
        </footer>
      </div>
    </TemplateAccentProvider>
  );
};

export default TemplateEditor;
