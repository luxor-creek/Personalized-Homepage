import brandLogoIcon from "@/assets/brand-logo.png";

const BrandLogo = ({ className = "h-8" }: { className?: string }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img src={brandLogoIcon} alt="" className="h-full object-contain" />
      <span className="font-semibold text-foreground text-lg tracking-tight leading-none">
        Personalized<span className="text-primary">.</span>Page
      </span>
    </div>
  );
};

export default BrandLogo;
