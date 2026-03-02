import { BuilderSection, FONT_SIZES, FONT_WEIGHTS, TEXT_ALIGNS, PADDING_OPTIONS, SectionContent, SectionStyle, SectionType, SECTION_DEFAULTS, FeatureItem, TestimonialItem, PricingTier, FaqItem, StatItem, TeamMember, ComparisonRow, StepItem, FooterColumn, SocialProofItem, CardItem } from "@/types/builder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Bold, Italic, AlignLeft, AlignCenter, AlignRight, Plus, Trash2, Upload } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef } from "react";
import VariableInsert from "./VariableInsert";
import AICopywriterButton from "./AICopywriterButton";
import { compressImage } from "@/lib/compressImage";

// Track the last focused input/textarea and cursor position
let lastFocusedInput: HTMLInputElement | HTMLTextAreaElement | null = null;
let lastCursorPos: number | null = null;

const insertAtCursor = (value: string, token: string): string => {
  if (lastFocusedInput && lastCursorPos !== null) {
    const pos = lastCursorPos;
    return value.slice(0, pos) + token + value.slice(pos);
  }
  return value + token;
};

interface SectionPropertiesProps {
  section: BuilderSection;
  onUpdate: (section: BuilderSection) => void;
  onClose: () => void;
}

const SectionProperties = ({ section, onUpdate, onClose }: SectionPropertiesProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const updateContent = (updates: Partial<SectionContent>) => {
    onUpdate({ ...section, content: { ...section.content, ...updates } });
  };

  const updateStyle = (updates: Partial<SectionStyle>) => {
    onUpdate({ ...section, style: { ...section.style, ...updates } });
  };

  const uploadCompressedImage = async (file: File): Promise<string> => {
    if (!file.type.startsWith('image/')) {
      throw new Error("Only image files are supported");
    }
    const { blob, ext } = await compressImage(file);
    const path = `builder/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('template-logos').upload(path, blob, { contentType: `image/${ext}` });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('template-logos').getPublicUrl(path);
    return publicUrl;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const publicUrl = await uploadCompressedImage(file);
      updateContent({ [field]: publicUrl });
      toast({ title: "Uploaded!" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: "Only images can be uploaded", description: "For documents and videos, paste a shared link instead.", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const publicUrl = await uploadCompressedImage(file);
      updateContent({ [field]: publicUrl });
      toast({ title: "Uploaded!" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const UploadButton = ({ label, field }: { label: string; field: string }) => (
    <div className="relative">
      <Button variant="outline" size="sm" className="w-full" disabled={uploading}>
        <Upload className="w-4 h-4 mr-2" />
        {uploading ? "Uploading..." : label}
      </Button>
      <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleImageUpload(e, field)} />
    </div>
  );

  // Helper: Label with variable insert button — inserts at cursor position
  const VarLabel = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
    <div className="flex items-center justify-between">
      <Label className="text-xs">{label}</Label>
      <VariableInsert onInsert={(token) => onChange(insertAtCursor(value, token))} />
    </div>
  );


  const renderArrayEditor = <T extends Record<string, any>>(
    items: T[],
    updateKey: string,
    fields: { key: keyof T; label: string; type?: 'text' | 'textarea' }[],
    defaultItem: T
  ) => (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="border rounded-lg p-3 space-y-2 relative">
          <Button variant="ghost" size="sm" className="absolute top-1 right-1 h-6 w-6 p-0" onClick={() => {
            const updated = items.filter((_, idx) => idx !== i);
            updateContent({ [updateKey]: updated });
          }}>
            <Trash2 className="w-3 h-3" />
          </Button>
          {fields.map(({ key, label, type }) => (
            <div key={String(key)} className="space-y-1">
              <Label className="text-xs">{label}</Label>
              {type === 'textarea' ? (
                <Textarea value={String(item[key] || '')} onChange={(e) => {
                  const updated = [...items];
                  updated[i] = { ...updated[i], [key]: e.target.value };
                  updateContent({ [updateKey]: updated });
                }} rows={2} className="resize-none text-xs" />
              ) : (
                <Input value={String(item[key] || '')} onChange={(e) => {
                  const updated = [...items];
                  updated[i] = { ...updated[i], [key]: e.target.value };
                  updateContent({ [updateKey]: updated });
                }} className="text-xs" />
              )}
            </div>
          ))}
        </div>
      ))}
      <Button variant="outline" size="sm" className="w-full" onClick={() => updateContent({ [updateKey]: [...items, defaultItem] })}>
        <Plus className="w-3 h-3 mr-2" /> Add Item
      </Button>
    </div>
  );

  const renderContentFields = () => {
    switch (section.type) {
      case 'headline':
      case 'body':
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <VarLabel label="Text" value={section.content.text || ''} onChange={(v) => updateContent({ text: v })} />
              <AICopywriterButton
                text={section.content.text || ''}
                sectionType={section.type}
                onRewrite={(newText) => updateContent({ text: newText })}
              />
            </div>
            <Textarea value={section.content.text || ''} onChange={(e) => updateContent({ text: e.target.value })} rows={section.type === 'body' ? 6 : 2} className="resize-none" />
            <div className="space-y-1">
              <Label className="text-xs">Text Size</Label>
              <Select value={section.style.fontSize || (section.type === 'headline' ? '48px' : '18px')} onValueChange={(v) => updateStyle({ fontSize: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{FONT_SIZES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'video':
        return (
          <div className="space-y-2">
            <Label>Video URL</Label>
            <Input value={section.content.videoUrl || ''} onChange={(e) => updateContent({ videoUrl: e.target.value })} placeholder="YouTube, Vimeo, or direct video URL" />
            <p className="text-xs text-muted-foreground">Supports YouTube, Vimeo, or any direct video link</p>
          </div>
        );

      case 'image':
        return (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Layout</Label>
              <Select value={section.content.imageLayout || 'single'} onValueChange={(v) => updateContent({ imageLayout: v as 'single' | 'row' })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single Image</SelectItem>
                  <SelectItem value="row">Row of Images</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(section.content.imageLayout || 'single') === 'single' ? (
              <>
                <Label>Image</Label>
                <Input value={section.content.imageUrl || ''} onChange={(e) => updateContent({ imageUrl: e.target.value })} placeholder="Paste image URL" />
                <UploadButton label="Upload Image" field="imageUrl" />
              </>
            ) : (
              <>
                <Label>Images ({(section.content.imageUrls || []).length})</Label>
                {(section.content.imageUrls || []).map((url, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex gap-2">
                      <Input value={url} onChange={(e) => { const urls = [...(section.content.imageUrls || [])]; urls[i] = e.target.value; updateContent({ imageUrls: urls }); }} placeholder="Image URL" className="flex-1" />
                      <Button variant="ghost" size="sm" onClick={() => updateContent({ imageUrls: (section.content.imageUrls || []).filter((_, idx) => idx !== i) })}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                    <div className="relative">
                      <Button variant="outline" size="sm" className="w-full" disabled={uploading}>
                        <Upload className="w-4 h-4 mr-2" />
                        {uploading ? "Uploading..." : "Upload"}
                      </Button>
                      <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={async (ev) => {
                        const file = ev.target.files?.[0];
                        if (!file) return;
                        setUploading(true);
                        try {
                          const publicUrl = await uploadCompressedImage(file);
                          const urls = [...(section.content.imageUrls || [])];
                          urls[i] = publicUrl;
                          updateContent({ imageUrls: urls });
                          toast({ title: "Uploaded!" });
                        } catch (err: any) {
                          toast({ title: "Upload failed", description: err.message, variant: "destructive" });
                        } finally { setUploading(false); }
                      }} />
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full" onClick={() => updateContent({ imageUrls: [...(section.content.imageUrls || []), ''] })}><Plus className="w-3 h-3 mr-2" /> Add Image</Button>
              </>
            )}
          </div>
        );

      case 'banner':
        return (
          <>
            <div className="space-y-2"><VarLabel label="Headline" value={section.content.bannerText || ''} onChange={(v) => updateContent({ bannerText: v })} /><Input value={section.content.bannerText || ''} onChange={(e) => updateContent({ bannerText: e.target.value })} /></div>
            <div className="space-y-2"><VarLabel label="Subtext" value={section.content.bannerSubtext || ''} onChange={(v) => updateContent({ bannerSubtext: v })} /><Input value={section.content.bannerSubtext || ''} onChange={(e) => updateContent({ bannerSubtext: e.target.value })} /></div>
            <div className="space-y-2"><Label>Background Image</Label><Input value={section.content.imageUrl || ''} onChange={(e) => updateContent({ imageUrl: e.target.value })} placeholder="Paste image URL" /><UploadButton label="Upload Background" field="imageUrl" /></div>
            <div className="space-y-2">
              <Label>Overlay Opacity</Label>
              <input type="range" min="0" max="100" value={(section.style.overlayOpacity || 0) * 100} onChange={(e) => updateStyle({ overlayOpacity: parseInt(e.target.value) / 100 })} className="w-full" />
              <span className="text-xs text-muted-foreground">{Math.round((section.style.overlayOpacity || 0) * 100)}%</span>
            </div>
          </>
        );

      case 'cta':
        return (
          <>
            <div className="space-y-2"><VarLabel label="Heading" value={section.content.text || ''} onChange={(v) => updateContent({ text: v })} /><Input value={section.content.text || ''} onChange={(e) => updateContent({ text: e.target.value })} /></div>
            <Separator />
            <div className="flex items-center justify-between"><Label className="text-xs">Show Primary Button</Label><Switch checked={!section.content.hideButton} onCheckedChange={(v) => updateContent({ hideButton: !v })} /></div>
            {!section.content.hideButton && (
              <>
                <div className="space-y-2"><Label>Primary Button Text</Label><Input value={section.content.buttonText || ''} onChange={(e) => updateContent({ buttonText: e.target.value })} /></div>
                <div className="space-y-2"><Label>Primary Button Link</Label><Input value={section.content.buttonLink || ''} onChange={(e) => updateContent({ buttonLink: e.target.value })} placeholder="#section or https://..." /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1"><Label className="text-xs">Button Color</Label><input type="color" value={section.style.buttonColor || '#6d54df'} onChange={(e) => updateStyle({ buttonColor: e.target.value })} className="w-8 h-8 rounded border cursor-pointer" /></div>
                  <div className="space-y-1"><Label className="text-xs">Button Text</Label><input type="color" value={section.style.buttonTextColor || '#ffffff'} onChange={(e) => updateStyle({ buttonTextColor: e.target.value })} className="w-8 h-8 rounded border cursor-pointer" /></div>
                </div>
              </>
            )}
            <Separator />
            <div className="flex items-center justify-between"><Label className="text-xs">Show Secondary Button</Label><Switch checked={!section.content.hideSecondaryButton} onCheckedChange={(v) => updateContent({ hideSecondaryButton: !v })} /></div>
            {!section.content.hideSecondaryButton && (
              <>
                <div className="space-y-2"><Label>Secondary Button</Label><Input value={section.content.secondaryButtonText || ''} onChange={(e) => updateContent({ secondaryButtonText: e.target.value })} placeholder="Leave empty to hide" /></div>
                {section.content.secondaryButtonText && <div className="space-y-2"><Label>Secondary Link</Label><Input value={section.content.secondaryButtonLink || ''} onChange={(e) => updateContent({ secondaryButtonLink: e.target.value })} /></div>}
              </>
            )}
          </>
        );

      case 'form':
        return (
          <>
            <div className="space-y-2"><VarLabel label="Title" value={section.content.formTitle || ''} onChange={(v) => updateContent({ formTitle: v })} /><Input value={section.content.formTitle || ''} onChange={(e) => updateContent({ formTitle: e.target.value })} /></div>
            <div className="space-y-2"><VarLabel label="Subtitle" value={section.content.formSubtitle || ''} onChange={(v) => updateContent({ formSubtitle: v })} /><Input value={section.content.formSubtitle || ''} onChange={(e) => updateContent({ formSubtitle: e.target.value })} /></div>
            <div className="space-y-2"><Label>Button Text</Label><Input value={section.content.formButtonText || ''} onChange={(e) => updateContent({ formButtonText: e.target.value })} /></div>
            <Separator />
            <div className="space-y-2">
              <Label>Recipient Email</Label>
              <Input type="email" value={section.content.formRecipientEmail || ''} onChange={(e) => updateContent({ formRecipientEmail: e.target.value })} placeholder="your@email.com" />
              <p className="text-xs text-muted-foreground">Form submissions will be sent to this email</p>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Fields</Label>
              {(section.content.formFields || []).map((field, i) => (
                <div key={i} className="flex gap-2">
                  <Input value={field} onChange={(e) => { const f = [...(section.content.formFields || [])]; f[i] = e.target.value; updateContent({ formFields: f }); }} className="flex-1" />
                  <Button variant="ghost" size="sm" onClick={() => updateContent({ formFields: (section.content.formFields || []).filter((_, idx) => idx !== i) })}><Trash2 className="w-3 h-3" /></Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => updateContent({ formFields: [...(section.content.formFields || []), 'New Field'] })} className="w-full"><Plus className="w-3 h-3 mr-2" />Add Field</Button>
            </div>
          </>
        );

      case 'logo':
        return (
          <div className="space-y-3">
            <Label>Logo</Label>
            <Input value={section.content.logoUrl || ''} onChange={(e) => updateContent({ logoUrl: e.target.value })} placeholder="Paste logo URL" />
            <UploadButton label="Upload Logo" field="logoUrl" />
            <div className="space-y-2">
              <Label>Logo Height</Label>
              <Select value={section.style.height || '60px'} onValueChange={(v) => updateStyle({ height: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['32px', '40px', '48px', '60px', '80px', '100px'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'document':
        return (
          <div className="space-y-3">
            <div className="space-y-2"><VarLabel label="Title" value={section.content.documentTitle || ''} onChange={(v) => updateContent({ documentTitle: v })} /><Input value={section.content.documentTitle || ''} onChange={(e) => updateContent({ documentTitle: e.target.value })} /></div>
            <div className="space-y-2"><VarLabel label="Description" value={section.content.documentDescription || ''} onChange={(v) => updateContent({ documentDescription: v })} /><Textarea value={section.content.documentDescription || ''} onChange={(e) => updateContent({ documentDescription: e.target.value })} rows={3} className="resize-none" /></div>
            <div className="space-y-2">
              <Label>Shared Link</Label>
              <Input value={section.content.documentUrl || ''} onChange={(e) => updateContent({ documentUrl: e.target.value })} placeholder="Dropbox, Google Drive, Box, or OneDrive link" />
              <p className="text-xs text-muted-foreground">Paste a shared link from Dropbox, Google Drive, Box, or OneDrive</p>
            </div>
            <div className="flex items-center justify-between"><Label className="text-xs">Show Button</Label><Switch checked={!section.content.hideButton} onCheckedChange={(v) => updateContent({ hideButton: !v })} /></div>
            {!section.content.hideButton && (
              <>
                <div className="space-y-2"><Label>Button Text</Label><Input value={section.content.documentButtonText || ''} onChange={(e) => updateContent({ documentButtonText: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1"><Label className="text-xs">Btn Color</Label><input type="color" value={section.style.buttonColor || '#6d54df'} onChange={(e) => updateStyle({ buttonColor: e.target.value })} className="w-8 h-8 rounded border cursor-pointer" /></div>
                  <div className="space-y-1"><Label className="text-xs">Btn Text</Label><input type="color" value={section.style.buttonTextColor || '#ffffff'} onChange={(e) => updateStyle({ buttonTextColor: e.target.value })} className="w-8 h-8 rounded border cursor-pointer" /></div>
                </div>
              </>
            )}
          </div>
        );

      case 'spacer':
        return (
          <div className="space-y-2">
            <Label>Height</Label>
            <Select value={section.style.height || '48px'} onValueChange={(v) => updateStyle({ height: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{['16px', '24px', '32px', '48px', '64px', '80px', '96px', '128px'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        );

      // === NEW SECTIONS ===

      case 'hero':
        return (
          <>
            <div className="space-y-2"><VarLabel label="Badge" value={section.content.heroBadge || ''} onChange={(v) => updateContent({ heroBadge: v })} /><Input value={section.content.heroBadge || ''} onChange={(e) => updateContent({ heroBadge: e.target.value })} placeholder="e.g. New, Beta" /></div>
            <div className="space-y-2"><VarLabel label="Headline" value={section.content.text || ''} onChange={(v) => updateContent({ text: v })} /><Textarea value={section.content.text || ''} onChange={(e) => updateContent({ text: e.target.value })} rows={2} className="resize-none" /></div>
            <div className="space-y-2"><VarLabel label="Subheadline" value={section.content.heroSubheadline || ''} onChange={(v) => updateContent({ heroSubheadline: v })} /><Textarea value={section.content.heroSubheadline || ''} onChange={(e) => updateContent({ heroSubheadline: e.target.value })} rows={2} className="resize-none" /></div>
            <Separator />
            <div className="flex items-center justify-between"><Label className="text-xs">Show Primary Button</Label><Switch checked={!section.content.hideButton} onCheckedChange={(v) => updateContent({ hideButton: !v })} /></div>
            {!section.content.hideButton && (
              <>
                <div className="space-y-2"><Label>Primary Button</Label><Input value={section.content.buttonText || ''} onChange={(e) => updateContent({ buttonText: e.target.value })} /></div>
                <div className="space-y-2"><Label>Primary Link</Label><Input value={section.content.buttonLink || ''} onChange={(e) => updateContent({ buttonLink: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1"><Label className="text-xs">Btn Color</Label><input type="color" value={section.style.buttonColor || '#6d54df'} onChange={(e) => updateStyle({ buttonColor: e.target.value })} className="w-8 h-8 rounded border cursor-pointer" /></div>
                  <div className="space-y-1"><Label className="text-xs">Btn Text</Label><input type="color" value={section.style.buttonTextColor || '#ffffff'} onChange={(e) => updateStyle({ buttonTextColor: e.target.value })} className="w-8 h-8 rounded border cursor-pointer" /></div>
                </div>
              </>
            )}
            <div className="flex items-center justify-between"><Label className="text-xs">Show Secondary Button</Label><Switch checked={!section.content.hideSecondaryButton} onCheckedChange={(v) => updateContent({ hideSecondaryButton: !v })} /></div>
            {!section.content.hideSecondaryButton && (
              <>
                <div className="space-y-2"><Label>Secondary Button</Label><Input value={section.content.secondaryButtonText || ''} onChange={(e) => updateContent({ secondaryButtonText: e.target.value })} /></div>
                <div className="space-y-2"><Label>Secondary Link</Label><Input value={section.content.secondaryButtonLink || ''} onChange={(e) => updateContent({ secondaryButtonLink: e.target.value })} placeholder="#section or https://..." /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1"><Label className="text-xs">Sec Btn Color</Label><input type="color" value={section.style.secondaryButtonColor || '#ffffff'} onChange={(e) => updateStyle({ secondaryButtonColor: e.target.value })} className="w-8 h-8 rounded border cursor-pointer" /></div>
                  <div className="space-y-1"><Label className="text-xs">Sec Btn Text</Label><input type="color" value={section.style.secondaryButtonTextColor || '#000000'} onChange={(e) => updateStyle({ secondaryButtonTextColor: e.target.value })} className="w-8 h-8 rounded border cursor-pointer" /></div>
                </div>
              </>
            )}
            <Separator />
            <div className="space-y-2"><Label>Hero Image</Label><Input value={section.content.heroImageUrl || ''} onChange={(e) => updateContent({ heroImageUrl: e.target.value })} placeholder="Paste image URL" /><UploadButton label="Upload Image" field="heroImageUrl" /></div>
            <Separator />
            <div className="flex items-center justify-between"><Label className="text-xs">Parallax Effect</Label><Switch checked={!!section.content.parallax} onCheckedChange={(v) => updateContent({ parallax: v })} /></div>
            <p className="text-xs text-muted-foreground">Elements move at different speeds on scroll for a depth effect</p>
          </>
        );

      case 'heroBg':
        return (
          <>
            <div className="space-y-2"><VarLabel label="Badge" value={section.content.heroBadge || ''} onChange={(v) => updateContent({ heroBadge: v })} /><Input value={section.content.heroBadge || ''} onChange={(e) => updateContent({ heroBadge: e.target.value })} placeholder="e.g. New, Beta" /></div>
            <div className="space-y-2"><VarLabel label="Headline" value={section.content.text || ''} onChange={(v) => updateContent({ text: v })} /><Textarea value={section.content.text || ''} onChange={(e) => updateContent({ text: e.target.value })} rows={2} className="resize-none" /></div>
            <div className="space-y-2"><VarLabel label="Subheadline" value={section.content.heroSubheadline || ''} onChange={(v) => updateContent({ heroSubheadline: v })} /><Textarea value={section.content.heroSubheadline || ''} onChange={(e) => updateContent({ heroSubheadline: e.target.value })} rows={2} className="resize-none" /></div>
            <Separator />
            <div className="space-y-2"><Label>Background Image</Label><Input value={section.content.imageUrl || ''} onChange={(e) => updateContent({ imageUrl: e.target.value })} placeholder="Paste image URL" /><UploadButton label="Upload Background" field="imageUrl" /></div>
            <div className="space-y-2">
              <Label>Overlay Color</Label>
              <input type="color" value={section.style.overlayColor || '#6d54df'} onChange={(e) => updateStyle({ overlayColor: e.target.value })} className="w-8 h-8 rounded border cursor-pointer" />
            </div>
            <div className="space-y-2">
              <Label>Overlay Opacity</Label>
              <input type="range" min="0" max="100" value={Math.round((section.style.overlayOpacity ?? 0.6) * 100)} onChange={(e) => updateStyle({ overlayOpacity: parseInt(e.target.value) / 100 })} className="w-full" />
              <span className="text-xs text-muted-foreground">{Math.round((section.style.overlayOpacity ?? 0.6) * 100)}%</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between"><Label className="text-xs">Show Primary Button</Label><Switch checked={!section.content.hideButton} onCheckedChange={(v) => updateContent({ hideButton: !v })} /></div>
            {!section.content.hideButton && (
              <>
                <div className="space-y-2"><Label>Primary Button</Label><Input value={section.content.buttonText || ''} onChange={(e) => updateContent({ buttonText: e.target.value })} /></div>
                <div className="space-y-2"><Label>Primary Link</Label><Input value={section.content.buttonLink || ''} onChange={(e) => updateContent({ buttonLink: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1"><Label className="text-xs">Btn Color</Label><input type="color" value={section.style.buttonColor || '#6d54df'} onChange={(e) => updateStyle({ buttonColor: e.target.value })} className="w-8 h-8 rounded border cursor-pointer" /></div>
                  <div className="space-y-1"><Label className="text-xs">Btn Text</Label><input type="color" value={section.style.buttonTextColor || '#ffffff'} onChange={(e) => updateStyle({ buttonTextColor: e.target.value })} className="w-8 h-8 rounded border cursor-pointer" /></div>
                </div>
              </>
            )}
            <div className="flex items-center justify-between"><Label className="text-xs">Show Secondary Button</Label><Switch checked={!section.content.hideSecondaryButton} onCheckedChange={(v) => updateContent({ hideSecondaryButton: !v })} /></div>
            {!section.content.hideSecondaryButton && (
              <>
                <div className="space-y-2"><Label>Secondary Button</Label><Input value={section.content.secondaryButtonText || ''} onChange={(e) => updateContent({ secondaryButtonText: e.target.value })} /></div>
                <div className="space-y-2"><Label>Secondary Link</Label><Input value={section.content.secondaryButtonLink || ''} onChange={(e) => updateContent({ secondaryButtonLink: e.target.value })} placeholder="#section or https://..." /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1"><Label className="text-xs">Sec Btn Color</Label><input type="color" value={section.style.secondaryButtonColor || '#ffffff'} onChange={(e) => updateStyle({ secondaryButtonColor: e.target.value })} className="w-8 h-8 rounded border cursor-pointer" /></div>
                  <div className="space-y-1"><Label className="text-xs">Sec Btn Text</Label><input type="color" value={section.style.secondaryButtonTextColor || '#000000'} onChange={(e) => updateStyle({ secondaryButtonTextColor: e.target.value })} className="w-8 h-8 rounded border cursor-pointer" /></div>
                </div>
              </>
            )}
            <Separator />
            <div className="flex items-center justify-between"><Label className="text-xs">Parallax Effect</Label><Switch checked={!!section.content.parallax} onCheckedChange={(v) => updateContent({ parallax: v })} /></div>
            <p className="text-xs text-muted-foreground">Elements move at different speeds on scroll for a depth effect</p>
          </>
        );

      case 'heroVideoBg':
        return (
          <>
            <div className="space-y-2"><VarLabel label="Badge" value={section.content.heroBadge || ''} onChange={(v) => updateContent({ heroBadge: v })} /><Input value={section.content.heroBadge || ''} onChange={(e) => updateContent({ heroBadge: e.target.value })} placeholder="e.g. New, Beta" /></div>
            <div className="space-y-2"><VarLabel label="Headline" value={section.content.text || ''} onChange={(v) => updateContent({ text: v })} /><Textarea value={section.content.text || ''} onChange={(e) => updateContent({ text: e.target.value })} rows={2} className="resize-none" /></div>
            <div className="space-y-2"><VarLabel label="Subheadline" value={section.content.heroSubheadline || ''} onChange={(v) => updateContent({ heroSubheadline: v })} /><Textarea value={section.content.heroSubheadline || ''} onChange={(e) => updateContent({ heroSubheadline: e.target.value })} rows={2} className="resize-none" /></div>
            <Separator />
            <div className="space-y-2">
              <Label>Background Video URL</Label>
              <Input value={section.content.videoUrl || ''} onChange={(e) => updateContent({ videoUrl: e.target.value })} placeholder="YouTube, Vimeo, or direct .mp4 URL" />
              <p className="text-xs text-muted-foreground">Video plays silently in the background. Supports YouTube, Vimeo, or direct video links.</p>
            </div>
            <div className="space-y-2">
              <Label>Overlay Color</Label>
              <input type="color" value={section.style.overlayColor || '#000000'} onChange={(e) => updateStyle({ overlayColor: e.target.value })} className="w-8 h-8 rounded border cursor-pointer" />
            </div>
            <div className="space-y-2">
              <Label>Overlay Opacity</Label>
              <input type="range" min="0" max="100" value={Math.round((section.style.overlayOpacity ?? 0.5) * 100)} onChange={(e) => updateStyle({ overlayOpacity: parseInt(e.target.value) / 100 })} className="w-full" />
              <span className="text-xs text-muted-foreground">{Math.round((section.style.overlayOpacity ?? 0.5) * 100)}%</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between"><Label className="text-xs">Show Primary Button</Label><Switch checked={!section.content.hideButton} onCheckedChange={(v) => updateContent({ hideButton: !v })} /></div>
            {!section.content.hideButton && (
              <>
                <div className="space-y-2"><Label>Primary Button</Label><Input value={section.content.buttonText || ''} onChange={(e) => updateContent({ buttonText: e.target.value })} /></div>
                <div className="space-y-2"><Label>Primary Link</Label><Input value={section.content.buttonLink || ''} onChange={(e) => updateContent({ buttonLink: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1"><Label className="text-xs">Btn Color</Label><input type="color" value={section.style.buttonColor || '#6d54df'} onChange={(e) => updateStyle({ buttonColor: e.target.value })} className="w-8 h-8 rounded border cursor-pointer" /></div>
                  <div className="space-y-1"><Label className="text-xs">Btn Text</Label><input type="color" value={section.style.buttonTextColor || '#ffffff'} onChange={(e) => updateStyle({ buttonTextColor: e.target.value })} className="w-8 h-8 rounded border cursor-pointer" /></div>
                </div>
              </>
            )}
            <div className="flex items-center justify-between"><Label className="text-xs">Show Secondary Button</Label><Switch checked={!section.content.hideSecondaryButton} onCheckedChange={(v) => updateContent({ hideSecondaryButton: !v })} /></div>
            {!section.content.hideSecondaryButton && (
              <>
                <div className="space-y-2"><Label>Secondary Button</Label><Input value={section.content.secondaryButtonText || ''} onChange={(e) => updateContent({ secondaryButtonText: e.target.value })} /></div>
                <div className="space-y-2"><Label>Secondary Link</Label><Input value={section.content.secondaryButtonLink || ''} onChange={(e) => updateContent({ secondaryButtonLink: e.target.value })} placeholder="#section or https://..." /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1"><Label className="text-xs">Sec Btn Color</Label><input type="color" value={section.style.secondaryButtonColor || '#ffffff'} onChange={(e) => updateStyle({ secondaryButtonColor: e.target.value })} className="w-8 h-8 rounded border cursor-pointer" /></div>
                  <div className="space-y-1"><Label className="text-xs">Sec Btn Text</Label><input type="color" value={section.style.secondaryButtonTextColor || '#000000'} onChange={(e) => updateStyle({ secondaryButtonTextColor: e.target.value })} className="w-8 h-8 rounded border cursor-pointer" /></div>
                </div>
              </>
            )}
            <Separator />
            <div className="flex items-center justify-between"><Label className="text-xs">Parallax Effect</Label><Switch checked={!!section.content.parallax} onCheckedChange={(v) => updateContent({ parallax: v })} /></div>
            <p className="text-xs text-muted-foreground">Elements move at different speeds on scroll for a depth effect</p>
          </>
        );

      case 'heroVideo':
        return (
          <>
            <div className="space-y-2"><VarLabel label="Headline" value={section.content.text || ''} onChange={(v) => updateContent({ text: v })} /><Textarea value={section.content.text || ''} onChange={(e) => updateContent({ text: e.target.value })} rows={2} className="resize-none" /></div>
            <div className="space-y-2"><VarLabel label="Subheadline" value={section.content.heroSubheadline || ''} onChange={(v) => updateContent({ heroSubheadline: v })} /><Textarea value={section.content.heroSubheadline || ''} onChange={(e) => updateContent({ heroSubheadline: e.target.value })} rows={2} className="resize-none" /></div>
            <Separator />
            <div className="space-y-2">
              <Label>Video URL</Label>
              <Input value={section.content.videoUrl || ''} onChange={(e) => updateContent({ videoUrl: e.target.value })} placeholder="YouTube, Vimeo, or direct video URL" />
              <p className="text-xs text-muted-foreground">Supports YouTube, Vimeo, or any direct video link</p>
            </div>
            <Separator />
            <div className="flex items-center justify-between"><Label className="text-xs">Parallax Effect</Label><Switch checked={!!section.content.parallax} onCheckedChange={(v) => updateContent({ parallax: v })} /></div>
            <p className="text-xs text-muted-foreground">Elements move at different speeds on scroll for a depth effect</p>
          </>
        );

      case 'heroImage':
        return (
          <>
            <div className="space-y-2"><VarLabel label="Headline" value={section.content.text || ''} onChange={(v) => updateContent({ text: v })} /><Textarea value={section.content.text || ''} onChange={(e) => updateContent({ text: e.target.value })} rows={2} className="resize-none" /></div>
            <div className="space-y-2"><VarLabel label="Subheadline" value={section.content.heroSubheadline || ''} onChange={(v) => updateContent({ heroSubheadline: v })} /><Textarea value={section.content.heroSubheadline || ''} onChange={(e) => updateContent({ heroSubheadline: e.target.value })} rows={2} className="resize-none" /></div>
            <Separator />
            <div className="space-y-2"><Label>Image</Label><Input value={section.content.heroImageUrl || ''} onChange={(e) => updateContent({ heroImageUrl: e.target.value })} placeholder="Paste image URL" /><UploadButton label="Upload Image" field="heroImageUrl" /></div>
            <Separator />
            <div className="flex items-center justify-between"><Label className="text-xs">Parallax Effect</Label><Switch checked={!!section.content.parallax} onCheckedChange={(v) => updateContent({ parallax: v })} /></div>
            <p className="text-xs text-muted-foreground">Elements move at different speeds on scroll for a depth effect</p>
          </>
        );

      case 'heroForm':
        return (
          <>
            <div className="space-y-2"><VarLabel label="Headline" value={section.content.text || ''} onChange={(v) => updateContent({ text: v })} /><Textarea value={section.content.text || ''} onChange={(e) => updateContent({ text: e.target.value })} rows={2} className="resize-none" /></div>
            <div className="space-y-2"><VarLabel label="Subheadline" value={section.content.heroSubheadline || ''} onChange={(v) => updateContent({ heroSubheadline: v })} /><Textarea value={section.content.heroSubheadline || ''} onChange={(e) => updateContent({ heroSubheadline: e.target.value })} rows={2} className="resize-none" /></div>
            <Separator />
            <div className="space-y-2"><VarLabel label="Form Title" value={section.content.heroFormTitle || ''} onChange={(v) => updateContent({ heroFormTitle: v })} /><Input value={section.content.heroFormTitle || ''} onChange={(e) => updateContent({ heroFormTitle: e.target.value })} /></div>
            <div className="space-y-2"><Label>Button Text</Label><Input value={section.content.heroFormButtonText || ''} onChange={(e) => updateContent({ heroFormButtonText: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label className="text-xs">Btn Color</Label><input type="color" value={section.style.buttonColor || '#6d54df'} onChange={(e) => updateStyle({ buttonColor: e.target.value })} className="w-8 h-8 rounded border cursor-pointer" /></div>
              <div className="space-y-1"><Label className="text-xs">Btn Text</Label><input type="color" value={section.style.buttonTextColor || '#ffffff'} onChange={(e) => updateStyle({ buttonTextColor: e.target.value })} className="w-8 h-8 rounded border cursor-pointer" /></div>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Recipient Email</Label>
              <Input type="email" value={section.content.formRecipientEmail || ''} onChange={(e) => updateContent({ formRecipientEmail: e.target.value })} placeholder="your@email.com" />
              <p className="text-xs text-muted-foreground">Form submissions will be sent to this email</p>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Form Fields</Label>
              {(section.content.heroFormFields || []).map((field, i) => (
                <div key={i} className="flex gap-2">
                  <Input value={field} onChange={(e) => { const f = [...(section.content.heroFormFields || [])]; f[i] = e.target.value; updateContent({ heroFormFields: f }); }} className="flex-1" />
                  <Button variant="ghost" size="sm" onClick={() => updateContent({ heroFormFields: (section.content.heroFormFields || []).filter((_, idx) => idx !== i) })}><Trash2 className="w-3 h-3" /></Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => updateContent({ heroFormFields: [...(section.content.heroFormFields || []), 'New Field'] })} className="w-full"><Plus className="w-3 h-3 mr-2" />Add Field</Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between"><Label className="text-xs">Parallax Effect</Label><Switch checked={!!section.content.parallax} onCheckedChange={(v) => updateContent({ parallax: v })} /></div>
            <p className="text-xs text-muted-foreground">Elements move at different speeds on scroll for a depth effect</p>
          </>
        );
      case 'features':
        return (
          <>
            <div className="space-y-1"><Label className="text-xs">Columns</Label>
              <Select value={String(section.style.columns || 3)} onValueChange={(v) => updateStyle({ columns: parseInt(v) })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['2', '3', '4'].map((c) => <SelectItem key={c} value={c}>{c} columns</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Separator />
            <Label>Features ({(section.content.featureItems || []).length})</Label>
            {renderArrayEditor<FeatureItem>(
              section.content.featureItems || [],
              'featureItems',
              [{ key: 'icon', label: 'Icon (emoji)' }, { key: 'title', label: 'Title' }, { key: 'description', label: 'Description', type: 'textarea' }],
              { icon: '✨', title: 'New Feature', description: 'Description here' }
            )}
          </>
        );

      case 'testimonials':
        return (
          <>
            <Label>Testimonials ({(section.content.testimonialItems || []).length})</Label>
            {renderArrayEditor<TestimonialItem>(
              section.content.testimonialItems || [],
              'testimonialItems',
              [{ key: 'quote', label: 'Quote', type: 'textarea' }, { key: 'author', label: 'Author' }, { key: 'role', label: 'Role' }],
              { quote: 'Great product!', author: 'Name', role: 'Title' }
            )}
          </>
        );

      case 'pricing':
        return (
          <>
            <div className="space-y-2"><VarLabel label="Title" value={section.content.pricingTitle || ''} onChange={(v) => updateContent({ pricingTitle: v })} /><Input value={section.content.pricingTitle || ''} onChange={(e) => updateContent({ pricingTitle: e.target.value })} /></div>
            <div className="space-y-2"><VarLabel label="Subtitle" value={section.content.pricingSubtitle || ''} onChange={(v) => updateContent({ pricingSubtitle: v })} /><Input value={section.content.pricingSubtitle || ''} onChange={(e) => updateContent({ pricingSubtitle: e.target.value })} /></div>
            <Separator />
            <Label>Tiers ({(section.content.pricingItems || []).length})</Label>
            {(section.content.pricingItems || []).map((tier, i) => (
              <div key={i} className="border rounded-lg p-3 space-y-2 relative">
                <Button variant="ghost" size="sm" className="absolute top-1 right-1 h-6 w-6 p-0" onClick={() => updateContent({ pricingItems: (section.content.pricingItems || []).filter((_, idx) => idx !== i) })}><Trash2 className="w-3 h-3" /></Button>
                <div className="space-y-1"><Label className="text-xs">Name</Label><Input value={tier.name} onChange={(e) => { const t = [...(section.content.pricingItems || [])]; t[i] = { ...t[i], name: e.target.value }; updateContent({ pricingItems: t }); }} className="text-xs" /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1"><Label className="text-xs">Price</Label><Input value={tier.price} onChange={(e) => { const t = [...(section.content.pricingItems || [])]; t[i] = { ...t[i], price: e.target.value }; updateContent({ pricingItems: t }); }} className="text-xs" /></div>
                  <div className="space-y-1"><Label className="text-xs">Period</Label><Input value={tier.period || ''} onChange={(e) => { const t = [...(section.content.pricingItems || [])]; t[i] = { ...t[i], period: e.target.value }; updateContent({ pricingItems: t }); }} className="text-xs" /></div>
                </div>
                <div className="space-y-1"><Label className="text-xs">Features (one per line)</Label><Textarea value={tier.features.join('\n')} onChange={(e) => { const t = [...(section.content.pricingItems || [])]; t[i] = { ...t[i], features: e.target.value.split('\n') }; updateContent({ pricingItems: t }); }} rows={3} className="resize-none text-xs" /></div>
                <div className="space-y-1"><Label className="text-xs">Button Text</Label><Input value={tier.buttonText || ''} onChange={(e) => { const t = [...(section.content.pricingItems || [])]; t[i] = { ...t[i], buttonText: e.target.value }; updateContent({ pricingItems: t }); }} className="text-xs" /></div>
                <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={tier.highlighted || false} onChange={(e) => { const t = [...(section.content.pricingItems || [])]; t[i] = { ...t[i], highlighted: e.target.checked }; updateContent({ pricingItems: t }); }} />Highlight this tier</label>
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full" onClick={() => updateContent({ pricingItems: [...(section.content.pricingItems || []), { name: 'Plan', price: '$0', period: '/mo', features: ['Feature 1'], buttonText: 'Choose' }] })}><Plus className="w-3 h-3 mr-2" />Add Tier</Button>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label className="text-xs">Btn Color</Label><input type="color" value={section.style.buttonColor || '#6d54df'} onChange={(e) => updateStyle({ buttonColor: e.target.value })} className="w-8 h-8 rounded border cursor-pointer" /></div>
              <div className="space-y-1"><Label className="text-xs">Accent</Label><input type="color" value={section.style.accentColor || '#6d54df'} onChange={(e) => updateStyle({ accentColor: e.target.value })} className="w-8 h-8 rounded border cursor-pointer" /></div>
            </div>
          </>
        );

      case 'faq':
        return (
          <>
            <Label>FAQ Items ({(section.content.faqItems || []).length})</Label>
            {renderArrayEditor<FaqItem>(
              section.content.faqItems || [],
              'faqItems',
              [{ key: 'question', label: 'Question' }, { key: 'answer', label: 'Answer', type: 'textarea' }],
              { question: 'New question?', answer: 'Answer here.' }
            )}
          </>
        );

      case 'stats':
        return (
          <>
            <Label>Stats ({(section.content.statItems || []).length})</Label>
            {renderArrayEditor<StatItem>(
              section.content.statItems || [],
              'statItems',
              [{ key: 'value', label: 'Value' }, { key: 'label', label: 'Label' }],
              { value: '100+', label: 'Metric' }
            )}
            <div className="space-y-1"><Label className="text-xs">Accent Color</Label><input type="color" value={section.style.accentColor || '#6d54df'} onChange={(e) => updateStyle({ accentColor: e.target.value })} className="w-8 h-8 rounded border cursor-pointer" /></div>
          </>
        );

      case 'team':
        return (
          <>
            <div className="space-y-2"><VarLabel label="Title" value={section.content.teamTitle || ''} onChange={(v) => updateContent({ teamTitle: v })} /><Input value={section.content.teamTitle || ''} onChange={(e) => updateContent({ teamTitle: e.target.value })} /></div>
            <div className="space-y-2"><VarLabel label="Subtitle" value={section.content.teamSubtitle || ''} onChange={(v) => updateContent({ teamSubtitle: v })} /><Input value={section.content.teamSubtitle || ''} onChange={(e) => updateContent({ teamSubtitle: e.target.value })} /></div>
            <Separator />
            <Label>Members ({(section.content.teamMembers || []).length})</Label>
            {renderArrayEditor<TeamMember>(
              section.content.teamMembers || [],
              'teamMembers',
              [{ key: 'name', label: 'Name' }, { key: 'role', label: 'Role' }, { key: 'imageUrl', label: 'Photo URL' }],
              { name: 'New Member', role: 'Role', imageUrl: '' }
            )}
          </>
        );

      case 'logoCloud':
        return (
          <>
            <div className="space-y-2"><VarLabel label="Title" value={section.content.logoCloudTitle || ''} onChange={(v) => updateContent({ logoCloudTitle: v })} /><Input value={section.content.logoCloudTitle || ''} onChange={(e) => updateContent({ logoCloudTitle: e.target.value })} /></div>
            <Separator />
            <Label>Logos ({(section.content.logoUrls || []).length})</Label>
            {(section.content.logoUrls || []).map((url, i) => (
              <div key={i} className="flex gap-2">
                <Input value={url} onChange={(e) => { const urls = [...(section.content.logoUrls || [])]; urls[i] = e.target.value; updateContent({ logoUrls: urls }); }} placeholder="Logo URL" className="flex-1 text-xs" />
                <Button variant="ghost" size="sm" onClick={() => updateContent({ logoUrls: (section.content.logoUrls || []).filter((_, idx) => idx !== i) })}><Trash2 className="w-3 h-3" /></Button>
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full" onClick={() => updateContent({ logoUrls: [...(section.content.logoUrls || []), ''] })}><Plus className="w-3 h-3 mr-2" />Add Logo</Button>
          </>
        );

      case 'newsletter':
        return (
          <>
            <div className="space-y-2"><VarLabel label="Title" value={section.content.newsletterTitle || ''} onChange={(v) => updateContent({ newsletterTitle: v })} /><Input value={section.content.newsletterTitle || ''} onChange={(e) => updateContent({ newsletterTitle: e.target.value })} /></div>
            <div className="space-y-2"><VarLabel label="Subtitle" value={section.content.newsletterSubtitle || ''} onChange={(v) => updateContent({ newsletterSubtitle: v })} /><Input value={section.content.newsletterSubtitle || ''} onChange={(e) => updateContent({ newsletterSubtitle: e.target.value })} /></div>
            <div className="space-y-2"><Label>Placeholder</Label><Input value={section.content.newsletterPlaceholder || ''} onChange={(e) => updateContent({ newsletterPlaceholder: e.target.value })} /></div>
            <div className="flex items-center justify-between"><Label className="text-xs">Show Button</Label><Switch checked={!section.content.hideButton} onCheckedChange={(v) => updateContent({ hideButton: !v })} /></div>
            {!section.content.hideButton && (
              <>
                <div className="space-y-2"><Label>Button Text</Label><Input value={section.content.newsletterButtonText || ''} onChange={(e) => updateContent({ newsletterButtonText: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1"><Label className="text-xs">Btn Color</Label><input type="color" value={section.style.buttonColor || '#6d54df'} onChange={(e) => updateStyle({ buttonColor: e.target.value })} className="w-8 h-8 rounded border cursor-pointer" /></div>
                  <div className="space-y-1"><Label className="text-xs">Btn Text</Label><input type="color" value={section.style.buttonTextColor || '#ffffff'} onChange={(e) => updateStyle({ buttonTextColor: e.target.value })} className="w-8 h-8 rounded border cursor-pointer" /></div>
                </div>
              </>
            )}
          </>
        );

      case 'comparison':
        return (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label className="text-xs">Header A</Label><Input value={section.content.comparisonHeaderA || ''} onChange={(e) => updateContent({ comparisonHeaderA: e.target.value })} className="text-xs" /></div>
              <div className="space-y-1"><Label className="text-xs">Header B</Label><Input value={section.content.comparisonHeaderB || ''} onChange={(e) => updateContent({ comparisonHeaderB: e.target.value })} className="text-xs" /></div>
            </div>
            <Separator />
            <Label>Rows ({(section.content.comparisonRows || []).length})</Label>
            {renderArrayEditor<ComparisonRow>(
              section.content.comparisonRows || [],
              'comparisonRows',
              [{ key: 'feature', label: 'Feature' }, { key: 'optionA', label: 'Option A' }, { key: 'optionB', label: 'Option B' }],
              { feature: 'Feature', optionA: '✓', optionB: '✗' }
            )}
          </>
        );

      case 'steps':
        return (
          <>
            <div className="space-y-2"><VarLabel label="Title" value={section.content.stepsTitle || ''} onChange={(v) => updateContent({ stepsTitle: v })} /><Input value={section.content.stepsTitle || ''} onChange={(e) => updateContent({ stepsTitle: e.target.value })} /></div>
            <div className="space-y-2"><VarLabel label="Subtitle" value={section.content.stepsSubtitle || ''} onChange={(v) => updateContent({ stepsSubtitle: v })} /><Input value={section.content.stepsSubtitle || ''} onChange={(e) => updateContent({ stepsSubtitle: e.target.value })} /></div>
            <Separator />
            <Label>Steps ({(section.content.stepItems || []).length})</Label>
            {renderArrayEditor<StepItem>(
              section.content.stepItems || [],
              'stepItems',
              [{ key: 'title', label: 'Title' }, { key: 'description', label: 'Description', type: 'textarea' }],
              { title: 'Step', description: 'Description' }
            )}
            <div className="space-y-1"><Label className="text-xs">Accent Color</Label><input type="color" value={section.style.accentColor || '#6d54df'} onChange={(e) => updateStyle({ accentColor: e.target.value })} className="w-8 h-8 rounded border cursor-pointer" /></div>
          </>
        );

      case 'gallery':
        return (
          <>
            <div className="space-y-1"><Label className="text-xs">Columns</Label>
              <Select value={String(section.content.galleryColumns || 3)} onValueChange={(v) => updateContent({ galleryColumns: parseInt(v) })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['2', '3', '4'].map((c) => <SelectItem key={c} value={c}>{c} columns</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Separator />
            <Label>Images ({(section.content.galleryUrls || []).length})</Label>
            {(section.content.galleryUrls || []).map((url, i) => (
              <div key={i} className="space-y-1">
                <div className="flex gap-2">
                  <Input value={url} onChange={(e) => { const urls = [...(section.content.galleryUrls || [])]; urls[i] = e.target.value; updateContent({ galleryUrls: urls }); }} placeholder="Image URL" className="flex-1 text-xs" />
                  <Button variant="ghost" size="sm" onClick={() => updateContent({ galleryUrls: (section.content.galleryUrls || []).filter((_, idx) => idx !== i) })}><Trash2 className="w-3 h-3" /></Button>
                </div>
                <div className="relative">
                  <Button variant="outline" size="sm" className="w-full" disabled={uploading}>
                    <Upload className="w-4 h-4 mr-2" />
                    {uploading ? "Uploading..." : "Upload"}
                  </Button>
                  <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={async (ev) => {
                    const file = ev.target.files?.[0];
                    if (!file) return;
                    setUploading(true);
                    try {
                      const publicUrl = await uploadCompressedImage(file);
                      const urls = [...(section.content.galleryUrls || [])];
                      urls[i] = publicUrl;
                      updateContent({ galleryUrls: urls });
                      toast({ title: "Uploaded!" });
                    } catch (err: any) {
                      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
                    } finally { setUploading(false); }
                  }} />
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full" onClick={() => updateContent({ galleryUrls: [...(section.content.galleryUrls || []), ''] })}><Plus className="w-3 h-3 mr-2" />Add Image</Button>
          </>
        );

      case 'footer':
        return (
          <>
            <Label>Columns ({(section.content.footerColumns || []).length})</Label>
            {(section.content.footerColumns || []).map((col, i) => (
              <div key={i} className="border rounded-lg p-3 space-y-2 relative">
                <Button variant="ghost" size="sm" className="absolute top-1 right-1 h-6 w-6 p-0" onClick={() => updateContent({ footerColumns: (section.content.footerColumns || []).filter((_, idx) => idx !== i) })}><Trash2 className="w-3 h-3" /></Button>
                <div className="space-y-1"><Label className="text-xs">Column Title</Label><Input value={col.title} onChange={(e) => { const c = [...(section.content.footerColumns || [])]; c[i] = { ...c[i], title: e.target.value }; updateContent({ footerColumns: c }); }} className="text-xs" /></div>
                <div className="space-y-1"><Label className="text-xs">Links (label|url, one per line)</Label>
                  <Textarea value={col.links.map(l => `${l.label}|${l.url}`).join('\n')} onChange={(e) => {
                    const c = [...(section.content.footerColumns || [])];
                    c[i] = { ...c[i], links: e.target.value.split('\n').filter(Boolean).map(line => { const [label, url] = line.split('|'); return { label: label || '', url: url || '#' }; }) };
                    updateContent({ footerColumns: c });
                  }} rows={3} className="resize-none text-xs" />
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full" onClick={() => updateContent({ footerColumns: [...(section.content.footerColumns || []), { title: 'Column', links: [{ label: 'Link', url: '#' }] }] })}><Plus className="w-3 h-3 mr-2" />Add Column</Button>
            <Separator />
            <div className="space-y-2"><Label>Copyright</Label><Input value={section.content.footerCopyright || ''} onChange={(e) => updateContent({ footerCopyright: e.target.value })} /></div>
          </>
        );

      case 'divider':
        return (
          <div className="space-y-2">
            <Label>Style</Label>
            <Select value={section.content.dividerStyle || 'solid'} onValueChange={(v) => updateContent({ dividerStyle: v as any })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="solid">Solid</SelectItem>
                <SelectItem value="dashed">Dashed</SelectItem>
                <SelectItem value="dotted">Dotted</SelectItem>
                <SelectItem value="gradient">Gradient</SelectItem>
              </SelectContent>
            </Select>
            <div className="space-y-1"><Label className="text-xs">Color</Label><input type="color" value={section.style.accentColor || '#e2e8f0'} onChange={(e) => updateStyle({ accentColor: e.target.value })} className="w-8 h-8 rounded border cursor-pointer" /></div>
          </div>
        );

      case 'quote':
        return (
          <>
            <div className="space-y-2"><VarLabel label="Quote" value={section.content.quoteText || ''} onChange={(v) => updateContent({ quoteText: v })} /><Textarea value={section.content.quoteText || ''} onChange={(e) => updateContent({ quoteText: e.target.value })} rows={3} className="resize-none" /></div>
            <div className="space-y-2"><VarLabel label="Author" value={section.content.quoteAuthor || ''} onChange={(v) => updateContent({ quoteAuthor: v })} /><Input value={section.content.quoteAuthor || ''} onChange={(e) => updateContent({ quoteAuthor: e.target.value })} /></div>
            <div className="space-y-2"><Label>Role</Label><Input value={section.content.quoteRole || ''} onChange={(e) => updateContent({ quoteRole: e.target.value })} /></div>
            <div className="space-y-1"><Label className="text-xs">Accent Color</Label><input type="color" value={section.style.accentColor || '#6d54df'} onChange={(e) => updateStyle({ accentColor: e.target.value })} className="w-8 h-8 rounded border cursor-pointer" /></div>
          </>
        );

      case 'countdown':
        return (
          <>
            <div className="space-y-2"><VarLabel label="Title" value={section.content.countdownTitle || ''} onChange={(v) => updateContent({ countdownTitle: v })} /><Input value={section.content.countdownTitle || ''} onChange={(e) => updateContent({ countdownTitle: e.target.value })} /></div>
            <div className="space-y-2"><VarLabel label="Subtitle" value={section.content.countdownSubtitle || ''} onChange={(v) => updateContent({ countdownSubtitle: v })} /><Input value={section.content.countdownSubtitle || ''} onChange={(e) => updateContent({ countdownSubtitle: e.target.value })} /></div>
            <div className="space-y-2"><Label>Target Date</Label><Input type="date" value={section.content.countdownDate || ''} onChange={(e) => updateContent({ countdownDate: e.target.value })} /></div>
            <div className="space-y-1"><Label className="text-xs">Accent Color</Label><input type="color" value={section.style.accentColor || '#6d54df'} onChange={(e) => updateStyle({ accentColor: e.target.value })} className="w-8 h-8 rounded border cursor-pointer" /></div>
          </>
        );

      case 'socialProof':
        return (
          <>
            <div className="space-y-2"><VarLabel label="Title" value={section.content.socialProofTitle || ''} onChange={(v) => updateContent({ socialProofTitle: v })} /><Input value={section.content.socialProofTitle || ''} onChange={(e) => updateContent({ socialProofTitle: e.target.value })} /></div>
            <Separator />
            <Label>Items ({(section.content.socialProofItems || []).length})</Label>
            {renderArrayEditor<SocialProofItem>(
              section.content.socialProofItems || [],
              'socialProofItems',
              [{ key: 'count', label: 'Count/Value' }, { key: 'label', label: 'Label' }, { key: 'platform', label: 'Source' }],
              { platform: 'Source', count: '0', label: 'Label' }
            )}
            <div className="space-y-1"><Label className="text-xs">Accent Color</Label><input type="color" value={section.style.accentColor || '#6d54df'} onChange={(e) => updateStyle({ accentColor: e.target.value })} className="w-8 h-8 rounded border cursor-pointer" /></div>
          </>
        );

      case 'benefits':
        return (
          <>
            <div className="space-y-2"><VarLabel label="Title" value={section.content.benefitsTitle || ''} onChange={(v) => updateContent({ benefitsTitle: v })} /><Input value={section.content.benefitsTitle || ''} onChange={(e) => updateContent({ benefitsTitle: e.target.value })} /></div>
            <div className="space-y-2"><VarLabel label="Subtitle" value={section.content.benefitsSubtitle || ''} onChange={(v) => updateContent({ benefitsSubtitle: v })} /><Input value={section.content.benefitsSubtitle || ''} onChange={(e) => updateContent({ benefitsSubtitle: e.target.value })} /></div>
            <Separator />
            <Label>Benefits ({(section.content.benefitItems || []).length})</Label>
            {(section.content.benefitItems || []).map((item, i) => (
              <div key={i} className="flex gap-2">
                <Input value={item} onChange={(e) => { const items = [...(section.content.benefitItems || [])]; items[i] = e.target.value; updateContent({ benefitItems: items }); }} className="flex-1 text-xs" />
                <Button variant="ghost" size="sm" onClick={() => updateContent({ benefitItems: (section.content.benefitItems || []).filter((_, idx) => idx !== i) })}><Trash2 className="w-3 h-3" /></Button>
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full" onClick={() => updateContent({ benefitItems: [...(section.content.benefitItems || []), 'New benefit'] })}><Plus className="w-3 h-3 mr-2" />Add Benefit</Button>
            <div className="space-y-1"><Label className="text-xs">Check Color</Label><input type="color" value={section.style.accentColor || '#22c55e'} onChange={(e) => updateStyle({ accentColor: e.target.value })} className="w-8 h-8 rounded border cursor-pointer" /></div>
          </>
        );

      case 'cards':
        return (
          <>
            <div className="space-y-2"><VarLabel label="Section Title" value={section.content.cardsTitle || ''} onChange={(v) => updateContent({ cardsTitle: v })} /><Input value={section.content.cardsTitle || ''} onChange={(e) => updateContent({ cardsTitle: e.target.value })} /></div>
            <div className="space-y-1"><Label className="text-xs">Columns</Label>
              <Select value={String(section.style.columns || 3)} onValueChange={(v) => updateStyle({ columns: parseInt(v) })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['2', '3', '4'].map((c) => <SelectItem key={c} value={c}>{c} columns</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Separator />
            <Label>Cards ({(section.content.cardItems || []).length})</Label>
            {renderArrayEditor<CardItem>(
              section.content.cardItems || [],
              'cardItems',
              [{ key: 'title', label: 'Title' }, { key: 'description', label: 'Description', type: 'textarea' }, { key: 'imageUrl', label: 'Image URL' }],
              { title: 'Card', description: 'Description', imageUrl: '' }
            )}
          </>
        );

      case 'qrCode':
        return (
          <>
            <div className="space-y-2">
              <Label>QR Code URL</Label>
              <Input value={section.content.qrCodeUrl || ''} onChange={(e) => updateContent({ qrCodeUrl: e.target.value })} placeholder="https://example.com" />
              <p className="text-xs text-muted-foreground">The URL the QR code links to</p>
            </div>
            <div className="space-y-2">
              <VarLabel label="Label" value={section.content.qrCodeLabel || ''} onChange={(v) => updateContent({ qrCodeLabel: v })} />
              <Input value={section.content.qrCodeLabel || ''} onChange={(e) => updateContent({ qrCodeLabel: e.target.value })} placeholder="Scan to visit" />
            </div>
            <div className="space-y-2">
              <Label>Size (px)</Label>
              <Select value={String(section.content.qrCodeSize || 200)} onValueChange={(v) => updateContent({ qrCodeSize: parseInt(v) })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['100', '150', '200', '250', '300', '400'].map((s) => <SelectItem key={s} value={s}>{s}px</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </>
        );

      case 'calendarBooking':
        return (
          <>
            <div className="space-y-2">
              <VarLabel label="Title" value={section.content.calendarTitle || ''} onChange={(v) => updateContent({ calendarTitle: v })} />
              <Input value={section.content.calendarTitle || ''} onChange={(e) => updateContent({ calendarTitle: e.target.value })} placeholder="Book a VIP Appointment" />
            </div>
            <div className="space-y-2">
              <VarLabel label="Subtitle" value={section.content.calendarSubtitle || ''} onChange={(v) => updateContent({ calendarSubtitle: v })} />
              <Textarea value={section.content.calendarSubtitle || ''} onChange={(e) => updateContent({ calendarSubtitle: e.target.value })} rows={2} className="resize-none" placeholder="Schedule a personalized demo or meeting." />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Calendar Provider</Label>
              <Select value={section.content.calendarProvider || 'calendly'} onValueChange={(v) => updateContent({ calendarProvider: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="calendly">Calendly</SelectItem>
                  <SelectItem value="google">Google Calendar</SelectItem>
                  <SelectItem value="outlook">Outlook / Microsoft Bookings</SelectItem>
                  <SelectItem value="other">Other (custom link)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Booking URL</Label>
              <Input value={section.content.calendarUrl || ''} onChange={(e) => updateContent({ calendarUrl: e.target.value })} placeholder={
                section.content.calendarProvider === 'calendly' ? 'https://calendly.com/your-name/30min' :
                section.content.calendarProvider === 'google' ? 'https://calendar.google.com/calendar/appointments/...' :
                section.content.calendarProvider === 'outlook' ? 'https://outlook.office365.com/owa/calendar/...' :
                'https://your-scheduling-link.com'
              } />
              <p className="text-xs text-muted-foreground">
                {section.content.calendarProvider === 'calendly' ? 'Paste your Calendly event link. It will be embedded directly on the page.' :
                 section.content.calendarProvider === 'google' ? 'Paste your Google Calendar appointment scheduling link.' :
                 section.content.calendarProvider === 'outlook' ? 'Paste your Microsoft Bookings or Outlook scheduling link.' :
                 'Paste any scheduling URL. It will open in a new tab.'}
              </p>
            </div>
            <Separator />
            <div className="space-y-2">
              <VarLabel label="Button Text" value={section.content.calendarButtonText || ''} onChange={(v) => updateContent({ calendarButtonText: v })} />
              <Input value={section.content.calendarButtonText || ''} onChange={(e) => updateContent({ calendarButtonText: e.target.value })} placeholder="Book Now" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label className="text-xs">Btn Color</Label><input type="color" value={section.style.buttonColor || '#6d54df'} onChange={(e) => updateStyle({ buttonColor: e.target.value })} className="w-8 h-8 rounded border cursor-pointer" /></div>
              <div className="space-y-1"><Label className="text-xs">Btn Text</Label><input type="color" value={section.style.buttonTextColor || '#ffffff'} onChange={(e) => updateStyle({ buttonTextColor: e.target.value })} className="w-8 h-8 rounded border cursor-pointer" /></div>
            </div>
          </>
        );

      case 'columns2':
      case 'columns3': {
        const colCount = section.type === 'columns2' ? 2 : 3;
        const children = section.content.columnChildren || Array.from({ length: colCount }, () => []);
        // Nestable section types (simple content types only)
        const nestableTypes: SectionType[] = ['headline', 'body', 'image', 'gallery', 'video', 'cta', 'quote', 'spacer', 'divider', 'form', 'document', 'qrCode'];

        const addChildSection = (colIdx: number, childType: SectionType) => {
          const defaults = SECTION_DEFAULTS[childType];
          const newChild: BuilderSection = {
            id: Math.random().toString(36).substring(2, 10),
            type: childType,
            content: { ...defaults.content },
            style: { ...defaults.style },
          };
          const updated = children.map((col, i) =>
            i === colIdx ? [...(col as BuilderSection[]), newChild] : col
          );
          updateContent({ columnChildren: updated });
        };

        const removeChildSection = (colIdx: number, childId: string) => {
          const updated = children.map((col, i) =>
            i === colIdx ? (col as BuilderSection[]).filter((s) => s.id !== childId) : col
          );
          updateContent({ columnChildren: updated });
        };

        const moveChildSection = (colIdx: number, childIdx: number, dir: 'up' | 'down') => {
          const col = [...(children[colIdx] as BuilderSection[])];
          const newIdx = dir === 'up' ? childIdx - 1 : childIdx + 1;
          if (newIdx < 0 || newIdx >= col.length) return;
          [col[childIdx], col[newIdx]] = [col[newIdx], col[childIdx]];
          const updated = children.map((c, i) => (i === colIdx ? col : c));
          updateContent({ columnChildren: updated });
        };

        return (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">{colCount}-column layout. Add content to each column below.</p>
            {Array.from({ length: colCount }).map((_, colIdx) => {
              const colSections = (children[colIdx] || []) as BuilderSection[];
              return (
                <div key={colIdx} className="space-y-2">
                  <Separator />
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Column {colIdx + 1}</h4>
                  {colSections.map((child, childIdx) => (
                    <div key={child.id} className="border rounded-lg p-2 space-y-1 relative bg-muted/30">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">{SECTION_DEFAULTS[child.type]?.label || child.type}</span>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => moveChildSection(colIdx, childIdx, 'up')} disabled={childIdx === 0}>
                            <span className="text-xs">↑</span>
                          </Button>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => moveChildSection(colIdx, childIdx, 'down')} disabled={childIdx === colSections.length - 1}>
                            <span className="text-xs">↓</span>
                          </Button>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeChildSection(colIdx, child.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      {/* Inline mini-editor for simple text content */}
                      {(child.type === 'headline' || child.type === 'body') && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs">Text</Label>
                            <VariableInsert onInsert={(token) => {
                              const newText = insertAtCursor(child.content.text || '', token);
                              const updated = children.map((col, i) =>
                                i === colIdx
                                  ? (col as BuilderSection[]).map((s) =>
                                      s.id === child.id ? { ...s, content: { ...s.content, text: newText } } : s
                                    )
                                  : col
                              );
                              updateContent({ columnChildren: updated });
                            }} />
                          </div>
                          <Textarea
                            value={child.content.text || ''}
                            onChange={(e) => {
                              const updated = children.map((col, i) =>
                                i === colIdx
                                  ? (col as BuilderSection[]).map((s) =>
                                      s.id === child.id ? { ...s, content: { ...s.content, text: e.target.value } } : s
                                    )
                                  : col
                              );
                              updateContent({ columnChildren: updated });
                            }}
                            onFocus={(e) => { lastFocusedInput = e.target; lastCursorPos = e.target.selectionStart; }}
                            onClick={(e) => { lastCursorPos = (e.target as HTMLTextAreaElement).selectionStart; }}
                            onKeyUp={(e) => { lastCursorPos = (e.target as HTMLTextAreaElement).selectionStart; }}
                            rows={child.type === 'body' ? 3 : 1}
                            className="resize-none text-xs"
                          />
                          <div className="space-y-1">
                            <Label className="text-xs">Text Size</Label>
                            <Select value={child.style.fontSize || (child.type === 'headline' ? '48px' : '18px')} onValueChange={(v) => {
                              const updated = children.map((col, i) =>
                                i === colIdx
                                  ? (col as BuilderSection[]).map((s) =>
                                      s.id === child.id ? { ...s, style: { ...s.style, fontSize: v } } : s
                                    )
                                  : col
                              );
                              updateContent({ columnChildren: updated });
                            }}>
                              <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>{FONT_SIZES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Text Color</Label>
                            <input type="color" value={child.style.textColor || '#000000'} onChange={(e) => {
                              const updated = children.map((col, i) =>
                                i === colIdx
                                  ? (col as BuilderSection[]).map((s) =>
                                      s.id === child.id ? { ...s, style: { ...s.style, textColor: e.target.value } } : s
                                    )
                                  : col
                              );
                              updateContent({ columnChildren: updated });
                            }} className="w-8 h-8 rounded border cursor-pointer" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Background Color</Label>
                            <input type="color" value={child.style.backgroundColor || '#ffffff'} onChange={(e) => {
                              const updated = children.map((col, i) =>
                                i === colIdx
                                  ? (col as BuilderSection[]).map((s) =>
                                      s.id === child.id ? { ...s, style: { ...s.style, backgroundColor: e.target.value } } : s
                                    )
                                  : col
                              );
                              updateContent({ columnChildren: updated });
                            }} className="w-8 h-8 rounded border cursor-pointer" />
                          </div>
                        </div>
                      )}
                      {child.type === 'image' && (
                        <div className="space-y-1">
                          <Input
                            value={child.content.imageUrl || ''}
                            onChange={(e) => {
                              const updated = children.map((col, i) =>
                                i === colIdx
                                  ? (col as BuilderSection[]).map((s) =>
                                      s.id === child.id ? { ...s, content: { ...s.content, imageUrl: e.target.value } } : s
                                    )
                                  : col
                              );
                              updateContent({ columnChildren: updated });
                            }}
                            placeholder="Paste image URL"
                            className="text-xs"
                          />
                          <div className="relative">
                            <Button variant="outline" size="sm" className="w-full" disabled={uploading}>
                              <Upload className="w-4 h-4 mr-2" />
                              {uploading ? "Uploading..." : "Upload Image"}
                            </Button>
                            <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setUploading(true);
                              try {
                                const publicUrl = await uploadCompressedImage(file);
                                const updated = children.map((col, i) =>
                                  i === colIdx
                                    ? (col as BuilderSection[]).map((s) =>
                                        s.id === child.id ? { ...s, content: { ...s.content, imageUrl: publicUrl } } : s
                                      )
                                    : col
                                );
                                updateContent({ columnChildren: updated });
                                toast({ title: "Uploaded!" });
                              } catch (err: any) {
                                toast({ title: "Upload failed", description: err.message, variant: "destructive" });
                              } finally {
                                setUploading(false);
                              }
                            }} />
                          </div>
                        </div>
                      )}
                      {child.type === 'gallery' && (
                        <div className="space-y-1">
                          <Label className="text-xs">Gallery Images ({(child.content.galleryUrls || []).length})</Label>
                          {(child.content.galleryUrls || []).map((gUrl, gi) => (
                            <div key={gi} className="space-y-1">
                              <div className="flex gap-1">
                                <Input value={gUrl} onChange={(e) => {
                                  const urls = [...(child.content.galleryUrls || [])];
                                  urls[gi] = e.target.value;
                                  const updated = children.map((col, i) =>
                                    i === colIdx
                                      ? (col as BuilderSection[]).map((s) =>
                                          s.id === child.id ? { ...s, content: { ...s.content, galleryUrls: urls } } : s
                                        )
                                      : col
                                  );
                                  updateContent({ columnChildren: updated });
                                }} placeholder="Image URL" className="flex-1 text-xs" />
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => {
                                  const urls = (child.content.galleryUrls || []).filter((_, idx) => idx !== gi);
                                  const updated = children.map((col, i) =>
                                    i === colIdx
                                      ? (col as BuilderSection[]).map((s) =>
                                          s.id === child.id ? { ...s, content: { ...s.content, galleryUrls: urls } } : s
                                        )
                                      : col
                                  );
                                  updateContent({ columnChildren: updated });
                                }}><Trash2 className="w-3 h-3" /></Button>
                              </div>
                              <div className="relative">
                                <Button variant="outline" size="sm" className="w-full text-xs" disabled={uploading}>
                                  <Upload className="w-3 h-3 mr-1" />
                                  {uploading ? "Uploading..." : "Upload"}
                                </Button>
                                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={async (ev) => {
                                  const file = ev.target.files?.[0];
                                  if (!file) return;
                                  setUploading(true);
                                  try {
                                    const publicUrl = await uploadCompressedImage(file);
                                    const urls = [...(child.content.galleryUrls || [])];
                                    urls[gi] = publicUrl;
                                    const updated = children.map((col, i) =>
                                      i === colIdx
                                        ? (col as BuilderSection[]).map((s) =>
                                            s.id === child.id ? { ...s, content: { ...s.content, galleryUrls: urls } } : s
                                          )
                                        : col
                                    );
                                    updateContent({ columnChildren: updated });
                                    toast({ title: "Uploaded!" });
                                  } catch (err: any) {
                                    toast({ title: "Upload failed", description: err.message, variant: "destructive" });
                                  } finally { setUploading(false); }
                                }} />
                              </div>
                            </div>
                          ))}
                          <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => {
                            const urls = [...(child.content.galleryUrls || []), ''];
                            const updated = children.map((col, i) =>
                              i === colIdx
                                ? (col as BuilderSection[]).map((s) =>
                                    s.id === child.id ? { ...s, content: { ...s.content, galleryUrls: urls } } : s
                                  )
                                : col
                            );
                            updateContent({ columnChildren: updated });
                          }}><Plus className="w-3 h-3 mr-1" />Add Image</Button>
                        </div>
                      )}
                      {child.type === 'video' && (
                        <Input
                          value={child.content.videoUrl || ''}
                          onChange={(e) => {
                            const updated = children.map((col, i) =>
                              i === colIdx
                                ? (col as BuilderSection[]).map((s) =>
                                    s.id === child.id ? { ...s, content: { ...s.content, videoUrl: e.target.value } } : s
                                  )
                                : col
                            );
                            updateContent({ columnChildren: updated });
                          }}
                          placeholder="Paste video URL"
                          className="text-xs"
                        />
                      )}
                      {child.type === 'cta' && (
                        <div className="space-y-1">
                          <Input
                            value={child.content.text || ''}
                            onChange={(e) => {
                              const updated = children.map((col, i) =>
                                i === colIdx
                                  ? (col as BuilderSection[]).map((s) =>
                                      s.id === child.id ? { ...s, content: { ...s.content, text: e.target.value } } : s
                                    )
                                  : col
                              );
                              updateContent({ columnChildren: updated });
                            }}
                            placeholder="CTA heading"
                            className="text-xs"
                          />
                          <Input
                            value={child.content.buttonText || ''}
                            onChange={(e) => {
                              const updated = children.map((col, i) =>
                                i === colIdx
                                  ? (col as BuilderSection[]).map((s) =>
                                      s.id === child.id ? { ...s, content: { ...s.content, buttonText: e.target.value } } : s
                                    )
                                  : col
                              );
                              updateContent({ columnChildren: updated });
                            }}
                            placeholder="Button text"
                            className="text-xs"
                          />
                        </div>
                      )}
                      {child.type === 'qrCode' && (
                        <div className="space-y-1">
                          <Label className="text-xs">QR Code URL</Label>
                          <Input
                            value={child.content.qrCodeUrl || ''}
                            onChange={(e) => {
                              const updated = children.map((col, i) =>
                                i === colIdx
                                  ? (col as BuilderSection[]).map((s) =>
                                      s.id === child.id ? { ...s, content: { ...s.content, qrCodeUrl: e.target.value } } : s
                                    )
                                  : col
                              );
                              updateContent({ columnChildren: updated });
                            }}
                            placeholder="https://example.com"
                            className="text-xs"
                          />
                          <Label className="text-xs">Label</Label>
                          <Input
                            value={child.content.qrCodeLabel || ''}
                            onChange={(e) => {
                              const updated = children.map((col, i) =>
                                i === colIdx
                                  ? (col as BuilderSection[]).map((s) =>
                                      s.id === child.id ? { ...s, content: { ...s.content, qrCodeLabel: e.target.value } } : s
                                    )
                                  : col
                              );
                              updateContent({ columnChildren: updated });
                            }}
                            placeholder="Scan to visit"
                            className="text-xs"
                          />
                          <Label className="text-xs">Size</Label>
                          <Select value={String(child.content.qrCodeSize || 200)} onValueChange={(v) => {
                            const updated = children.map((col, i) =>
                              i === colIdx
                                ? (col as BuilderSection[]).map((s) =>
                                    s.id === child.id ? { ...s, content: { ...s.content, qrCodeSize: parseInt(v) } } : s
                                  )
                                : col
                            );
                            updateContent({ columnChildren: updated });
                          }}>
                            <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {[100, 150, 200, 256, 300].map((s) => <SelectItem key={s} value={String(s)}>{s}px</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      {/* Universal background color for all child types except headline/body (which have it above) */}
                      {child.type !== 'headline' && child.type !== 'body' && (
                        <div className="space-y-1 mt-2">
                          <Label className="text-xs">Background Color</Label>
                          <input type="color" value={child.style.backgroundColor || '#ffffff'} onChange={(e) => {
                            const updated = children.map((col, i) =>
                              i === colIdx
                                ? (col as BuilderSection[]).map((s) =>
                                    s.id === child.id ? { ...s, style: { ...s.style, backgroundColor: e.target.value } } : s
                                  )
                                : col
                            );
                            updateContent({ columnChildren: updated });
                          }} className="w-8 h-8 rounded border cursor-pointer" />
                        </div>
                      )}
                    </div>
                  ))}
                  <Select onValueChange={(v) => addChildSection(colIdx, v as SectionType)}>
                    <SelectTrigger className="text-xs h-8">
                      <SelectValue placeholder="+ Add content..." />
                    </SelectTrigger>
                    <SelectContent>
                      {nestableTypes.map((t) => (
                        <SelectItem key={t} value={t}>{SECTION_DEFAULTS[t]?.label || t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </div>
        );
      }

      default:
        return null;
    }
  };

  // Sections that already have their own button controls
  const sectionsWithOwnButtons = ['hero', 'cta', 'document', 'newsletter', 'heroForm', 'form', 'pricing', 'spacer', 'divider', 'logo', 'footer', 'qrCode', 'columns2', 'columns3'];
  // Sections that should NOT show the generic button toggle (either they handle their own or don't use buttons)
  const noButtonSections = [...sectionsWithOwnButtons, 'image', 'video', 'gallery', 'logoCloud', 'stats', 'team', 'comparison', 'steps', 'faq', 'testimonials', 'features', 'socialProof', 'cards', 'countdown', 'benefits'];

  const renderOptionalButtonFields = () => {
    if (noButtonSections.includes(section.type)) return null;
    return (
      <>
        <Separator />
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Button</h4>
        <div className="flex items-center justify-between"><Label className="text-xs">Show Button</Label><Switch checked={!!section.content.buttonText && !section.content.hideButton} onCheckedChange={(v) => {
          if (v) {
            updateContent({ hideButton: false, buttonText: section.content.buttonText || 'Learn More', buttonLink: section.content.buttonLink || '#' });
          } else {
            updateContent({ hideButton: true });
          }
        }} /></div>
        {section.content.buttonText && !section.content.hideButton && (
          <>
            <div className="space-y-2"><Label>Button Text</Label><Input value={section.content.buttonText || ''} onChange={(e) => updateContent({ buttonText: e.target.value })} /></div>
            <div className="space-y-2"><Label>Button Link</Label><Input value={section.content.buttonLink || ''} onChange={(e) => updateContent({ buttonLink: e.target.value })} placeholder="#section or https://..." /></div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label className="text-xs">Btn Color</Label><input type="color" value={section.style.buttonColor || '#6d54df'} onChange={(e) => updateStyle({ buttonColor: e.target.value })} className="w-8 h-8 rounded border cursor-pointer" /></div>
              <div className="space-y-1"><Label className="text-xs">Btn Text</Label><input type="color" value={section.style.buttonTextColor || '#ffffff'} onChange={(e) => updateStyle({ buttonTextColor: e.target.value })} className="w-8 h-8 rounded border cursor-pointer" /></div>
            </div>
          </>
        )}
      </>
    );
  };

  // Determine which sections show typography controls
  const textSections = ['headline', 'body', 'banner', 'cta', 'hero', 'heroVideo', 'heroImage', 'heroForm', 'quote'];
  const colorSections = !['spacer', 'divider', 'image', 'video', 'gallery'].includes(section.type);
  const maxWidthSections = ['headline', 'body', 'video', 'image', 'form', 'features', 'testimonials', 'pricing', 'faq', 'stats', 'team', 'steps', 'gallery', 'comparison', 'cards', 'benefits', 'socialProof', 'newsletter', 'document', 'quote', 'footer', 'heroVideo', 'heroImage', 'heroForm', 'columns2', 'columns3'];

  const handleCursorCapture = (e: React.SyntheticEvent) => {
    const el = e.target as HTMLElement;
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      lastFocusedInput = el;
      lastCursorPos = el.selectionStart;
    }
  };

  return (
    <div onFocusCapture={handleCursorCapture} onClickCapture={handleCursorCapture} onKeyUpCapture={handleCursorCapture}>
    <div className="w-80 bg-card border-l border-border flex flex-col h-full">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold text-foreground text-sm">Section Properties</h3>
        <Button variant="ghost" size="sm" onClick={onClose}><X className="w-4 h-4" /></Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-5">
          {renderContentFields()}
          {renderOptionalButtonFields()}
          {textSections.includes(section.type) && (
            <>
              <Separator />
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Typography</h4>
              <div className="space-y-3">
                <div className="space-y-1"><Label className="text-xs">Font Size</Label>
                  <Select value={section.style.fontSize || '18px'} onValueChange={(v) => updateStyle({ fontSize: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{FONT_SIZES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label className="text-xs">Font Weight</Label>
                  <Select value={section.style.fontWeight || 'normal'} onValueChange={(v) => updateStyle({ fontWeight: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{FONT_WEIGHTS.map((w) => <SelectItem key={w} value={w}>{w.charAt(0).toUpperCase() + w.slice(1)}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label className="text-xs">Text Align</Label>
                  <div className="flex gap-1">
                    {TEXT_ALIGNS.map((align) => (
                      <Button key={align} variant={section.style.textAlign === align ? 'default' : 'outline'} size="sm" onClick={() => updateStyle({ textAlign: align })} className="flex-1">
                        {align === 'left' && <AlignLeft className="w-3 h-3" />}
                        {align === 'center' && <AlignCenter className="w-3 h-3" />}
                        {align === 'right' && <AlignRight className="w-3 h-3" />}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant={section.style.fontWeight === 'bold' || section.style.fontWeight === 'extrabold' ? 'default' : 'outline'} size="sm" onClick={() => updateStyle({ fontWeight: section.style.fontWeight === 'bold' ? 'normal' : 'bold' })}><Bold className="w-3 h-3" /></Button>
                  <Button variant={section.style.fontStyle === 'italic' ? 'default' : 'outline'} size="sm" onClick={() => updateStyle({ fontStyle: section.style.fontStyle === 'italic' ? 'normal' : 'italic' })}><Italic className="w-3 h-3" /></Button>
                </div>
              </div>
            </>
          )}

          {/* Colors */}
          {colorSections && (
            <>
              <Separator />
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Colors</h4>
              <div className="space-y-3">
                <div className="space-y-1"><Label className="text-xs">Background</Label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={section.style.backgroundColor || '#ffffff'} onChange={(e) => updateStyle({ backgroundColor: e.target.value })} className="w-8 h-8 rounded border cursor-pointer" />
                    <Input value={section.style.backgroundColor || '#ffffff'} onChange={(e) => updateStyle({ backgroundColor: e.target.value })} className="flex-1 font-mono text-xs" />
                  </div>
                </div>
                {['headline', 'body', 'banner', 'cta', 'form', 'hero', 'heroBg', 'heroVideoBg', 'heroVideo', 'heroImage', 'heroForm', 'features', 'testimonials', 'pricing', 'faq', 'stats', 'team', 'steps', 'comparison', 'benefits', 'cards', 'socialProof', 'newsletter', 'quote', 'footer', 'document', 'countdown', 'logo'].includes(section.type) && (
                  <div className="space-y-1"><Label className="text-xs">Text Color</Label>
                    <div className="flex gap-2 items-center">
                      <input type="color" value={section.style.textColor || '#1a1a1a'} onChange={(e) => updateStyle({ textColor: e.target.value })} className="w-8 h-8 rounded border cursor-pointer" />
                      <Input value={section.style.textColor || '#1a1a1a'} onChange={(e) => updateStyle({ textColor: e.target.value })} className="flex-1 font-mono text-xs" />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Spacing */}
          <Separator />
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Spacing</h4>
          <div className="space-y-2"><Label className="text-xs">Vertical Padding</Label>
            <Select value={section.style.paddingY || '32px'} onValueChange={(v) => updateStyle({ paddingY: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{PADDING_OPTIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {maxWidthSections.includes(section.type) && (
            <div className="space-y-2"><Label className="text-xs">Max Width</Label>
              <Select value={section.style.maxWidth || '100%'} onValueChange={(v) => updateStyle({ maxWidth: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['100%', '600px', '700px', '800px', '900px', '1000px', '1100px', '1200px'].map((w) => <SelectItem key={w} value={w}>{w}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
    </div>
  );
};

export default SectionProperties;
