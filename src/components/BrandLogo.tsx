import brandLogoImg from "@/assets/brand-logo.png";

const BrandLogo = ({ className = "h-8" }: { className?: string }) => {
  return (
    <img src={brandLogoImg} alt="Personalized Page" className={`object-contain ${className}`} />
  );
};

export default BrandLogo;
