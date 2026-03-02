import { useEffect, useRef, useState } from "react";

interface TemplateMiniPreviewProps {
  slug: string;
  isBuilderTemplate?: boolean;
  thumbnailUrl?: string | null;
}

/**
 * Shows a fast static thumbnail if available, otherwise falls back to a
 * sandboxed iframe preview (lazy-loaded via IntersectionObserver).
 */
const TemplateMiniPreview = ({ slug, isBuilderTemplate, thumbnailUrl }: TemplateMiniPreviewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const hasThumbnail = !!thumbnailUrl && !imgError;

  // Lazy load: only mount iframe when card scrolls into view (skip if we have a thumbnail)
  useEffect(() => {
    if (hasThumbnail) return;
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasThumbnail]);

  const previewUrl = `/builder-preview/${slug}`;

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-muted">
      {hasThumbnail ? (
        <img
          src={thumbnailUrl!}
          alt="Template preview"
          className="w-full h-full object-cover object-top"
          loading="lazy"
          onError={() => setImgError(true)}
        />
      ) : isVisible ? (
        <>
          <div
            className="absolute inset-0 origin-top-left"
            style={{ transform: "scale(0.35)", width: "286%", height: "286%" }}
          >
            <iframe
              src={previewUrl}
              title="Template preview"
              sandbox="allow-same-origin allow-scripts"
              loading="lazy"
              className="w-full h-full border-0"
              style={{ pointerEvents: "none" }}
              onLoad={() => setLoaded(true)}
            />
          </div>
          {!loaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <div className="animate-pulse text-xs text-muted-foreground">Loading preview…</div>
            </div>
          )}
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <div className="animate-pulse text-xs text-muted-foreground">Loading preview…</div>
        </div>
      )}
    </div>
  );
};

export default TemplateMiniPreview;
