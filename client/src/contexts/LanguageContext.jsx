import React, { createContext, useContext, useState, useEffect } from 'react';

// Define available languages
export const LANGUAGES = {
  ENGLISH: 'en',
  CHINESE: 'zh',
};

// Define translations
const translations = {
  [LANGUAGES.ENGLISH]: {
    searchPlaceholder: 'Search courses...',
    resourcesHub: 'ResourcesHub',
    shareConnect: 'Share & Connect',
    recentSearches: 'Recent Searches',
    profile: 'Profile',
    bookmarks: 'Bookmarks',
    signOut: 'Sign Out',
    myAccount: 'My Account',
    hide: 'Hide',
    show: 'Show',
    english: 'English',
    chinese: 'Chinese',
    learningHowToLearn: 'Learning How to Learn',
    // AI Assistant related translations
    chatWithAI: 'Chat with AI',
    sendMessage: 'Send Message',
    typeYourMessage: 'Type your message...',
    newChat: 'New Chat',
    history: 'History',
    apiSettings: 'API Settings',
    selectModel: 'Select Model',
    temperature: 'Temperature',
    maxTokens: 'Max Tokens',
    provider: 'Provider',
    openAI: 'OpenAI',
    anthropic: 'Anthropic',
    openRouter: 'OpenRouter',
    apiKey: 'API Key',
    baseUrl: 'Base URL (Optional)',
    customModelId: 'Custom Model ID',
    save: 'Save',
    cancel: 'Cancel',
    configure: 'Configure',
    openAIModels: 'OpenAI Models',
    anthropicModels: 'Anthropic Models',
    openRouterModels: 'OpenRouter Models',
    settings: 'Settings',
    assistant: 'Assistant',
    saveConversation: 'Save Conversation',
    deleteConversation: 'Delete Conversation',
    conversations: 'Conversations',
    noConversations: 'No conversations yet',
    startChatting: 'Start chatting now!',
    conversationTitle: 'Conversation Title',
    renameConversation: 'Rename Conversation',
    loadingModels: 'Loading models...',
    // Errors
    errorOccurred: 'An error occurred',
    pleaseEnterMessage: 'Please enter a message',
    pleaseEnterAPIKey: 'Please enter an API Key',
    pleaseSelectProvider: 'Please select a provider',
    pleaseSelectModel: 'Please select a model',
  },
  [LANGUAGES.CHINESE]: {
    searchPlaceholder: '搜索课程...',
    resourcesHub: '资源中心',
    shareConnect: '分享与连接',
    recentSearches: '最近搜索',
    profile: '个人资料',
    bookmarks: '收藏',
    signOut: '退出登录',
    myAccount: '我的账户',
    hide: '隐藏',
    show: '显示',
    english: '英语',
    chinese: '中文',
    learningHowToLearn: '学习如何学习',
    // AI Assistant related translations
    chatWithAI: '与AI聊天',
    sendMessage: '发送消息',
    typeYourMessage: '输入您的消息...',
    newChat: '新对话',
    history: '历史记录',
    apiSettings: 'API设置',
    selectModel: '选择模型',
    temperature: '温度',
    maxTokens: '最大令牌数',
    provider: '提供商',
    openAI: 'OpenAI',
    anthropic: 'Anthropic',
    openRouter: 'OpenRouter',
    apiKey: 'API密钥',
    baseUrl: '基础URL（可选）',
    customModelId: '自定义模型ID',
    save: '保存',
    cancel: '取消',
    configure: '配置',
    openAIModels: 'OpenAI模型',
    anthropicModels: 'Anthropic模型',
    openRouterModels: 'OpenRouter模型',
    settings: '设置',
    assistant: '助手',
    saveConversation: '保存对话',
    deleteConversation: '删除对话',
    conversations: '对话列表',
    noConversations: '暂无对话',
    startChatting: '立即开始聊天！',
    conversationTitle: '对话标题',
    renameConversation: '重命名对话',
    loadingModels: '加载模型中...',
    // Errors
    errorOccurred: '发生错误',
    pleaseEnterMessage: '请输入消息',
    pleaseEnterAPIKey: '请输入API密钥',
    pleaseSelectProvider: '请选择提供商',
    pleaseSelectModel: '请选择模型',
  },
};

// Create the context
const LanguageContext = createContext();

// Create a provider component
export function LanguageProvider({ children }) {
  // Get the language from localStorage or default to English
  const [language, setLanguage] = useState(() => {
    const savedLanguage = localStorage.getItem('language');
    return savedLanguage || LANGUAGES.ENGLISH;
  });

  // Update localStorage when language changes
  useEffect(() => {
    localStorage.setItem('language', language);
    // Update document language attribute
    document.documentElement.lang = language;
  }, [language]);

  // Translation function
  const t = (key) => {
    return translations[language][key] || key;
  };

  // Context value
  const value = {
    language,
    setLanguage,
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

// Custom hook to use the language context
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}