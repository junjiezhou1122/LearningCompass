import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Hero() {
  // Animation states
  const [isLoaded, setIsLoaded] = useState(false);
  const [floatingPosition, setFloatingPosition] = useState(0);
  const { t } = useLanguage();
  
  // Set loaded state after component mounts
  useEffect(() => {
    setIsLoaded(true);
    
    // Floating animation for the circles
    const floatingInterval = setInterval(() => {
      setFloatingPosition(prev => (prev + 1) % 100);
    }, 50);
    
    return () => clearInterval(floatingInterval);
  }, []);

  return (
    <section className="relative rounded-2xl overflow-hidden mb-8 bg-gradient-to-r from-[#f8fafc] to-[#eef2ff]">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute -left-10 top-10 w-36 h-36 bg-blue-200 rounded-full opacity-30 blur-xl transition-all duration-700 ease-in-out"
          style={{ 
            transform: `translate(${Math.sin(floatingPosition * 0.05) * 10}px, ${Math.cos(floatingPosition * 0.05) * 10}px)`,
            opacity: isLoaded ? 0.3 : 0
          }}
        ></div>
        <div 
          className="absolute right-10 bottom-10 w-48 h-48 bg-indigo-300 rounded-full opacity-20 blur-xl transition-all duration-700 ease-in-out" 
          style={{ 
            transform: `translate(${Math.cos(floatingPosition * 0.03) * 15}px, ${Math.sin(floatingPosition * 0.03) * 15}px)`,
            opacity: isLoaded ? 0.2 : 0
          }}
        ></div>
      </div>
      
      <div className="container mx-auto px-6 py-14 flex flex-col md:flex-row items-center justify-between relative z-10">
        {/* Left side content with entrance animation */}
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
        
        {/* Right side design element with animation */}
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
      </div>
    </section>
  );
}
