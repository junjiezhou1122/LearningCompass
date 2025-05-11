import React from 'react';
import { Brain, GraduationCap, Sparkles, BookOpen, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const OverviewTab = ({ setActiveTab }) => {
  const { t } = useLanguage();
  
  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-br from-orange-100 via-amber-50 to-orange-50 rounded-xl p-8 border border-amber-100 shadow-lg hover:shadow-xl transition-all duration-500 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="md:w-1/4 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-200 rounded-full opacity-20 blur-xl transform scale-150"></div>
              <div className="relative">
                <Brain className="h-24 w-24 text-orange-500" />
              </div>
            </div>
          </div>
          <div className="md:w-3/4">
            <h2 className="text-3xl font-bold mb-4 text-gray-800">{t('masterArtOfLearning')}</h2>
            <p className="text-lg text-gray-600 mb-4">
              {t('welcomeToLearningJourney')}
            </p>
            <p className="text-gray-600">
              {t('ourMissionIs')}
            </p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="flex flex-col border border-orange-200 hover:border-orange-300 transition-all duration-300 shadow-md hover:shadow-xl transform hover:-translate-y-1 bg-gradient-to-br from-white via-white to-amber-50 overflow-hidden group relative">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-orange-400 to-amber-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
          <CardHeader className="relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-16 h-16 bg-orange-200 rounded-full opacity-20 animate-blob"></div>
            <div className="flex items-center gap-3 z-10 relative">
              <div className="bg-gradient-to-br from-orange-200 to-amber-100 p-3 rounded-full transform group-hover:scale-110 transition-transform duration-300 shadow-md">
                <GraduationCap className="h-6 w-6 text-orange-600 animate-pulse" />
              </div>
              <CardTitle className="text-orange-700 group-hover:text-orange-600 transition-all duration-300">{t('whyLearnHowToLearn')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex-grow z-10 relative">
            <p className="text-gray-700 group-hover:text-gray-800 transition-colors duration-300 mb-3">
              {t('learningHowToLearnIsValuable')}
            </p>
            <ul className="space-y-3 text-gray-700 group-hover:text-gray-800 transition-colors duration-300">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span><strong className="text-orange-700">{t('acceleratedSkillAcquisition')}</strong> - {t('masterNewSubjects')}</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span><strong className="text-orange-700">{t('betterRetention')}</strong> - {t('rememberLonger')}</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span><strong className="text-orange-700">{t('deeperUnderstanding')}</strong> - {t('comprehendComplex')}</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span><strong className="text-orange-700">{t('lifelongAdaptability')}</strong> - {t('stayRelevant')}</span>
              </li>
            </ul>
            <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-orange-200 rounded-full opacity-10 animate-blob animation-delay-2000"></div>
          </CardContent>
        </Card>

        <Card className="flex flex-col border border-orange-200 hover:border-orange-300 transition-all duration-300 shadow-md hover:shadow-xl transform hover:-translate-y-1 bg-gradient-to-br from-white via-white to-amber-50 overflow-hidden group relative animation-delay-300">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-500 to-orange-400 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
          <CardHeader className="relative overflow-hidden">
            <div className="absolute -left-6 -top-6 w-16 h-16 bg-orange-200 rounded-full opacity-20 animate-blob animation-delay-1000"></div>
            <div className="flex items-center gap-3 z-10 relative">
              <div className="bg-gradient-to-br from-amber-200 to-orange-100 p-3 rounded-full transform group-hover:scale-110 transition-transform duration-300 shadow-md">
                <Sparkles className="h-6 w-6 text-amber-600 animate-pulse animation-delay-500" />
              </div>
              <CardTitle className="text-amber-700 group-hover:text-amber-600 transition-all duration-300">{t('whatYoullDiscover')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex-grow z-10 relative">
            <p className="text-gray-700 group-hover:text-gray-800 transition-colors duration-300">
              {t('ourPlatformOffers')}
            </p>
            <ul className="mt-4 space-y-2 text-gray-700 group-hover:text-gray-800 transition-colors duration-300 animate-stagger">
              <li className="flex items-start gap-2">
                <div className="bg-orange-100 p-1 rounded-full mt-0.5 flex-shrink-0">
                  <Lightbulb className="h-3 w-3 text-orange-600" />
                </div>
                <span><strong className="text-orange-700">{t('learningTechniques')}:</strong> {t('masterProvenMethods')}</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="bg-orange-100 p-1 rounded-full mt-0.5 flex-shrink-0">
                  <GraduationCap className="h-3 w-3 text-orange-600" />
                </div>
                <span><strong className="text-orange-700">{t('learningCenter')}:</strong> {t('accessStructuredGuides')}</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="bg-orange-100 p-1 rounded-full mt-0.5 flex-shrink-0">
                  <Brain className="h-3 w-3 text-orange-600" />
                </div>
                <span><strong className="text-orange-700">{t('cognitiveInsights')}:</strong> {t('understandHowBrain')}</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="bg-orange-100 p-1 rounded-full mt-0.5 flex-shrink-0">
                  <BookOpen className="h-3 w-3 text-orange-600" />
                </div>
                <span><strong className="text-orange-700">{t('practicalExercises')}:</strong> {t('applyTechniques')}</span>
              </li>
            </ul>
            <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-amber-200 rounded-full opacity-10 animate-blob animation-delay-3000"></div>
          </CardContent>
        </Card>
      </div>
      
      <div className="relative rounded-xl overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-300/20 via-amber-300/20 to-orange-300/20 animate-pulse"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNIDEwLDEwIEMgMjAsMjAsODAsMjAsOTAsMTAgQyAxMDAsMCwxMDAsOTAsMTEwLDEwMCBDIDEyMCwxMTAsOTAsMTkwLDgwLDE4MCBDIDcwLDE3MCw4MCw5MCw3MCw4MCBDIDU1LDY1LDMwLDMwLDEwLDEwIFoiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNDksMTE1LDIyLDAuMikiIHN0cm9rZS13aWR0aD0iMiIvPjwvc3ZnPg==')] opacity-30"></div>
        <div className="relative bg-white/90 backdrop-blur-sm p-8 border border-orange-200 shadow-lg hover:shadow-xl transition-all duration-500 z-10">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center p-2 bg-orange-100 rounded-full mb-2 animate-float">
              <Lightbulb className="h-8 w-8 text-orange-500" />
            </div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent pb-1">{t('readyToTransform')}</h3>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              {t('startYourJourney')}
            </p>
            <div className="pt-2">
              <Button
                className="bg-gradient-to-r from-orange-500 to-amber-600 text-white hover:from-orange-600 hover:to-amber-700 shadow-md hover:shadow-xl transform hover:scale-105 transition-all duration-300 animate-bounce animation-delay-1000 animation-iteration-count-3 px-6 py-2 text-lg"
                onClick={() => setActiveTab("techniques")}
              >
                <Lightbulb className="mr-2 h-5 w-5" />
                {t('discoverLearningTechniques')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;