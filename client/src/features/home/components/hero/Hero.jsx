import AnimatedBackground from './AnimatedBackground';
import HeroContent from './HeroContent';
import HeroDesign from './HeroDesign';
import { useHeroAnimation } from './useHeroAnimation';

export default function Hero() {
  const { isLoaded, floatingPosition } = useHeroAnimation();
  
  return (
    <section className="relative rounded-2xl overflow-hidden mb-8 bg-gradient-to-r from-[#f8fafc] to-[#eef2ff]">
      {/* Animated background elements */}
      <AnimatedBackground isLoaded={isLoaded} floatingPosition={floatingPosition} />
      
      <div className="container mx-auto px-6 py-14 flex flex-col md:flex-row items-center justify-between relative z-10">
        {/* Left side content with entrance animation */}
        <HeroContent isLoaded={isLoaded} />
        
        {/* Right side design element with animation */}
        <HeroDesign isLoaded={isLoaded} floatingPosition={floatingPosition} />
      </div>
    </section>
  );
}
