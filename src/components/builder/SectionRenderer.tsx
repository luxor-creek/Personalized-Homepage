import { BuilderSection } from "@/types/builder";
import { useState, useEffect, useRef, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";

// Parallax hook — returns scroll offset for the section
const useParallax = (enabled: boolean) => {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  const handleScroll = useCallback(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const windowH = window.innerHeight;
    // Only compute when section is in viewport
    if (rect.bottom < 0 || rect.top > windowH) return;
    // Normalized: 0 when section enters bottom, 1 when exits top
    const progress = (windowH - rect.top) / (windowH + rect.height);
    setOffset((progress - 0.5) * 100); // range roughly -50 to 50
  }, []);

  useEffect(() => {
    if (!enabled) return;
    // Check both window scroll and parent iframe/container scroll
    const scrollTarget = ref.current?.closest('.overflow-auto, .overflow-y-auto') || window;
    scrollTarget.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => {
      scrollTarget.removeEventListener('scroll', handleScroll);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [enabled, handleScroll]);

  return { ref, offset };
};

interface SectionRendererProps {
  section: BuilderSection;
  isSelected?: boolean;
  onClick?: () => void;
  isPreview?: boolean;
  personalization?: Record<string, string>;
}

const applyPersonalization = (text: string | undefined, personalization?: Record<string, string>) => {
  if (!text || !personalization) return text || '';
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    // Check if the token is ALL CAPS — if so, look up the lowercase key and uppercase the result
    const isUpperCase = key === key.toUpperCase() && key !== key.toLowerCase();
    const lookupKey = isUpperCase ? key.toLowerCase() : key;
    // Support aliases: company_name -> company
    const resolved = personalization[lookupKey] 
      || (lookupKey === 'company_name' ? personalization['company'] : undefined)
      || (lookupKey === 'full_name' ? `${personalization['first_name'] || ''} ${personalization['last_name'] || ''}`.trim() : undefined)
      || '';
    return isUpperCase ? resolved.toUpperCase() : resolved;
  });
};

const parseVideoUrl = (url: string): string | null => {
  if (!url) return null;
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  const vimeoMatch = url.match(/(?:vimeo\.com\/)(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}?badge=0&autopause=0`;
  if (/^\d+$/.test(url)) return `https://player.vimeo.com/video/${url}?badge=0&autopause=0`;
  if (url.startsWith('http')) return url;
  return null;
};

const useCountdown = (targetDate: string) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, new Date(targetDate).getTime() - Date.now());
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);
  return timeLeft;
};

const SectionRenderer = ({ section, isSelected, onClick, isPreview, personalization }: SectionRendererProps) => {
  const { type, content, style } = section;
  const isHeroType = type.startsWith('hero');
  const parallaxEnabled = !!(content.parallax && isHeroType);
  const { ref: parallaxRef, offset: parallaxOffset } = useParallax(parallaxEnabled);

  // Parallax layer transform helpers
  const pxSlow = parallaxEnabled ? { transform: `translateY(${parallaxOffset * 0.3}px)`, transition: 'transform 0.1s linear' } : {};
  const pxMedium = parallaxEnabled ? { transform: `translateY(${parallaxOffset * 0.15}px)`, transition: 'transform 0.1s linear' } : {};
  const pxFast = parallaxEnabled ? { transform: `translateY(${parallaxOffset * 0.05}px)`, transition: 'transform 0.1s linear' } : {};

  const containerStyle: React.CSSProperties = {
    backgroundColor: style.backgroundColor,
    paddingTop: style.paddingY,
    paddingBottom: style.paddingY,
    paddingLeft: style.paddingX || '24px',
    paddingRight: style.paddingX || '24px',
  };

  const textStyle: React.CSSProperties = {
    color: style.textColor,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight as any,
    fontStyle: style.fontStyle,
    textAlign: style.textAlign as any,
  };

  const innerStyle: React.CSSProperties = {
    maxWidth: style.maxWidth || '100%',
    margin: '0 auto',
  };

  const wrapperClasses = `relative transition-all ${
    !isPreview ? 'cursor-pointer hover:outline hover:outline-2 hover:outline-primary/30' : ''
  } ${isSelected ? 'outline outline-2 outline-primary ring-2 ring-primary/20' : ''}`;

  // Sections that already have their own button logic
  const sectionsWithOwnButtons = ['hero', 'heroBg', 'heroVideoBg', 'cta', 'document', 'newsletter', 'heroForm', 'form', 'pricing', 'columns2', 'columns3'];

  const renderOptionalButton = () => {
    if (sectionsWithOwnButtons.includes(type)) return null;
    if (content.hideButton || !content.buttonText) return null;
    return (
      <div className="mt-6" style={{ textAlign: (style.textAlign as any) || 'center' }}>
        <a href={content.buttonLink || '#'} className="inline-flex items-center justify-center rounded-lg px-8 py-3 font-semibold transition-all hover:opacity-90" style={{ backgroundColor: style.buttonColor || '#6d54df', color: style.buttonTextColor || '#ffffff' }}>{content.buttonText}</a>
      </div>
    );
  };

  const renderContent = () => {
    switch (type) {
      case 'headline':
        return (
          <div style={containerStyle}>
            <h2 style={{ ...textStyle, ...innerStyle, lineHeight: 1.2 }}>
              {applyPersonalization(content.text, personalization)}
            </h2>
          </div>
        );

      case 'body':
        return (
          <div style={containerStyle}>
            <p style={{ ...textStyle, ...innerStyle, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
              {applyPersonalization(content.text, personalization)}
            </p>
          </div>
        );

      case 'video': {
        const embedUrl = parseVideoUrl(content.videoUrl || content.videoId || '');
        return (
          <div style={containerStyle}>
            <div style={innerStyle}>
              {embedUrl ? (
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <iframe src={embedUrl} className="absolute inset-0 w-full h-full rounded-lg" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen title="Video" />
                </div>
              ) : (
                <div className="w-full bg-muted rounded-lg flex items-center justify-center" style={{ paddingBottom: '56.25%', position: 'relative' }}>
                  <span className="absolute inset-0 flex items-center justify-center text-muted-foreground">Paste a YouTube, Vimeo, or video URL in properties</span>
                </div>
              )}
            </div>
          </div>
        );
      }

      case 'image': {
        const layout = content.imageLayout || 'single';
        const hasRow = layout === 'row' && (content.imageUrls || []).length > 0;
        const hasSingle = layout === 'single' && content.imageUrl;
        return (
          <div style={containerStyle}>
            <div style={innerStyle}>
              {hasSingle && <img src={content.imageUrl} alt="" className="w-full rounded-lg object-cover" style={{ borderRadius: style.borderRadius }} />}
              {hasRow && (
                <div className="flex gap-4 overflow-x-auto">
                  {(content.imageUrls || []).filter(Boolean).map((url, i) => (
                    <img key={i} src={url} alt="" className="rounded-lg object-cover flex-shrink-0" style={{ borderRadius: style.borderRadius, height: '240px' }} />
                  ))}
                </div>
              )}
              {!hasSingle && !hasRow && <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">Upload or paste an image URL</div>}
            </div>
          </div>
        );
      }

      case 'banner':
        return (
          <div style={{ ...containerStyle, position: 'relative', overflow: 'hidden' }}>
            {content.imageUrl && (
              <>
                <img src={content.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ backgroundColor: style.overlayColor, opacity: style.overlayOpacity }} />
              </>
            )}
            <div style={{ position: 'relative', zIndex: 1, ...innerStyle }} className="text-center">
              <h2 style={{ ...textStyle, lineHeight: 1.2, marginBottom: '16px' }}>{applyPersonalization(content.bannerText, personalization)}</h2>
              {content.bannerSubtext && <p style={{ color: style.textColor, opacity: 0.85, fontSize: '18px' }}>{applyPersonalization(content.bannerSubtext, personalization)}</p>}
            </div>
          </div>
        );

      case 'cta':
        return (
          <div style={containerStyle}>
            <div style={innerStyle} className="text-center">
              <h2 style={{ ...textStyle, lineHeight: 1.2, marginBottom: '32px' }}>{applyPersonalization(content.text, personalization)}</h2>
              <div className="flex gap-4 justify-center flex-wrap">
                {content.buttonText && !content.hideButton && (
                  <a href={content.buttonLink || '#'} className="inline-flex items-center justify-center rounded-lg px-8 py-3 font-semibold transition-all hover:opacity-90" style={{ backgroundColor: style.buttonColor, color: style.buttonTextColor }}>{content.buttonText}</a>
                )}
                {content.secondaryButtonText && !content.hideSecondaryButton && (
                  <a href={content.secondaryButtonLink || '#'} className="inline-flex items-center justify-center rounded-lg px-8 py-3 font-semibold border-2 transition-all hover:opacity-90" style={{ backgroundColor: style.secondaryButtonColor, color: style.secondaryButtonTextColor, borderColor: style.secondaryButtonTextColor }}>{content.secondaryButtonText}</a>
                )}
              </div>
            </div>
          </div>
        );

      case 'form':
        return (
          <div style={containerStyle}>
            <div style={{ ...innerStyle, maxWidth: style.maxWidth || '600px' }}>
              {content.formTitle && <h3 style={{ ...textStyle, fontSize: '28px', fontWeight: 'bold', marginBottom: '8px', textAlign: 'center' }}>{applyPersonalization(content.formTitle, personalization)}</h3>}
              {content.formSubtitle && <p style={{ color: style.textColor, opacity: 0.7, textAlign: 'center', marginBottom: '24px', fontSize: '16px' }}>{applyPersonalization(content.formSubtitle, personalization)}</p>}
              <div className="space-y-4">
                {(content.formFields || []).map((field, i) => (
                  <div key={i}>
                    <label className="block text-sm font-medium mb-1" style={{ color: style.textColor }}>{field}</label>
                    {field.toLowerCase() === 'message' ? (
                      <textarea className="w-full border rounded-lg px-4 py-3 bg-transparent resize-none" rows={4} placeholder={`Enter ${field.toLowerCase()}`} style={{ borderColor: style.textColor + '30', color: style.textColor }} disabled={isPreview} />
                    ) : (
                      <input type={field.toLowerCase().includes('email') ? 'email' : 'text'} className="w-full border rounded-lg px-4 py-3 bg-transparent" placeholder={`Enter ${field.toLowerCase()}`} style={{ borderColor: style.textColor + '30', color: style.textColor }} disabled={isPreview} />
                    )}
                  </div>
                ))}
                <button className="w-full rounded-lg px-8 py-3 font-semibold transition-all hover:opacity-90" style={{ backgroundColor: style.buttonColor, color: style.buttonTextColor }} disabled={isPreview}>{content.formButtonText || 'Submit'}</button>
              </div>
            </div>
          </div>
        );

      case 'logo':
        return (
          <div style={{ ...containerStyle, paddingTop: '16px', paddingBottom: '16px' }}>
            <div style={{ maxWidth: style.maxWidth || '1200px', margin: '0 auto', display: 'flex', alignItems: 'center' }}>
              {content.logoUrl ? (
                <img src={content.logoUrl} alt="Logo" style={{ height: style.height || '40px' }} className="object-contain" />
              ) : (
                <div className="h-10 w-36 bg-muted rounded flex items-center justify-center text-muted-foreground text-xs">Upload a logo</div>
              )}
            </div>
          </div>
        );

      case 'document':
        return (
          <div style={containerStyle}>
            <div style={{ ...innerStyle, maxWidth: style.maxWidth || '700px', textAlign: 'center' }}>
              {content.documentTitle && <h3 style={{ ...textStyle, fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>{applyPersonalization(content.documentTitle, personalization)}</h3>}
              {content.documentDescription && <p style={{ color: style.textColor, opacity: 0.7, marginBottom: '24px', fontSize: '16px' }}>{applyPersonalization(content.documentDescription, personalization)}</p>}
              {!content.hideButton && (
                content.documentUrl ? (
                  <a href={content.documentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg px-8 py-3 font-semibold transition-all hover:opacity-90" style={{ backgroundColor: style.buttonColor, color: style.buttonTextColor }}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    {content.documentButtonText || 'Download PDF'}
                  </a>
                ) : (
                  <button className="inline-flex items-center justify-center gap-2 rounded-lg px-8 py-3 font-semibold transition-all opacity-60 cursor-not-allowed" style={{ backgroundColor: style.buttonColor, color: style.buttonTextColor }} onClick={() => alert('This download resource is currently unavailable. Please let the sender know.')}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    {content.documentButtonText || 'Download PDF'}
                  </button>
                )
              )}
            </div>
          </div>
        );

      case 'spacer':
        return <div style={{ backgroundColor: style.backgroundColor, height: style.height || '48px' }} />;

      // === NEW SECTIONS ===

      case 'hero':
        return (
          <div style={{ ...containerStyle, overflow: parallaxEnabled ? 'hidden' : undefined }} ref={parallaxEnabled ? parallaxRef : undefined}>
            <div style={{ ...innerStyle, maxWidth: '1100px', textAlign: style.textAlign as any || 'center' }}>
              {content.heroBadge && <div style={pxSlow}><span className="inline-block rounded-full px-4 py-1 text-xs font-semibold mb-6" style={{ backgroundColor: (style.buttonColor || '#6d54df') + '20', color: style.buttonColor || '#6d54df' }}>{content.heroBadge}</span></div>}
              <div style={pxMedium}><h1 style={{ ...textStyle, lineHeight: 1.1, marginBottom: '24px' }}>{applyPersonalization(content.text, personalization)}</h1></div>
              {content.heroSubheadline && <div style={pxMedium}><p style={{ color: style.textColor, opacity: 0.75, fontSize: '20px', maxWidth: '700px', margin: '0 auto 40px', lineHeight: 1.6 }}>{applyPersonalization(content.heroSubheadline, personalization)}</p></div>}
              <div style={pxFast} className="flex gap-4 justify-center flex-wrap">
                {content.buttonText && !content.hideButton && <a href={content.buttonLink || '#'} className="inline-flex items-center justify-center rounded-lg px-8 py-3 font-semibold transition-all hover:opacity-90" style={{ backgroundColor: style.buttonColor, color: style.buttonTextColor }}>{content.buttonText}</a>}
                {content.secondaryButtonText && !content.hideSecondaryButton && <a href={content.secondaryButtonLink || '#'} className="inline-flex items-center justify-center rounded-lg px-8 py-3 font-semibold border-2 transition-all hover:opacity-90" style={{ borderColor: style.secondaryButtonTextColor, color: style.secondaryButtonTextColor }}>{content.secondaryButtonText}</a>}
              </div>
              {content.heroImageUrl && <div style={pxSlow}><img src={content.heroImageUrl} alt="" className="mt-12 mx-auto rounded-xl shadow-2xl max-w-full" /></div>}
            </div>
          </div>
        );

      case 'heroBg':
        return (
          <div ref={parallaxEnabled ? parallaxRef : undefined} style={{ ...containerStyle, position: 'relative', overflow: 'hidden', minHeight: '500px', display: 'flex', alignItems: 'center' }}>
            {content.imageUrl && (
              <>
                <img src={content.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" style={pxSlow} />
                <div className="absolute inset-0" style={{ backgroundColor: style.overlayColor || '#6d54df', opacity: style.overlayOpacity ?? 0.6 }} />
              </>
            )}
            <div style={{ ...innerStyle, maxWidth: '1100px', textAlign: style.textAlign as any || 'center', position: 'relative', zIndex: 1, width: '100%' }}>
              {content.heroBadge && <div style={pxSlow}><span className="inline-block rounded-full px-4 py-1 text-xs font-semibold mb-6" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: style.textColor || '#ffffff' }}>{content.heroBadge}</span></div>}
              <div style={pxMedium}><h1 style={{ ...textStyle, lineHeight: 1.1, marginBottom: '24px' }}>{applyPersonalization(content.text, personalization)}</h1></div>
              {content.heroSubheadline && <div style={pxMedium}><p style={{ color: style.textColor, opacity: 0.85, fontSize: '20px', maxWidth: '700px', margin: '0 auto 40px', lineHeight: 1.6 }}>{applyPersonalization(content.heroSubheadline, personalization)}</p></div>}
              <div style={pxFast} className="flex gap-4 justify-center flex-wrap">
                {content.buttonText && !content.hideButton && <a href={content.buttonLink || '#'} className="inline-flex items-center justify-center rounded-lg px-8 py-3 font-semibold transition-all hover:opacity-90" style={{ backgroundColor: style.buttonColor, color: style.buttonTextColor }}>{content.buttonText}</a>}
                {content.secondaryButtonText && !content.hideSecondaryButton && <a href={content.secondaryButtonLink || '#'} className="inline-flex items-center justify-center rounded-lg px-8 py-3 font-semibold border-2 transition-all hover:opacity-90" style={{ borderColor: style.secondaryButtonTextColor, color: style.secondaryButtonTextColor }}>{content.secondaryButtonText}</a>}
              </div>
            </div>
          </div>
        );

      case 'heroVideoBg': {
        const bgVideoUrl = content.videoUrl || '';
        const isDirectVideo = bgVideoUrl && (bgVideoUrl.endsWith('.mp4') || bgVideoUrl.endsWith('.webm') || bgVideoUrl.endsWith('.ogg') || bgVideoUrl.includes('.mp4') || bgVideoUrl.includes('.webm'));
        return (
          <div ref={parallaxEnabled ? parallaxRef : undefined} style={{ ...containerStyle, position: 'relative', overflow: 'hidden', minHeight: '500px', display: 'flex', alignItems: 'center' }}>
            {bgVideoUrl && isDirectVideo && (
              <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover" style={pxSlow}>
                <source src={bgVideoUrl} />
              </video>
            )}
            {bgVideoUrl && !isDirectVideo && (() => {
              const vimeoMatch = bgVideoUrl.match(/(?:vimeo\.com\/)(\d+)/);
              const vimeoId = vimeoMatch ? vimeoMatch[1] : (/^\d+$/.test(bgVideoUrl) ? bgVideoUrl : null);
              const ytMatch = bgVideoUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
              if (vimeoId) return <iframe src={`https://player.vimeo.com/video/${vimeoId}?background=1&autoplay=1&loop=1&byline=0&title=0&muted=1`} className="absolute inset-0 w-full h-full border-0" style={{ transform: `scale(1.2) ${parallaxEnabled ? `translateY(${parallaxOffset * 0.3}px)` : ''}` }} allow="autoplay; fullscreen" />;
              if (ytMatch) return <iframe src={`https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&mute=1&loop=1&playlist=${ytMatch[1]}&controls=0&showinfo=0&rel=0&modestbranding=1`} className="absolute inset-0 w-full h-full border-0" style={{ transform: `scale(1.2) ${parallaxEnabled ? `translateY(${parallaxOffset * 0.3}px)` : ''}` }} allow="autoplay; fullscreen" />;
              return null;
            })()}
            {!bgVideoUrl && (
              <div className="absolute inset-0 bg-muted flex items-center justify-center text-muted-foreground text-sm">Paste a video URL in properties</div>
            )}
            <div className="absolute inset-0" style={{ backgroundColor: style.overlayColor || '#000000', opacity: style.overlayOpacity ?? 0.5 }} />
            <div style={{ ...innerStyle, maxWidth: '1100px', textAlign: style.textAlign as any || 'center', position: 'relative', zIndex: 1, width: '100%' }}>
              {content.heroBadge && <div style={pxSlow}><span className="inline-block rounded-full px-4 py-1 text-xs font-semibold mb-6" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: style.textColor || '#ffffff' }}>{content.heroBadge}</span></div>}
              <div style={pxMedium}><h1 style={{ ...textStyle, lineHeight: 1.1, marginBottom: '24px' }}>{applyPersonalization(content.text, personalization)}</h1></div>
              {content.heroSubheadline && <div style={pxMedium}><p style={{ color: style.textColor, opacity: 0.85, fontSize: '20px', maxWidth: '700px', margin: '0 auto 40px', lineHeight: 1.6 }}>{applyPersonalization(content.heroSubheadline, personalization)}</p></div>}
              <div style={pxFast} className="flex gap-4 justify-center flex-wrap">
                {content.buttonText && !content.hideButton && <a href={content.buttonLink || '#'} className="inline-flex items-center justify-center rounded-lg px-8 py-3 font-semibold transition-all hover:opacity-90" style={{ backgroundColor: style.buttonColor, color: style.buttonTextColor }}>{content.buttonText}</a>}
                {content.secondaryButtonText && !content.hideSecondaryButton && <a href={content.secondaryButtonLink || '#'} className="inline-flex items-center justify-center rounded-lg px-8 py-3 font-semibold border-2 transition-all hover:opacity-90" style={{ borderColor: style.secondaryButtonTextColor, color: style.secondaryButtonTextColor }}>{content.secondaryButtonText}</a>}
              </div>
            </div>
          </div>
        );
      }

      case 'heroVideo': {
        const embedUrl = parseVideoUrl(content.videoUrl || content.videoId || '');
        return (
          <div ref={parallaxEnabled ? parallaxRef : undefined} style={{ ...containerStyle, overflow: parallaxEnabled ? 'hidden' : undefined }}>
            <div style={{ ...innerStyle, maxWidth: '1100px' }} className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div style={{ textAlign: 'left', ...pxMedium }}>
                <h1 style={{ ...textStyle, textAlign: 'left', lineHeight: 1.1, marginBottom: '20px' }}>{applyPersonalization(content.text, personalization)}</h1>
                {content.heroSubheadline && <p style={{ color: style.textColor, opacity: 0.75, fontSize: '18px', lineHeight: 1.6 }}>{applyPersonalization(content.heroSubheadline, personalization)}</p>}
              </div>
              <div style={pxSlow}>
                {embedUrl ? (
                  <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                    <iframe src={embedUrl} className="absolute inset-0 w-full h-full rounded-xl" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen title="Video" />
                  </div>
                ) : (
                  <div className="w-full bg-white/10 rounded-xl flex items-center justify-center" style={{ paddingBottom: '56.25%', position: 'relative' }}>
                    <span className="absolute inset-0 flex items-center justify-center text-sm" style={{ color: style.textColor, opacity: 0.5 }}>Paste a video URL in properties</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      }

      case 'heroImage':
        return (
          <div ref={parallaxEnabled ? parallaxRef : undefined} style={{ ...containerStyle, overflow: parallaxEnabled ? 'hidden' : undefined }}>
            <div style={{ ...innerStyle, maxWidth: '1100px' }} className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div style={{ textAlign: 'left', ...pxMedium }}>
                <h1 style={{ ...textStyle, textAlign: 'left', lineHeight: 1.1, marginBottom: '20px' }}>{applyPersonalization(content.text, personalization)}</h1>
                {content.heroSubheadline && <p style={{ color: style.textColor, opacity: 0.75, fontSize: '18px', lineHeight: 1.6 }}>{applyPersonalization(content.heroSubheadline, personalization)}</p>}
              </div>
              <div style={pxSlow}>
                {content.heroImageUrl ? (
                  <img src={content.heroImageUrl} alt="" className="w-full rounded-xl shadow-2xl object-cover" />
                ) : (
                  <div className="w-full h-64 bg-white/10 rounded-xl flex items-center justify-center text-sm" style={{ color: style.textColor, opacity: 0.5 }}>Upload or paste an image URL</div>
                )}
              </div>
            </div>
          </div>
        );

      case 'heroForm':
        return (
          <div ref={parallaxEnabled ? parallaxRef : undefined} style={{ ...containerStyle, overflow: parallaxEnabled ? 'hidden' : undefined }}>
            <div style={{ ...innerStyle, maxWidth: '1100px' }} className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div style={{ textAlign: 'left', ...pxMedium }}>
                <h1 style={{ ...textStyle, textAlign: 'left', lineHeight: 1.1, marginBottom: '20px' }}>{applyPersonalization(content.text, personalization)}</h1>
                {content.heroSubheadline && <p style={{ color: style.textColor, opacity: 0.75, fontSize: '18px', lineHeight: 1.6 }}>{applyPersonalization(content.heroSubheadline, personalization)}</p>}
              </div>
              <div style={pxSlow} className="bg-white/10 rounded-xl p-8 backdrop-blur-sm">
                {content.heroFormTitle && <h3 className="text-xl font-bold mb-6" style={{ color: style.textColor }}>{applyPersonalization(content.heroFormTitle, personalization)}</h3>}
                <div className="space-y-4">
                  {(content.heroFormFields || []).map((field, i) => (
                    <div key={i}>
                      <label className="block text-sm font-medium mb-1" style={{ color: style.textColor, opacity: 0.8 }}>{field}</label>
                      {field.toLowerCase() === 'message' ? (
                        <textarea className="w-full border rounded-lg px-4 py-3 bg-white/10 resize-none" rows={3} placeholder={`Enter ${field.toLowerCase()}`} style={{ borderColor: 'rgba(255,255,255,0.2)', color: style.textColor }} disabled={isPreview} />
                      ) : (
                        <input type={field.toLowerCase().includes('email') ? 'email' : 'text'} className="w-full border rounded-lg px-4 py-3 bg-white/10" placeholder={`Enter ${field.toLowerCase()}`} style={{ borderColor: 'rgba(255,255,255,0.2)', color: style.textColor }} disabled={isPreview} />
                      )}
                    </div>
                  ))}
                  <button className="w-full rounded-lg px-8 py-3 font-semibold transition-all hover:opacity-90" style={{ backgroundColor: style.buttonColor, color: style.buttonTextColor }} disabled={isPreview}>{content.heroFormButtonText || 'Get Started'}</button>
                </div>
              </div>
            </div>
          </div>
        );
      case 'features':
        return (
          <div style={containerStyle}>
            <div>
              <div className="grid gap-8" style={{ gridTemplateColumns: `repeat(${style.columns || 3}, 1fr)`, ...innerStyle }}>
                {(content.featureItems || []).map((item, i) => (
                  <div key={i} className="text-center p-6 rounded-xl" style={{ backgroundColor: style.backgroundColor === '#ffffff' ? '#f8fafc' : 'rgba(255,255,255,0.05)' }}>
                    <span className="text-3xl mb-4 block">{item.icon}</span>
                    <h4 className="font-semibold text-lg mb-2" style={{ color: style.textColor }}>{item.title}</h4>
                    <p className="text-sm leading-relaxed" style={{ color: style.textColor, opacity: 0.7 }}>{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'testimonials':
        return (
          <div style={containerStyle}>
            <div>
              <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${Math.min((content.testimonialItems || []).length, 3)}, 1fr)`, ...innerStyle }}>
                {(content.testimonialItems || []).map((item, i) => (
                  <div key={i} className="p-6 rounded-xl border" style={{ borderColor: (style.textColor || '#1a1a1a') + '15' }}>
                    <p className="text-base leading-relaxed mb-4" style={{ color: style.textColor }}>"{item.quote}"</p>
                    <div className="flex items-center gap-3">
                      {item.avatar ? (
                        <img src={item.avatar} alt={item.author} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm" style={{ backgroundColor: '#6d54df20', color: '#6d54df' }}>{item.author.charAt(0)}</div>
                      )}
                      <div>
                        <p className="font-semibold text-sm" style={{ color: style.textColor }}>{item.author}</p>
                        <p className="text-xs" style={{ color: style.textColor, opacity: 0.6 }}>{item.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'pricing':
        return (
          <div style={containerStyle}>
            <div style={{ ...innerStyle, textAlign: 'center' }}>
              {content.pricingTitle && <h2 className="text-3xl font-bold mb-2" style={{ color: style.textColor }}>{content.pricingTitle}</h2>}
              {content.pricingSubtitle && <p className="text-base mb-10" style={{ color: style.textColor, opacity: 0.6 }}>{content.pricingSubtitle}</p>}
              <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${Math.min((content.pricingItems || []).length, 3)}, 1fr)` }}>
                {(content.pricingItems || []).map((tier, i) => (
                  <div key={i} className="p-8 rounded-xl border-2 text-left" style={{ borderColor: tier.highlighted ? (style.accentColor || '#6d54df') : (style.textColor || '#1a1a1a') + '15', backgroundColor: tier.highlighted ? (style.accentColor || '#6d54df') + '08' : 'transparent' }}>
                    <p className="font-semibold text-lg mb-1" style={{ color: style.textColor }}>{tier.name}</p>
                    <p className="mb-4"><span className="text-4xl font-bold" style={{ color: style.textColor }}>{tier.price}</span>{tier.period && <span className="text-sm" style={{ color: style.textColor, opacity: 0.5 }}>{tier.period}</span>}</p>
                    <ul className="space-y-2 mb-6">
                      {tier.features.map((f, fi) => (
                        <li key={fi} className="flex items-center gap-2 text-sm" style={{ color: style.textColor }}>
                          <span style={{ color: style.accentColor || '#22c55e' }}>✓</span> {f}
                        </li>
                      ))}
                    </ul>
                    <button className="w-full rounded-lg px-6 py-3 font-semibold transition-all hover:opacity-90" style={{ backgroundColor: tier.highlighted ? style.buttonColor : 'transparent', color: tier.highlighted ? style.buttonTextColor : style.buttonColor, border: tier.highlighted ? 'none' : `2px solid ${style.buttonColor}` }}>{tier.buttonText || 'Choose Plan'}</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'faq':
        return (
          <div style={containerStyle}>
            <div style={innerStyle} className="space-y-4">
              {(content.faqItems || []).map((item, i) => (
                <details key={i} className="border rounded-lg p-4 group" style={{ borderColor: (style.textColor || '#1a1a1a') + '15' }}>
                  <summary className="font-semibold cursor-pointer list-none flex items-center justify-between" style={{ color: style.textColor }}>
                    {item.question}
                    <span className="text-lg ml-2" style={{ color: style.accentColor || '#6d54df' }}>+</span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed" style={{ color: style.textColor, opacity: 0.7 }}>{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        );

      case 'stats':
        return (
          <div style={containerStyle}>
            <div style={innerStyle} className="flex justify-center">
              <div className="grid gap-8" style={{ gridTemplateColumns: `repeat(${(content.statItems || []).length}, 1fr)` }}>
                {(content.statItems || []).map((stat, i) => (
                  <div key={i} className="text-center px-6">
                    <p className="text-4xl font-bold mb-1" style={{ color: style.accentColor || style.textColor }}>{stat.value}</p>
                    <p className="text-sm" style={{ color: style.textColor, opacity: 0.6 }}>{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'team':
        return (
          <div style={containerStyle}>
            <div style={{ ...innerStyle, textAlign: 'center' }}>
              {content.teamTitle && <h2 className="text-3xl font-bold mb-2" style={{ color: style.textColor }}>{content.teamTitle}</h2>}
              {content.teamSubtitle && <p className="text-base mb-10" style={{ color: style.textColor, opacity: 0.6 }}>{content.teamSubtitle}</p>}
              <div className="grid gap-8" style={{ gridTemplateColumns: `repeat(${Math.min((content.teamMembers || []).length, 4)}, 1fr)` }}>
                {(content.teamMembers || []).map((member, i) => (
                  <div key={i} className="text-center">
                    {member.imageUrl ? (
                      <img src={member.imageUrl} alt={member.name} className="w-24 h-24 rounded-full mx-auto mb-4 object-cover" />
                    ) : (
                      <div className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold" style={{ backgroundColor: '#6d54df20', color: '#6d54df' }}>{member.name.charAt(0)}</div>
                    )}
                    <p className="font-semibold" style={{ color: style.textColor }}>{member.name}</p>
                    <p className="text-sm" style={{ color: style.textColor, opacity: 0.6 }}>{member.role}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'logoCloud':
        return (
          <div style={containerStyle}>
            <div style={{ ...innerStyle, maxWidth: '1000px', textAlign: 'center' }}>
              {content.logoCloudTitle && <p className="text-sm font-medium uppercase tracking-wider mb-8" style={{ color: style.textColor }}>{content.logoCloudTitle}</p>}
              {(content.logoUrls || []).length > 0 ? (
                <div className="flex items-center justify-center gap-12 flex-wrap">
                  {(content.logoUrls || []).filter(Boolean).map((url, i) => (
                    <img key={i} src={url} alt="" className="h-8 object-contain opacity-50 hover:opacity-100 transition-opacity" />
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground py-4">Add partner/client logos in properties</div>
              )}
            </div>
          </div>
        );

      case 'newsletter':
        return (
          <div style={containerStyle}>
            <div style={{ ...innerStyle, maxWidth: style.maxWidth || '600px', textAlign: 'center' }}>
              {content.newsletterTitle && <h3 className="text-2xl font-bold mb-2" style={{ color: style.textColor }}>{applyPersonalization(content.newsletterTitle, personalization)}</h3>}
              {content.newsletterSubtitle && <p className="text-base mb-6" style={{ color: style.textColor, opacity: 0.7 }}>{applyPersonalization(content.newsletterSubtitle, personalization)}</p>}
              <div className="flex gap-3 max-w-md mx-auto">
                <input type="email" className="flex-1 border rounded-lg px-4 py-3 bg-transparent" placeholder={content.newsletterPlaceholder || 'Enter your email'} style={{ borderColor: style.textColor + '30', color: style.textColor }} disabled={isPreview} />
                {!content.hideButton && <button className="rounded-lg px-6 py-3 font-semibold transition-all hover:opacity-90 whitespace-nowrap" style={{ backgroundColor: style.buttonColor, color: style.buttonTextColor }} disabled={isPreview}>{content.newsletterButtonText || 'Subscribe'}</button>}
              </div>
            </div>
          </div>
        );

      case 'comparison':
        return (
          <div style={containerStyle}>
            <div style={innerStyle}>
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left p-3 text-sm font-semibold" style={{ color: style.textColor }}>Feature</th>
                    <th className="text-center p-3 text-sm font-semibold" style={{ color: style.accentColor || '#6d54df' }}>{content.comparisonHeaderA || 'Us'}</th>
                    <th className="text-center p-3 text-sm font-semibold" style={{ color: style.textColor, opacity: 0.5 }}>{content.comparisonHeaderB || 'Others'}</th>
                  </tr>
                </thead>
                <tbody>
                  {(content.comparisonRows || []).map((row, i) => (
                    <tr key={i} className="border-t" style={{ borderColor: (style.textColor || '#1a1a1a') + '10' }}>
                      <td className="p-3 text-sm" style={{ color: style.textColor }}>{row.feature}</td>
                      <td className="p-3 text-sm text-center font-medium" style={{ color: style.accentColor || '#22c55e' }}>{row.optionA}</td>
                      <td className="p-3 text-sm text-center" style={{ color: style.textColor, opacity: 0.5 }}>{row.optionB}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'steps':
        return (
          <div style={containerStyle}>
            <div style={{ ...innerStyle, textAlign: 'center' }}>
              {content.stepsTitle && <h2 className="text-3xl font-bold mb-2" style={{ color: style.textColor }}>{content.stepsTitle}</h2>}
              {content.stepsSubtitle && <p className="text-base mb-10" style={{ color: style.textColor, opacity: 0.6 }}>{content.stepsSubtitle}</p>}
              <div className="space-y-8 text-left max-w-lg mx-auto">
                {(content.stepItems || []).map((step, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0" style={{ backgroundColor: (style.accentColor || '#6d54df') + '15', color: style.accentColor || '#6d54df' }}>{i + 1}</div>
                    <div>
                      <h4 className="font-semibold mb-1" style={{ color: style.textColor }}>{step.title}</h4>
                      <p className="text-sm" style={{ color: style.textColor, opacity: 0.7 }}>{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'gallery':
        return (
          <div style={containerStyle}>
            <div style={innerStyle}>
              {(content.galleryUrls || []).length > 0 ? (
                <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${content.galleryColumns || 3}, 1fr)` }}>
                  {(content.galleryUrls || []).filter(Boolean).map((url, i) => (
                    <img key={i} src={url} alt="" className="w-full h-48 object-cover rounded-lg" style={{ borderRadius: style.borderRadius }} />
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">Add images in properties to create a gallery</div>
              )}
            </div>
          </div>
        );

      case 'footer':
        return (
          <div style={containerStyle}>
            <div style={{ ...innerStyle, maxWidth: '1100px' }}>
              <div className="grid gap-8" style={{ gridTemplateColumns: `repeat(${Math.max((content.footerColumns || []).length, 2)}, 1fr)` }}>
                {(content.footerColumns || []).map((col, i) => (
                  <div key={i}>
                    <p className="font-semibold text-sm mb-3" style={{ color: '#ffffff' }}>{col.title}</p>
                    <ul className="space-y-2">
                      {col.links.map((link, li) => (
                        <li key={li}><a href={link.url} className="text-sm hover:underline" style={{ color: style.textColor }}>{link.label}</a></li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              {content.footerCopyright && <p className="mt-8 pt-6 text-xs border-t" style={{ color: style.textColor, borderColor: 'rgba(255,255,255,0.1)' }}>{content.footerCopyright}</p>}
            </div>
          </div>
        );

      case 'divider':
        return (
          <div style={{ ...containerStyle, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {content.dividerStyle === 'gradient' ? (
              <div className="h-px w-full max-w-lg" style={{ background: `linear-gradient(to right, transparent, ${style.accentColor || '#e2e8f0'}, transparent)` }} />
            ) : (
              <hr className="w-full max-w-lg border-0" style={{ borderTop: `2px ${content.dividerStyle || 'solid'} ${style.accentColor || '#e2e8f0'}` }} />
            )}
          </div>
        );

      case 'quote':
        return (
          <div style={containerStyle}>
            <div style={{ ...innerStyle, textAlign: 'center' }}>
              <div className="text-5xl mb-4" style={{ color: style.accentColor || '#6d54df', opacity: 0.3 }}>"</div>
              <blockquote className="mb-4" style={{ ...textStyle, fontStyle: 'italic', lineHeight: 1.6 }}>{applyPersonalization(content.quoteText, personalization)}</blockquote>
              {content.quoteAuthor && <p className="font-semibold text-sm" style={{ color: style.textColor }}>{content.quoteAuthor}</p>}
              {content.quoteRole && <p className="text-xs" style={{ color: style.textColor, opacity: 0.5 }}>{content.quoteRole}</p>}
            </div>
          </div>
        );

      case 'countdown': {
        return <CountdownRenderer section={section} containerStyle={containerStyle} innerStyle={innerStyle} personalization={personalization} />;
      }

      case 'socialProof':
        return (
          <div style={containerStyle}>
            <div style={{ ...innerStyle, maxWidth: '900px', textAlign: 'center' }}>
              {content.socialProofTitle && <p className="text-sm font-medium uppercase tracking-wider mb-8" style={{ color: style.textColor, opacity: 0.6 }}>{content.socialProofTitle}</p>}
              <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${(content.socialProofItems || []).length}, 1fr)` }}>
                {(content.socialProofItems || []).map((item, i) => (
                  <div key={i} className="text-center">
                    <p className="text-3xl font-bold mb-1" style={{ color: style.accentColor || style.textColor }}>{item.count}</p>
                    <p className="text-sm font-medium" style={{ color: style.textColor }}>{item.label}</p>
                    <p className="text-xs mt-1" style={{ color: style.textColor, opacity: 0.4 }}>{item.platform}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'benefits':
        return (
          <div style={containerStyle}>
            <div style={{ ...innerStyle, textAlign: 'center' }}>
              {content.benefitsTitle && <h2 className="text-3xl font-bold mb-2" style={{ color: style.textColor }}>{content.benefitsTitle}</h2>}
              {content.benefitsSubtitle && <p className="text-base mb-8" style={{ color: style.textColor, opacity: 0.6 }}>{content.benefitsSubtitle}</p>}
              <ul className="space-y-3 text-left max-w-md mx-auto">
                {(content.benefitItems || []).map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-base" style={{ color: style.textColor }}>
                    <span className="text-lg" style={{ color: style.accentColor || '#22c55e' }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );

      case 'cards':
        return (
          <div style={containerStyle}>
            <div style={{ ...innerStyle, textAlign: 'center' }}>
              {content.cardsTitle && <h2 className="text-3xl font-bold mb-10" style={{ color: style.textColor }}>{content.cardsTitle}</h2>}
              <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${style.columns || 3}, 1fr)` }}>
                {(content.cardItems || []).map((card, i) => (
                  <div key={i} className="rounded-xl overflow-hidden border text-left" style={{ borderColor: (style.textColor || '#1a1a1a') + '10' }}>
                    {card.imageUrl && <img src={card.imageUrl} alt="" className="w-full h-40 object-cover" />}
                    <div className="p-6">
                      <h4 className="font-semibold text-lg mb-2" style={{ color: style.textColor }}>{card.title}</h4>
                      <p className="text-sm leading-relaxed" style={{ color: style.textColor, opacity: 0.7 }}>{card.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'qrCode':
        return (
          <div style={containerStyle}>
            <div style={{ ...innerStyle, maxWidth: '600px', textAlign: 'center' }}>
              {content.qrCodeLabel && <p className="text-sm font-medium mb-4" style={{ color: style.textColor }}>{applyPersonalization(content.qrCodeLabel, personalization)}</p>}
              <div className="inline-block p-4 bg-white rounded-xl">
                <QRCodeSVG
                  value={applyPersonalization(content.qrCodeUrl, personalization) || 'https://example.com'}
                  size={content.qrCodeSize || 200}
                  level="M"
                />
              </div>
              {!isPreview && !content.qrCodeUrl && (
                <p className="text-xs text-muted-foreground mt-3">Set a URL in properties to generate the QR code</p>
              )}
            </div>
          </div>
        );

      case 'calendarBooking': {
        const calUrl = applyPersonalization(content.calendarUrl || '', personalization);
        const calTitle = applyPersonalization(content.calendarTitle || 'Book a VIP Appointment', personalization);
        const calSubtitle = applyPersonalization(content.calendarSubtitle || '', personalization);
        const calButtonText = applyPersonalization(content.calendarButtonText || 'Book Now', personalization);
        const isCalendly = content.calendarProvider === 'calendly' && calUrl && calUrl.includes('calendly.com');

        return (
          <div style={containerStyle}>
            <div style={{ ...innerStyle, maxWidth: '800px', textAlign: style.textAlign || 'center' }}>
              {calTitle && (
                <h2 style={{ color: style.textColor, fontSize: '32px', fontWeight: 'bold', marginBottom: '8px', lineHeight: 1.2 }}>
                  {calTitle}
                </h2>
              )}
              {calSubtitle && (
                <p style={{ color: style.textColor, opacity: 0.75, fontSize: '18px', marginBottom: '32px', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' }}>
                  {calSubtitle}
                </p>
              )}
              {isCalendly && isPreview ? (
                <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.1)', background: '#ffffff' }}>
                  <iframe
                    src={calUrl}
                    style={{ width: '100%', height: '660px', border: 'none' }}
                    title="Book an appointment"
                  />
                </div>
              ) : calUrl ? (
                <a
                  href={calUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '14px 32px',
                    backgroundColor: style.buttonColor || '#6d54df',
                    color: style.buttonTextColor || '#ffffff',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '16px',
                    textDecoration: 'none',
                    cursor: 'pointer',
                    transition: 'opacity 0.15s',
                  }}
                  onClick={(e) => { if (!isPreview) e.preventDefault(); }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  {calButtonText}
                </a>
              ) : !isPreview ? (
                <div style={{ padding: '40px', border: '2px dashed #d1d5db', borderRadius: '12px', color: '#9ca3af' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 12px' }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  <p style={{ fontSize: '14px' }}>Add your calendar booking URL in properties</p>
                </div>
              ) : null}
            </div>
          </div>
        );
      }

      case 'columns2':
      case 'columns3': {
        const colCount = type === 'columns2' ? 2 : 3;
        const children = content.columnChildren || Array.from({ length: colCount }, () => []);
        return (
          <div style={containerStyle}>
            <div style={{ ...innerStyle, maxWidth: style.maxWidth || '1100px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${colCount}, 1fr)`, gap: '24px' }}>
                {Array.from({ length: colCount }).map((_, colIdx) => {
                  const colSections = (children[colIdx] || []) as BuilderSection[];
                  return (
                    <div
                      key={colIdx}
                      className="min-h-[60px] rounded-lg"
                      style={{
                        border: !isPreview && colSections.length === 0 ? '2px dashed #d1d5db' : 'none',
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      {colSections.length === 0 && !isPreview && (
                        <div className="flex items-center justify-center h-full text-xs text-muted-foreground p-4">
                          Column {colIdx + 1} — add content in properties
                        </div>
                      )}
                      {colSections.map((childSection) => (
                        <SectionRenderer
                          key={childSection.id}
                          section={childSection}
                          isPreview={isPreview}
                          personalization={personalization}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className={wrapperClasses} onClick={onClick}>
      {renderContent()}
      {renderOptionalButton()}
      {isSelected && !isPreview && (
        <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded font-medium z-10">
          {type}
        </div>
      )}
    </div>
  );
};

// Separate component for countdown to use hooks
const CountdownRenderer = ({ section, containerStyle, innerStyle, personalization }: { section: BuilderSection; containerStyle: React.CSSProperties; innerStyle: React.CSSProperties; personalization?: Record<string, string> }) => {
  const { content, style } = section;
  const timeLeft = useCountdown(content.countdownDate || new Date().toISOString());
  const boxStyle: React.CSSProperties = { backgroundColor: (style.accentColor || '#6d54df') + '20', color: style.textColor, borderRadius: '12px', padding: '16px 20px', textAlign: 'center', minWidth: '80px' };

  return (
    <div style={containerStyle}>
      <div style={{ ...innerStyle, maxWidth: '700px', textAlign: 'center' }}>
        {content.countdownTitle && <h3 className="text-2xl font-bold mb-2" style={{ color: style.textColor }}>{applyPersonalization(content.countdownTitle, personalization)}</h3>}
        {content.countdownSubtitle && <p className="text-base mb-8" style={{ color: style.textColor, opacity: 0.7 }}>{applyPersonalization(content.countdownSubtitle, personalization)}</p>}
        <div className="flex gap-4 justify-center">
          {[
            { v: timeLeft.days, l: 'Days' },
            { v: timeLeft.hours, l: 'Hours' },
            { v: timeLeft.minutes, l: 'Minutes' },
            { v: timeLeft.seconds, l: 'Seconds' },
          ].map(({ v, l }) => (
            <div key={l} style={boxStyle}>
              <p className="text-3xl font-bold">{String(v).padStart(2, '0')}</p>
              <p className="text-xs mt-1 opacity-60">{l}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SectionRenderer;
