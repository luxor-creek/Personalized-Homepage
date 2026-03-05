import clientLogosDefault from "@/assets/client-logos.png";

interface LogoCarouselProps {
  imageUrl?: string;
  title?: string;
}

const LogoCarousel = ({ imageUrl, title = "Trusted by public organizations nationwide" }: LogoCarouselProps) => {
  return (
    <section className="py-14 bg-secondary/20 border-y border-border/30">
      <div className="container mx-auto px-4 sm:px-6">
        <p className="text-center text-xs text-muted-foreground/70 uppercase tracking-widest font-medium mb-10">
          {title}
        </p>
        
        <div className="flex justify-center">
          <img 
            src={imageUrl || clientLogosDefault} 
            alt="Trusted by HP, ExxonMobil, Pittsburgh Police, Cenovus, North Central Texas Council of Governments, Ntrepid Intelligence, Novartis, Alameda County, Optum, Pulse Electronics, Harris Utilities, L3 Wescam" 
            className="max-w-full h-auto"
          />
        </div>
      </div>
    </section>
  );
};

export default LogoCarousel;
