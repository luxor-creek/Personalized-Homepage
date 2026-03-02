import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BuilderSection, SECTION_DEFAULTS, SectionType } from "@/types/builder";
import SectionPalette from "@/components/builder/SectionPalette";
import SectionProperties from "@/components/builder/SectionProperties";
import BuilderCanvas from "@/components/builder/BuilderCanvas";
import AIPageGenerator from "@/components/builder/AIPageGenerator";
import BuilderChecklist from "@/components/builder/BuilderChecklist";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, Pencil, Plus, Settings2, Eye } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import html2canvas from "html2canvas";

const BuilderPage = () => {
  const navigate = useNavigate();
  const { slug } = useParams();
  const { toast } = useToast();

  const [templateId, setTemplateId] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState("Untitled Page");
  const [templateSlug, setTemplateSlug] = useState("");
  const [sections, setSections] = useState<BuilderSection[]>([]);
  const [manualModeActive, setManualModeActive] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!slug);
  const [editingName, setEditingName] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [hasPreviewedOnce, setHasPreviewedOnce] = useState(false);
  const [hasPublished, setHasPublished] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        navigate("/auth");
        return;
      }
      setUserId(user.id);
    });
  }, [navigate]);

  // Load existing template if editing
  useEffect(() => {
    if (!slug) return;
    const load = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("landing_page_templates")
          .select("id, name, slug, sections")
          .eq("slug", slug)
          .single();
        if (error) throw error;
        setTemplateId(data.id);
        setTemplateName(data.name);
        setTemplateSlug(data.slug);
        setSections(Array.isArray(data.sections) ? (data.sections as unknown as BuilderSection[]) : []);
      } catch (err: any) {
        toast({ title: "Error loading template", description: err.message, variant: "destructive" });
        navigate("/workspace");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug, navigate, toast]);

  const generateId = () => Math.random().toString(36).substring(2, 10);

  const addSection = useCallback((type: SectionType) => {
    const defaults = SECTION_DEFAULTS[type];
    const newSection: BuilderSection = {
      id: generateId(),
      type,
      content: { ...defaults.content },
      style: { ...defaults.style },
    };
    setSections((prev) => [...prev, newSection]);
    setSelectedSectionId(newSection.id);
  }, []);

  const updateSection = useCallback((updated: BuilderSection) => {
    setSections((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  }, []);

  const moveSection = useCallback((id: string, direction: 'up' | 'down') => {
    setSections((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx < 0) return prev;
      const newIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]];
      return copy;
    });
  }, []);

  const deleteSection = useCallback((id: string) => {
    setSections((prev) => prev.filter((s) => s.id !== id));
    if (selectedSectionId === id) setSelectedSectionId(null);
  }, [selectedSectionId]);

  const duplicateSection = useCallback((id: string) => {
    setSections((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx < 0) return prev;
      const clone: BuilderSection = {
        ...JSON.parse(JSON.stringify(prev[idx])),
        id: generateId(),
      };
      const copy = [...prev];
      copy.splice(idx + 1, 0, clone);
      return copy;
    });
  }, []);

  const captureThumbnail = async (id: string) => {
    const el = canvasRef.current;
    if (!el) return;
    try {
      const canvas = await html2canvas(el, {
        scale: 0.5,
        useCORS: true,
        logging: false,
        height: Math.min(el.scrollHeight, 900),
        windowHeight: 900,
      });
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const path = `${id}/thumbnail.webp`;
        const { error: uploadErr } = await supabase.storage
          .from("template-images")
          .upload(path, blob, { contentType: "image/webp", upsert: true });
        if (uploadErr) { console.error("Thumbnail upload error:", uploadErr); return; }
        const { data: urlData } = supabase.storage
          .from("template-images")
          .getPublicUrl(path);
        if (urlData?.publicUrl) {
          await supabase
            .from("landing_page_templates")
            .update({ thumbnail_url: `${urlData.publicUrl}?v=${Date.now()}` } as any)
            .eq("id", id);
        }
      }, "image/webp", 0.8);
    } catch (err) {
      console.error("Thumbnail capture error:", err);
    }
  };

  const saveTemplate = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      if (templateId) {
        // Update existing
        const { error } = await supabase
          .from("landing_page_templates")
          .update({
            name: templateName,
            sections: sections as any,
            is_builder_template: true,
          } as any)
          .eq("id", templateId);
        if (error) throw error;
        // Capture thumbnail in background
        captureThumbnail(templateId);
      } else {
        // Create new
        const newSlug = templateName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);
        const { data, error } = await supabase
          .from("landing_page_templates")
          .insert({
            name: templateName,
            slug: newSlug,
            hero_headline: templateName,
            sections: sections as any,
            is_builder_template: true,
            user_id: userId,
          } as any)
          .select("id, slug")
          .single();
        if (error) throw error;
        setTemplateId(data.id);
        setTemplateSlug(data.slug);
        // Update URL without reload
        window.history.replaceState(null, '', `/builder/${data.slug}`);
        // Capture thumbnail in background
        captureThumbnail(data.id);
      }
      toast({ title: "Saved!" });
      setHasPublished(true);
    } catch (err: any) {
      toast({ title: "Error saving", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const selectedSection = sections.find((s) => s.id === selectedSectionId) || null;
  const isMobile = useIsMobile();
  const [paletteOpen, setPaletteOpen] = useState(false);

  // On mobile, auto-open properties sheet when a section is selected
  const handleSelectSection = useCallback((id: string) => {
    setSelectedSectionId(id);
  }, []);

  const handleAddSectionMobile = useCallback((type: SectionType) => {
    addSection(type);
    setPaletteOpen(false);
  }, [addSection]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top toolbar */}
      <header className="h-14 border-b border-border bg-card flex items-center justify-between px-2 sm:px-4 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Button variant="ghost" size="sm" onClick={() => navigate("/workspace")} className="shrink-0">
            <ArrowLeft className="w-4 h-4 sm:mr-1" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <div className="h-6 w-px bg-border hidden sm:block" />
          {editingName ? (
            <Input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              onBlur={() => setEditingName(false)}
              onKeyDown={(e) => e.key === 'Enter' && setEditingName(false)}
              className="h-8 w-40 sm:w-64 text-sm"
              autoFocus
            />
          ) : (
            <button
              className="flex items-center gap-1 sm:gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors truncate"
              onClick={() => setEditingName(true)}
            >
              <span className="truncate max-w-[120px] sm:max-w-none">{templateName}</span>
              <Pencil className="w-3 h-3 text-muted-foreground shrink-0" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <span className="text-xs text-muted-foreground mr-1 hidden sm:inline">{sections.length} sections</span>
          {isMobile && (
            <Button variant="outline" size="sm" onClick={() => setPaletteOpen(true)}>
              <Plus className="w-4 h-4" />
            </Button>
          )}
          {templateSlug && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setHasPreviewedOnce(true);
                window.open(`/builder-preview/${templateSlug}`, "_blank");
              }}
            >
              <Eye className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">Preview</span>
            </Button>
          )}
          <Button size="sm" onClick={saveTemplate} disabled={saving}>
            <Save className="w-4 h-4 sm:mr-1" />
            <span className="hidden sm:inline">{saving ? "Saving..." : "Save"}</span>
          </Button>
        </div>
      </header>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Section Palette - hidden on mobile and when chooser is shown */}
        {!isMobile && (manualModeActive || sections.length > 0) && <SectionPalette onAddSection={addSection} />}

        {/* Center: Canvas */}
        <BuilderCanvas
          ref={canvasRef}
          sections={sections}
          selectedSectionId={selectedSectionId}
          onSelectSection={handleSelectSection}
          onMoveSection={moveSection}
          onDeleteSection={deleteSection}
          onDuplicateSection={duplicateSection}
          onAIGenerate={(newSections) => {
            setSections(newSections);
            setSelectedSectionId(null);
          }}
          manualModeActive={manualModeActive}
          onStartManual={() => setManualModeActive(true)}
        />

        {/* Right: Properties Panel - inline on desktop, sheet on mobile */}
        {!isMobile && selectedSection && (
          <SectionProperties
            section={selectedSection}
            onUpdate={updateSection}
            onClose={() => setSelectedSectionId(null)}
          />
        )}

        {/* Right: Checklist panel for first-time users (only when no properties open) */}
        {!isMobile && !selectedSection && (
          <BuilderChecklist
            sections={sections}
            hasPreviewedOnce={hasPreviewedOnce}
            hasPublished={hasPublished}
            onFocusHeadline={() => {
              // Select first headline-like section
              const headlineSection = sections.find((s) =>
                ["headline", "hero", "heroBg", "heroVideo", "heroImage", "heroForm", "heroVideoBg"].includes(s.type)
              );
              if (headlineSection) setSelectedSectionId(headlineSection.id);
            }}
            onTriggerPreview={() => {
              if (templateSlug) {
                setHasPreviewedOnce(true);
                window.open(`/builder-preview/${templateSlug}`, "_blank");
              }
            }}
            onTriggerPublish={saveTemplate}
          />
        )}
      </div>

      {/* Mobile: Palette Sheet */}
      {isMobile && (
        <Sheet open={paletteOpen} onOpenChange={setPaletteOpen}>
          <SheetContent side="left" className="w-[280px] p-0">
            <SheetHeader className="p-4 border-b border-border">
              <SheetTitle>Add Sections</SheetTitle>
            </SheetHeader>
            <SectionPalette onAddSection={handleAddSectionMobile} />
          </SheetContent>
        </Sheet>
      )}

      {/* Mobile: Properties Sheet */}
      {isMobile && selectedSection && (
        <Sheet open={!!selectedSectionId} onOpenChange={(open) => { if (!open) setSelectedSectionId(null); }}>
          <SheetContent side="right" className="w-[320px] p-0">
            <SheetHeader className="p-4 border-b border-border">
              <SheetTitle>Section Properties</SheetTitle>
            </SheetHeader>
            <SectionProperties
              section={selectedSection}
              onUpdate={updateSection}
              onClose={() => setSelectedSectionId(null)}
            />
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
};

export default BuilderPage;
