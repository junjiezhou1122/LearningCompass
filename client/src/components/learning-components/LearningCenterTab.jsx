import React from 'react';
import { GraduationCap, School, Lightbulb, Compass, BookOpen, ArrowRight, Search, Filter, Database, BarChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';

const LearningCenterTab = ({ navigate }) => {
  const { t } = useLanguage();
  
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-orange-100 via-amber-50 to-orange-50 rounded-xl p-8 border border-amber-100 shadow-lg hover:shadow-xl transition-all duration-500 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="md:w-1/4 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-200 rounded-full opacity-20 blur-xl transform scale-150"></div>
              <div className="relative">
                <GraduationCap className="h-24 w-24 text-orange-500" />
              </div>
            </div>
          </div>
          <div className="md:w-3/4">
            <h2 className="text-3xl font-bold mb-4 text-gray-800">{t('welcomeToLearningCenter')}</h2>
            <p className="text-lg text-gray-600 mb-4">
              {t('comprehensiveHub')}
            </p>
            <p className="text-gray-600">
              {t('discoverEliteCourses')}
            </p>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border border-orange-200 hover:border-orange-300 transition-all duration-300 shadow-md hover:shadow-xl transform hover:-translate-y-1 bg-gradient-to-br from-white via-white to-amber-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-amber-200 to-orange-100 p-3 rounded-full transform hover:scale-110 transition-transform duration-300">
                <School className="h-6 w-6 text-orange-600" />
              </div>
              <CardTitle className="text-orange-700">{t('universityCourses')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">
              {t('accessPremiumCourses')}
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="outline" className="bg-orange-50">MIT</Badge>
              <Badge variant="outline" className="bg-orange-50">Stanford</Badge>
              <Badge variant="outline" className="bg-orange-50">Computer Science</Badge>
              <Badge variant="outline" className="bg-orange-50">Mathematics</Badge>
            </div>
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <Database size={16} className="text-orange-400" /> 
              <span>Over 10,000 courses from 50+ universities</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-orange-200 hover:border-orange-300 transition-all duration-300 shadow-md hover:shadow-xl transform hover:-translate-y-1 bg-gradient-to-br from-white via-white to-amber-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-amber-200 to-orange-100 p-3 rounded-full transform hover:scale-110 transition-transform duration-300">
                <Lightbulb className="h-6 w-6 text-amber-600" />
              </div>
              <CardTitle className="text-amber-700">{t('learningMethodsTitle')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">
              {t('discoverScienceBacked')}
            </p>
            <div className="mt-2 p-3 bg-amber-50 border border-amber-100 rounded-lg">
              <div className="flex items-center gap-2 text-amber-700 mb-2 font-medium">
                <BarChart size={18} /> {t('effectivenessRatings')}
              </div>
              <p className="text-gray-600 text-sm">
                {t('eachMethodIncludes')}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-orange-200 hover:border-orange-300 transition-all duration-300 shadow-md hover:shadow-xl transform hover:-translate-y-1 bg-gradient-to-br from-white via-white to-amber-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-amber-200 to-orange-100 p-3 rounded-full transform hover:scale-110 transition-transform duration-300">
                <Compass className="h-6 w-6 text-orange-600" />
              </div>
              <CardTitle className="text-orange-700">{t('learningTools')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">
              {t('findPerfectTools')}
            </p>
            <div className="flex items-center gap-2 text-orange-600 font-medium">
              <ArrowRight size={16} /> 
              <span>{t('filterByCategory')}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-orange-200 hover:border-orange-300 transition-all duration-300 shadow-md hover:shadow-xl transform hover:-translate-y-1 bg-gradient-to-br from-white via-white to-amber-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-amber-200 to-orange-100 p-3 rounded-full transform hover:scale-110 transition-transform duration-300">
                <BookOpen className="h-6 w-6 text-amber-600" />
              </div>
              <CardTitle className="text-amber-700">{t('personalizedRecommendationsTitle')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">
              {t('receiveTailored')}
            </p>
            <div className="mt-2 p-3 bg-amber-50 border border-amber-100 rounded-lg">
              <div className="flex items-center gap-2 text-amber-700 mb-2 font-medium">
                <Search size={18} /> {t('smartFiltering')}
              </div>
              <p className="text-gray-600 text-sm">
                {t('advancedSearch')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CTA Section */}
      <div className="relative bg-white/90 backdrop-blur-sm p-8 border border-orange-200 shadow-lg hover:shadow-xl transition-all duration-500 rounded-xl text-center">
        <div className="inline-flex items-center justify-center p-2 bg-orange-100 rounded-full mb-4 animate-float">
          <GraduationCap className="h-8 w-8 text-orange-500" />
        </div>
        <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent pb-1">{t('readyToEnhance')}</h3>
        <p className="text-lg text-gray-700 max-w-2xl mx-auto mb-6">
          {t('accessOurComprehensive')}
        </p>
        <Button
          className="bg-gradient-to-r from-orange-500 to-amber-600 text-white hover:from-orange-600 hover:to-amber-700 shadow-md hover:shadow-xl transform hover:scale-105 transition-all duration-300 px-8 py-3 text-lg"
          onClick={() => navigate && navigate('/learning-center')}
        >
          <GraduationCap className="mr-2 h-5 w-5" />
          {t('exploreLearningCenter')}
        </Button>
      </div>
    </div>
  );
};

export default LearningCenterTab;