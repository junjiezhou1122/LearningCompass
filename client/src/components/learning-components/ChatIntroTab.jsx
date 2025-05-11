import React from 'react';
import { MessageSquare, Users, UserPlus, Send, Sparkles, Brain, Zap, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';

const ChatIntroTab = ({ navigate }) => {
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
                <MessageSquare className="h-24 w-24 text-orange-500" />
              </div>
            </div>
          </div>
          <div className="md:w-3/4">
            <h2 className="text-3xl font-bold mb-4 text-gray-800">{t('connectThroughChat')}</h2>
            <p className="text-lg text-gray-600 mb-4">
              {t('engageInRealTime')}
            </p>
            <p className="text-gray-600">
              {t('ourChatPlatform')}
            </p>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border border-orange-200 hover:border-orange-300 transition-all duration-300 shadow-md hover:shadow-xl transform hover:-translate-y-1 bg-gradient-to-br from-white via-white to-amber-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-amber-200 to-orange-100 p-3 rounded-full transform hover:scale-110 transition-transform duration-300">
                <UserPlus className="h-6 w-6 text-orange-600" />
              </div>
              <CardTitle className="text-orange-700">{t('directMessages')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">
              {t('connectOneOnOne')}
            </p>
            <div className="mt-2 bg-amber-50 rounded-lg p-4 border border-amber-100">
              <h4 className="font-medium text-orange-700 mb-2">{t('connectWithFollowers')}</h4>
              <p className="text-gray-600 text-sm">
                {t('easilyFind')}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-orange-200 hover:border-orange-300 transition-all duration-300 shadow-md hover:shadow-xl transform hover:-translate-y-1 bg-gradient-to-br from-white via-white to-amber-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-amber-200 to-orange-100 p-3 rounded-full transform hover:scale-110 transition-transform duration-300">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
              <CardTitle className="text-amber-700">{t('groupChats')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">
              {t('createAndJoin')}
            </p>
            <div className="mt-2 bg-amber-50 rounded-lg p-4 border border-amber-100">
              <h4 className="font-medium text-amber-700 mb-2">{t('studyGroupsMadeEasy')}</h4>
              <p className="text-gray-600 text-sm">
                {t('formVirtualStudy')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Features List Section */}
      <div className="bg-white/90 backdrop-blur-sm rounded-xl p-8 border border-orange-200 shadow-lg hover:shadow-xl transition-all duration-500">
        <h3 className="text-2xl font-bold mb-6 text-center bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent pb-1">{t('chatPlatformFeatures')}</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start gap-4">
            <div className="bg-orange-100 p-3 rounded-full h-12 w-12 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-orange-800 mb-1">{t('realTimeMessaging')}</h4>
              <p className="text-gray-600">
                {t('instantMessage')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="bg-amber-100 p-3 rounded-full h-12 w-12 flex items-center justify-center flex-shrink-0">
              <Brain className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-amber-800 mb-1">{t('learningFocused')}</h4>
              <p className="text-gray-600">
                {t('purposeBuilt')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="bg-orange-100 p-3 rounded-full h-12 w-12 flex items-center justify-center flex-shrink-0">
              <Shield className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-orange-800 mb-1">{t('privacyControls')}</h4>
              <p className="text-gray-600">
                {t('connectOnlyWith')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="bg-amber-100 p-3 rounded-full h-12 w-12 flex items-center justify-center flex-shrink-0">
              <Zap className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-amber-800 mb-1">{t('seamlessExperience')}</h4>
              <p className="text-gray-600">
                {t('modernIntuitive')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative bg-gradient-to-r from-orange-500 to-amber-600 rounded-xl p-8 text-white text-center shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full filter blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-300 rounded-full filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
        
        <div className="relative z-10">
          <div className="inline-flex items-center justify-center p-2 bg-white/20 rounded-full mb-4">
            <MessageSquare className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold mb-4">{t('readyToStartChatting')}</h3>
          <p className="text-lg mb-6 max-w-2xl mx-auto opacity-90">
            {t('joinConversations')}
          </p>
          <Button
            className="bg-white text-orange-600 hover:bg-orange-50 shadow-md hover:shadow-xl transform hover:scale-105 transition-all duration-300 px-8 py-3 text-lg"
            onClick={() => navigate('/chat')}
          >
            <Send className="mr-2 h-5 w-5" />
            {t('openChat')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatIntroTab; 