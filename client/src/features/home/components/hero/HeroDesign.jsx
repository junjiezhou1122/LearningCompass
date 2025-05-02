import { useLanguage } from "@/contexts/LanguageContext";

export default function HeroDesign({ isLoaded, floatingPosition }) {
  const { t } = useLanguage();
  
  return (
    <div 
      className="md:w-1/2 flex justify-center mt-8 md:mt-0 transition-all duration-700 ease-out"
      style={{ 
        opacity: isLoaded ? 1 : 0,
        transform: isLoaded ? 'translateY(0)' : 'translateY(20px)' 
      }}
    >
      <div className="relative">
        <div 
          className="absolute -top-6 -right-6 w-32 h-32 bg-[#4264f0]/10 rounded-full transition-all duration-2000 ease-in-out"
          style={{ 
            transform: `translate(${Math.sin(floatingPosition * 0.02) * 5}px, ${Math.cos(floatingPosition * 0.02) * 5}px)`
          }}
        ></div>
        <div 
          className="absolute bottom-6 -left-6 w-24 h-24 bg-[#4264f0]/20 rounded-full transition-all duration-2000 ease-in-out"
          style={{ 
            transform: `translate(${Math.cos(floatingPosition * 0.02) * 5}px, ${Math.sin(floatingPosition * 0.02) * 5}px)`
          }}
        ></div>
        <div className="relative bg-white rounded-2xl p-8 md:p-10 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
            {t('learnGrowSucceed')}
          </h2>
          <div className="mt-4 w-20 h-1.5 bg-[#4264f0] rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
