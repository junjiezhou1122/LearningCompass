import React, { createContext, useContext, useState, useEffect } from 'react';

// Available languages
export const LANGUAGES = {
  ENGLISH: 'en',
  CHINESE: 'zh'
};

// Create the language context
const LanguageContext = createContext({
  language: LANGUAGES.ENGLISH,
  setLanguage: () => {},
  t: (key) => key // Translation function
});

// Create a provider component
export const LanguageProvider = ({ children }) => {
  // Initialize language from localStorage or default to English
  const [language, setLanguage] = useState(() => {
    const savedLanguage = localStorage.getItem('language');
    return savedLanguage || LANGUAGES.ENGLISH;
  });

  // Update localStorage when language changes
  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  // Translations
  const translations = {
    [LANGUAGES.ENGLISH]: {
      // Header
      'resourcesHub': 'ResourcesHub',
      'share': 'Share & Connect',
      'searchPlaceholder': 'Search courses...',
      'recentSearches': 'Recent Searches',
      'profile': 'Profile',
      'bookmarks': 'Bookmarks', 
      'signOut': 'Sign Out',
      'myAccount': 'My Account',
      'signIn': 'Sign In',
      'register': 'Register',
      'showRecentSearches': 'Show Recent Searches',
      'hideRecentSearches': 'Hide Recent Searches',
      
      // Footer
      'aboutUs': 'About Us',
      'contactUs': 'Contact Us',
      'privacyPolicy': 'Privacy Policy',
      'termsOfService': 'Terms of Service',
      'copyright': '© 2024 Learning How to Learn. All rights reserved.',
      
      // Home/LearningHowToLearn
      'welcomeTitle': 'Welcome to Learning How to Learn',
      'welcomeSubtitle': 'Discover effective learning techniques and resources',
      'featuredCourses': 'Featured Courses',
      'popularCategories': 'Popular Categories',
      'viewAll': 'View All',
      'trendingTopics': 'Trending Topics',
      'latestPosts': 'Latest Posts',
      
      // AI Assistant
      'aiAssistant': 'AI Assistant',
      'sendMessage': 'Send message',
      'typeYourMessage': 'Type your message here...',
      'newChat': 'New Chat',
      'history': 'History',
      'settings': 'Settings',
      'apiConfiguration': 'API Configuration',
      'apiKey': 'API Key',
      'provider': 'Provider',
      'model': 'Model',
      'temperature': 'Temperature',
      'maxTokens': 'Max Tokens',
      'save': 'Save',
      'cancel': 'Cancel',
      
      // General UI
      'loading': 'Loading...',
      'noResults': 'No results found',
      'showMore': 'Show More',
      'language': 'Language',
      'english': 'English',
      'chinese': 'Chinese',
      'error': 'Error',
      'success': 'Success',
    },
    
    [LANGUAGES.CHINESE]: {
      // Header
      'resourcesHub': '资源中心',
      'share': '分享与连接',
      'searchPlaceholder': '搜索课程...',
      'recentSearches': '最近搜索',
      'profile': '个人资料',
      'bookmarks': '收藏', 
      'signOut': '退出登录',
      'myAccount': '我的账户',
      'signIn': '登录',
      'register': '注册',
      'showRecentSearches': '显示最近搜索',
      'hideRecentSearches': '隐藏最近搜索',
      
      // Footer
      'aboutUs': '关于我们',
      'contactUs': '联系我们',
      'privacyPolicy': '隐私政策',
      'termsOfService': '服务条款',
      'copyright': '© 2024 学习如何学习。保留所有权利。',
      
      // Home/LearningHowToLearn
      'welcomeTitle': '欢迎来到学习如何学习',
      'welcomeSubtitle': '发现有效的学习技巧和资源',
      'featuredCourses': '精选课程',
      'popularCategories': '热门类别',
      'viewAll': '查看全部',
      'trendingTopics': '热门话题',
      'latestPosts': '最新帖子',
      
      // AI Assistant
      'aiAssistant': 'AI 助手',
      'sendMessage': '发送消息',
      'typeYourMessage': '在此输入您的消息...',
      'newChat': '新对话',
      'history': '历史记录',
      'settings': '设置',
      'apiConfiguration': 'API 配置',
      'apiKey': 'API 密钥',
      'provider': '提供商',
      'model': '模型',
      'temperature': '温度',
      'maxTokens': '最大令牌数',
      'save': '保存',
      'cancel': '取消',
      
      // General UI
      'loading': '加载中...',
      'noResults': '未找到结果',
      'showMore': '显示更多',
      'language': '语言',
      'english': '英文',
      'chinese': '中文',
      'error': '错误',
      'success': '成功',
    }
  };

  // Translation function
  const translate = (key) => {
    if (!translations[language]) {
      console.warn(`No translations found for language: ${language}`);
      return key;
    }
    
    if (!translations[language][key]) {
      console.warn(`No translation found for key: ${key} in language: ${language}`);
      return key;
    }
    
    return translations[language][key];
  };

  // Context value
  const contextValue = {
    language,
    setLanguage,
    t: translate // Alias for translate function
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook for using the language context
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};