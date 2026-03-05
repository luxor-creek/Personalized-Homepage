import brandLogoIcon from "@/assets/brand-logo.png";

const BrandLogo = ({ className = "h-8" }: { className?: string }) => {
  return (
<<<<<<< HEAD
    <div className={`flex items-center gap-1.5 ${className}`}>
      <img src="/logo.png" alt="Personalized Page" className="h-full w-auto object-contain" />
      <span className="font-semibold text-foreground text-lg">Personalized Page</span>
=======
    <div className={`flex items-center gap-2 ${className}`}>
      <img src={brandLogoIcon} alt="" className="h-full object-contain" />
      <span className="font-semibold text-foreground text-lg tracking-tight leading-none">
        Personalized<span className="text-primary">.</span>Page
      </span>
>>>>>>> b6e0a2839107cacca5253e5f52bb42854f450ee8
    </div>
  );
};

export default BrandLogo;
