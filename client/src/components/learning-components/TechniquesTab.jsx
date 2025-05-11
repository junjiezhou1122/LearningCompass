import React from 'react';
import { Brain, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';

const TechniquesTab = () => {
  const { t } = useLanguage();
  
  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-100 via-amber-50 to-orange-50 p-8 border border-orange-200 shadow-lg">
        {/* Background elements */}
        <div className="absolute -z-10 top-0 right-0 w-96 h-96 bg-orange-300 rounded-full filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -z-10 bottom-0 left-0 w-96 h-96 bg-amber-300 rounded-full filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI3MCIgY3k9IjcwIiByPSIyIiBmaWxsPSJyZ2JhKDI0OSwxMTUsMjIsMC4xKSIvPjxjaXJjbGUgY3g9IjQwIiBjeT0iMzAiIHI9IjIiIGZpbGw9InJnYmEoMjQ5LDExNSwyMiwwLjEpIi8+PC9zdmc+')] opacity-20"></div>
        
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-orange-200 to-amber-100 rounded-full mb-6 shadow-md animate-float">
            <Brain className="h-10 w-10 text-orange-600" />
          </div>
          
          <h2 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent pb-2 animate-fadeIn">{t('learningTechniquesHeading')}</h2>
          <div className="h-1 w-32 bg-gradient-to-r from-orange-400 to-amber-400 rounded-full mx-auto mb-6"></div>
          
          <p className="text-lg text-gray-700 animate-fadeIn animation-delay-300 leading-relaxed max-w-2xl mx-auto">
            {t('discoverResearchBacked')}
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 animate-stagger">
        <Card className="transition-all duration-500 hover:-translate-y-3 hover:shadow-xl group overflow-hidden border-orange-200 shadow-md relative bg-gradient-to-br from-white via-white to-amber-50">
          <div className="absolute -z-10 -right-10 -bottom-10 w-40 h-40 bg-orange-200 rounded-full opacity-20 blur-xl"></div>
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-500 to-amber-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-700"></div>
          <CardHeader className="pb-2">
            <div className="relative w-16 h-16 mb-4 mx-auto">
              <div className="absolute inset-0 bg-orange-100 rounded-full filter blur-lg animate-pulse"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-amber-400 rounded-full flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg">
                <div className="relative z-10 text-white">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="group-hover:animate-bounce">
                    <path d="M12 6V12M12 12V18M12 12H18M12 12H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
            </div>
            <CardTitle className="text-center text-xl font-bold text-amber-800 group-hover:text-orange-600 transition-all duration-300">
              {t('pomodoroTechnique')}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center pb-4">
            <p className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">
              {t('pomodoroDescription')}
            </p>
            <div className="mt-6 grid grid-cols-4 gap-1">
              <div className="bg-orange-100 h-2 rounded-full group-hover:bg-orange-300 transition-colors duration-700"></div>
              <div className="bg-orange-100 h-2 rounded-full group-hover:bg-orange-300 transition-colors duration-700 animation-delay-300"></div>
              <div className="bg-orange-100 h-2 rounded-full group-hover:bg-orange-300 transition-colors duration-700 animation-delay-500"></div>
              <div className="bg-orange-100 h-2 rounded-full group-hover:bg-orange-300 transition-colors duration-700 animation-delay-700"></div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center py-4 bg-gradient-to-r from-orange-50 to-amber-50 group-hover:from-orange-100 group-hover:to-amber-100 transition-colors duration-300 border-t border-orange-100">
            <p className="text-sm font-medium text-orange-700 flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-orange-500" />
              {t('improvesFocusProductivity')}
            </p>
          </CardFooter>
        </Card>
        
        <Card className="transition-all duration-500 hover:-translate-y-3 hover:shadow-xl group overflow-hidden border-orange-200 shadow-md relative bg-gradient-to-br from-white via-white to-amber-50 animation-delay-100">
          <div className="absolute -z-10 -left-10 -bottom-10 w-40 h-40 bg-amber-200 rounded-full opacity-20 blur-xl"></div>
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-500 to-orange-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-700"></div>
          <CardHeader className="pb-2">
            <div className="relative w-16 h-16 mb-4 mx-auto">
              <div className="absolute inset-0 bg-orange-100 rounded-full filter blur-lg animate-pulse animation-delay-300"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-400 rounded-full flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg">
                <div className="relative z-10 text-white">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="group-hover:animate-pulse">
                    <path d="M12 8V12L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
            </div>
            <CardTitle className="text-center text-xl font-bold text-amber-800 group-hover:text-orange-600 transition-all duration-300">
              {t('spacedRepetition')}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center pb-4">
            <p className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">
              {t('spacedRepetitionDescription')}
            </p>
            <div className="mt-6 flex justify-center gap-2 items-center">
              <div className="h-4 w-4 bg-orange-100 rounded-full group-hover:bg-orange-300 transition-all duration-700 group-hover:scale-100 scale-75"></div>
              <div className="h-4 w-8 bg-orange-100 rounded-full group-hover:bg-orange-300 transition-all duration-700 animation-delay-300 group-hover:scale-100 scale-75"></div>
              <div className="h-4 w-12 bg-orange-100 rounded-full group-hover:bg-orange-300 transition-all duration-700 animation-delay-500 group-hover:scale-100 scale-75"></div>
              <div className="h-4 w-16 bg-orange-100 rounded-full group-hover:bg-orange-300 transition-all duration-700 animation-delay-700 group-hover:scale-100 scale-75"></div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center py-4 bg-gradient-to-r from-orange-50 to-amber-50 group-hover:from-orange-100 group-hover:to-amber-100 transition-colors duration-300 border-t border-orange-100">
            <p className="text-sm font-medium text-orange-700 flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-orange-500" />
              {t('bestForLongTerm')}
            </p>
          </CardFooter>
        </Card>
        
        <Card className="transition-all duration-500 hover:-translate-y-3 hover:shadow-xl group overflow-hidden border-orange-200 shadow-md relative bg-gradient-to-br from-white via-white to-amber-50 animation-delay-200">
          <div className="absolute -z-10 -right-10 -top-10 w-40 h-40 bg-orange-200 rounded-full opacity-20 blur-xl"></div>
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-500 to-amber-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-700"></div>
          <CardHeader className="pb-2">
            <div className="relative w-16 h-16 mb-4 mx-auto">
              <div className="absolute inset-0 bg-orange-100 rounded-full filter blur-lg animate-pulse animation-delay-600"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-amber-400 rounded-full flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg">
                <div className="relative z-10 text-white">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="group-hover:animate-bounce animation-delay-300">
                    <path d="M9.5 14.5L5.5 18.5M9.5 14.5L13.5 18.5M9.5 14.5L9.5 5.5M19.5 18.5L19.5 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </div>
            <CardTitle className="text-center text-xl font-bold text-amber-800 group-hover:text-orange-600 transition-all duration-300">
              {t('activeRecall')}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center pb-4">
            <p className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">
              {t('activeRecallDescription')}
            </p>
            <div className="mt-6 flex justify-center gap-1">
              <div className="relative w-12 h-3">
                <div className="absolute inset-0 bg-orange-100 rounded-md group-hover:bg-orange-300 transition-all duration-700 transform group-hover:scale-110"></div>
                <div className="absolute top-0 right-0 w-2 h-2 bg-orange-200 rounded-full group-hover:bg-orange-400 transition-all duration-700 animation-delay-500"></div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center py-4 bg-gradient-to-r from-orange-50 to-amber-50 group-hover:from-orange-100 group-hover:to-amber-100 transition-colors duration-300 border-t border-orange-100">
            <p className="text-sm font-medium text-orange-700 flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-orange-500" />
              {t('strengthensKnowledge')}
            </p>
          </CardFooter>
        </Card>
        
        <Card className="transition-all duration-500 hover:-translate-y-3 hover:shadow-xl group overflow-hidden border-orange-200 shadow-md relative bg-gradient-to-br from-white via-white to-amber-50 animation-delay-300">
          <div className="absolute -z-10 -left-10 -top-10 w-40 h-40 bg-amber-200 rounded-full opacity-20 blur-xl"></div>
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-500 to-orange-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-700"></div>
          <CardHeader className="pb-2">
            <div className="relative w-16 h-16 mb-4 mx-auto">
              <div className="absolute inset-0 bg-orange-100 rounded-full filter blur-lg animate-pulse animation-delay-900"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-400 rounded-full flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg">
                <div className="relative z-10 text-white">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="group-hover:animate-pulse animation-delay-500">
                    <path d="M12 4.5V19.5M12 4.5L6 10.5M12 4.5L18 10.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </div>
            <CardTitle className="text-center text-xl font-bold text-amber-800 group-hover:text-orange-600 transition-all duration-300">
              {t('feynmanTechnique')}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center pb-4">
            <p className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">
              {t('feynmanDescription')}
            </p>
            <div className="mt-6 flex justify-center gap-1 items-center">
              <div className="w-4 h-4 bg-orange-100 rounded-full group-hover:bg-orange-300 transition-all duration-700"></div>
              <div className="w-10 h-0.5 bg-orange-100 group-hover:bg-orange-300 transition-all duration-700 animation-delay-300"></div>
              <div className="w-4 h-4 bg-orange-100 rounded-full group-hover:bg-orange-300 transition-all duration-700 animation-delay-500"></div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center py-4 bg-gradient-to-r from-orange-50 to-amber-50 group-hover:from-orange-100 group-hover:to-amber-100 transition-colors duration-300 border-t border-orange-100">
            <p className="text-sm font-medium text-orange-700 flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-orange-500" />
              {t('deepensConceptual')}
            </p>
          </CardFooter>
        </Card>
      </div>
      
      <div className="text-center mt-8 animate-fadeIn animation-delay-700">
        <div className="inline-block bg-gradient-to-r from-orange-50 to-amber-50 p-6 rounded-xl border border-orange-100 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
          <p className="text-lg font-medium text-gray-800 mb-4">
            {t('combineTechniques')}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium">Memory</span>
            <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-medium">Focus</span>
            <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium">Comprehension</span>
            <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-medium">Retention</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechniquesTab;