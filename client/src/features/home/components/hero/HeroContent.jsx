import { useLanguage } from "@/contexts/LanguageContext";

export default function HeroContent({ isLoaded }) {
  const { t } = useLanguage();
  
  return (
    <div 
      className="md:w-1/2 z-10 transition-all duration-700 ease-out"
      style={{ 
        opacity: isLoaded ? 1 : 0,
        transform: isLoaded ? 'translateX(0)' : 'translateX(-20px)' 
      }}
    >
      <h1 className="text-4xl md:text-5xl font-bold mb-5 text-gray-800 leading-tight">
        {t('discoverLearningPath')} <span className="text-[#4264f0] inline-block relative">
          <span className="absolute -bottom-1 left-0 w-full h-1 bg-[#4264f0]/30 rounded-full"></span>
        </span>
      </h1>
      <p className="text-lg mb-4 text-gray-600 max-w-md">
        {t('personalizedRecommendations')}
      </p>
    </div>
  );
}
