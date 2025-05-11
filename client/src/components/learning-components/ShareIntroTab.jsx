import React from 'react';
import { Share2, MessageSquare, Heart, Users, Lightbulb, FlaskRound, BookOpen, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';

const ShareIntroTab = ({ navigate }) => {
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
                <Share2 className="h-24 w-24 text-orange-500" />
              </div>
            </div>
          </div>
          <div className="md:w-3/4">
            <h2 className="text-3xl font-bold mb-4 text-gray-800">{t('shareConnectWithLearners')}</h2>
            <p className="text-lg text-gray-600 mb-4">
              {t('joinVibrantCommunity')}
            </p>
            <p className="text-gray-600">
              {t('exchangeIdeas')}
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
                <Lightbulb className="h-6 w-6 text-amber-600" />
              </div>
              <CardTitle className="text-amber-700">{t('shareYourInsights')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">
              {t('postYourThoughts')}
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="outline" className="bg-orange-50">productivity</Badge>
              <Badge variant="outline" className="bg-orange-50">focus</Badge>
              <Badge variant="outline" className="bg-orange-50">memory</Badge>
              <Badge variant="outline" className="bg-orange-50">technique</Badge>
            </div>
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <Heart size={16} className="text-red-400" /> 
              <span>{t('likePosts')}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-orange-200 hover:border-orange-300 transition-all duration-300 shadow-md hover:shadow-xl transform hover:-translate-y-1 bg-gradient-to-br from-white via-white to-amber-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-amber-200 to-orange-100 p-3 rounded-full transform hover:scale-110 transition-transform duration-300">
                <FlaskRound className="h-6 w-6 text-orange-600" />
              </div>
              <CardTitle className="text-orange-700">{t('applyMethods')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">
              {t('discoverAndShare')}
            </p>
            <div className="mt-2 p-3 bg-amber-50 border border-amber-100 rounded-lg">
              <div className="flex items-center gap-2 text-amber-700 mb-2 font-medium">
                <FlaskRound size={18} /> {t('applicableLearningMethods')}
              </div>
              <p className="text-gray-600 text-sm">
                {t('seeAMethod')}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-orange-200 hover:border-orange-300 transition-all duration-300 shadow-md hover:shadow-xl transform hover:-translate-y-1 bg-gradient-to-br from-white via-white to-amber-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-amber-200 to-orange-100 p-3 rounded-full transform hover:scale-110 transition-transform duration-300">
                <BookOpen className="h-6 w-6 text-amber-600" />
              </div>
              <CardTitle className="text-amber-700">{t('learningResources')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">
              {t('shareValuableBooks')}
            </p>
            <div className="flex items-center gap-2 text-amber-600 font-medium">
              <ArrowRight size={16} /> 
              <span>{t('accessDirectLinks')}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-orange-200 hover:border-orange-300 transition-all duration-300 shadow-md hover:shadow-xl transform hover:-translate-y-1 bg-gradient-to-br from-white via-white to-amber-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-amber-200 to-orange-100 p-3 rounded-full transform hover:scale-110 transition-transform duration-300">
                <MessageSquare className="h-6 w-6 text-orange-600" />
              </div>
              <CardTitle className="text-orange-700">{t('engageDiscuss')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">
              {t('commentOnPosts')}
            </p>
            <div className="mt-2 p-3 bg-orange-50 border border-orange-100 rounded-lg">
              <div className="flex items-center gap-2 text-orange-700 mb-2 font-medium">
                <Users size={18} /> {t('communityDrivenLearning')}
              </div>
              <p className="text-gray-600 text-sm">
                {t('learnFaster')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CTA Section */}
      <div className="relative bg-white/90 backdrop-blur-sm p-8 border border-orange-200 shadow-lg hover:shadow-xl transition-all duration-500 rounded-xl text-center">
        <div className="inline-flex items-center justify-center p-2 bg-orange-100 rounded-full mb-4 animate-float">
          <Share2 className="h-8 w-8 text-orange-500" />
        </div>
        <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent pb-1">{t('readyToJoin')}</h3>
        <p className="text-lg text-gray-700 max-w-2xl mx-auto mb-6">
          {t('connectWithFellow')}
        </p>
        <Button
          className="bg-gradient-to-r from-orange-500 to-amber-600 text-white hover:from-orange-600 hover:to-amber-700 shadow-md hover:shadow-xl transform hover:scale-105 transition-all duration-300 px-8 py-3 text-lg"
          onClick={() => navigate('/share')}
        >
          <Share2 className="mr-2 h-5 w-5" />
          {t('exploreShareConnect')}
        </Button>
      </div>
    </div>
  );
};

export default ShareIntroTab; 