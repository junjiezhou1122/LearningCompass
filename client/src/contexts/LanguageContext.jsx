import React, { createContext, useContext, useState, useEffect } from 'react';

// Define available languages
const LANGUAGES = {
  ENGLISH: 'en',
  CHINESE: 'zh',
};

// Export separately for compatibility with hot reloading
export { LANGUAGES };

// Define translations
const translations = {
  [LANGUAGES.ENGLISH]: {
    // Header & Navigation
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
    learning: 'Learning',
    language: 'Language',
    viewProfile: 'View Profile',
    
    // Home/Hero Section
    discoverLearningPath: 'Discover Your Learning Path',
    personalizedRecommendations: 'Personalized recommendations to help you advance your skills and career.',
    learnGrowSucceed: 'Learn.Grow.Succeed',
    
    // Course Listing
    sortBy: 'Sort by:',
    recommended: 'Recommended',
    highestRated: 'Highest Rated',
    mostPopular: 'Most Popular',
    newest: 'Newest',
    recommendedCourses: 'Recommended Courses',
    searchResults: 'Search Results: "{query}"',
    filtersApplied: 'Filters applied',
    showingCoursesMatchingFilters: 'Showing courses matching your filters',
    filtersReset: 'Filters reset',
    showingAllCourses: 'Showing all courses',
    
    // Filters & Categories
    category: 'Category',
    subCategory: 'Sub-Category',
    courseType: 'Course Type',
    filterBy: 'Filter by',
    ratingPrefix: '',  // Empty in English
    ratingSuffix: '+ Rating',
    applyFilters: 'Apply Filters',
    resetFilters: 'Reset Filters',
    skills: 'Skills',
    
    // Pagination
    previous: 'Previous',
    next: 'Next',
    page: 'Page',
    of: 'of',
    
    // Toast Messages
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    info: 'Information',
    
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
    
    // User Profile
    followers: 'Followers',
    following: 'Following',
    posts: 'Posts',
    likes: 'Likes',
    comments: 'Comments',
    follow: 'Follow',
    unfollow: 'Unfollow',
    editProfile: 'Edit Profile',
    
    // Errors
    errorOccurred: 'An error occurred',
    pleaseEnterMessage: 'Please enter a message',
    pleaseEnterAPIKey: 'Please enter an API Key',
    pleaseSelectProvider: 'Please select a provider',
    pleaseSelectModel: 'Please select a model',
    
    // Filter messages
    noCategoriesAvailable: 'No categories available',
    noSubCategoriesAvailable: 'No subcategories available',
    noCourseTypesAvailable: 'No course types available',
    
    // Bookmark messages
    authRequired: 'Authentication required',
    signInToBookmark: 'Please sign in to bookmark courses',
    loginAgainToBookmark: 'Please login again to bookmark courses',
    bookmarkRemoved: 'Bookmark removed',
    bookmarkRemovedDescription: '{title} has been removed from your bookmarks',
    bookmarkAdded: 'Bookmark added',
    bookmarkAddedDescription: '{title} has been added to your bookmarks',
    alreadyBookmarked: 'Already bookmarked',
    alreadyBookmarkedDescription: '{title} is already in your bookmarks',
    bookmarkUpdateError: 'Failed to update bookmark. Please try again.',
    addBookmark: 'Add to bookmarks',
    removeBookmark: 'Remove from bookmarks',
  },
  [LANGUAGES.CHINESE]: {
    // Header & Navigation
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
    learning: '学习',
    language: '语言',
    viewProfile: '查看个人资料',
    
    // Home/Hero Section
    discoverLearningPath: '探索您的学习之路',
    personalizedRecommendations: '个性化推荐，帮助您提升技能和推进事业发展。',
    learnGrowSucceed: '学习.成长.成功',
    
    // Course Listing
    sortBy: '排序方式：',
    recommended: '推荐',
    highestRated: '评分最高',
    mostPopular: '最受欢迎',
    newest: '最新',
    recommendedCourses: '推荐课程',
    searchResults: '搜索结果："{query}"',
    filtersApplied: '已应用筛选条件',
    showingCoursesMatchingFilters: '显示符合筛选条件的课程',
    filtersReset: '筛选条件已重置',
    showingAllCourses: '显示所有课程',
    
    // Filters & Categories
    category: '类别',
    subCategory: '子类别',
    courseType: '课程类型',
    filterBy: '筛选条件',
    ratingPrefix: '',  // Empty in Chinese
    ratingSuffix: '+ 评分',
    applyFilters: '应用筛选条件',
    resetFilters: '重置筛选条件',
    skills: '技能',
    
    // Pagination
    previous: '上一页',
    next: '下一页',
    page: '页',
    of: '/',
    
    // Toast Messages
    success: '成功',
    error: '错误',
    warning: '警告',
    info: '信息',
    
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
    
    // User Profile
    followers: '关注者',
    following: '关注中',
    posts: '帖子',
    likes: '点赞',
    comments: '评论',
    follow: '关注',
    unfollow: '取消关注',
    editProfile: '编辑资料',
    
    // Errors
    errorOccurred: '发生错误',
    pleaseEnterMessage: '请输入消息',
    pleaseEnterAPIKey: '请输入API密钥',
    pleaseSelectProvider: '请选择提供商',
    pleaseSelectModel: '请选择模型',
    
    // Filter messages
    noCategoriesAvailable: '没有可用的类别',
    noSubCategoriesAvailable: '没有可用的子类别',
    noCourseTypesAvailable: '没有可用的课程类型',
    
    // Bookmark messages
    authRequired: '需要认证',
    signInToBookmark: '请登录以收藏课程',
    loginAgainToBookmark: '请重新登录以收藏课程',
    bookmarkRemoved: '已移除收藏',
    bookmarkRemovedDescription: '{title} 已从您的收藏中移除',
    bookmarkAdded: '已添加收藏',
    bookmarkAddedDescription: '{title} 已添加到您的收藏',
    alreadyBookmarked: '已经收藏',
    alreadyBookmarkedDescription: '{title} 已在您的收藏中',
    bookmarkUpdateError: '更新收藏失败。请重试。',
    addBookmark: '添加到收藏',
    removeBookmark: '从收藏中移除',
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