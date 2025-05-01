import { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Send, Bot, Settings, HelpCircle, Sparkles, Save, Trash2, BookOpen, X, Clock, RotateCcw, List, User, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import APIConfiguration from './APIConfiguration';
import ChatMessage from './ChatMessage';
import './ai-assistant.css';

// Helper function to safely get the first user message from conversations
const getFirstUserMessage = (messages) => {
  if (!messages) return '';
  
  // If it's a string (JSON), try to parse it
  if (typeof messages === 'string') {
    try {
      const parsedMessages = JSON.parse(messages);
      return parsedMessages.find(m => m.role === 'user')?.content || '';
    } catch (e) {
      console.error('Error parsing messages:', e);
      return '';
    }
  }
  
  // If it's already an array, use it directly
  if (Array.isArray(messages)) {
    return messages.find(m => m.role === 'user')?.content || '';
  }
  
  return '';
};

// Helper function to ensure messages is always an array
const ensureMessagesArray = (messages) => {
  if (!messages) return [];
  
  // If it's a string (JSON), try to parse it
  if (typeof messages === 'string') {
    try {
      return JSON.parse(messages);
    } catch (e) {
      console.error('Error parsing messages:', e);
      return [];
    }
  }
  
  // If it's already an array, return it
  if (Array.isArray(messages)) {
    return messages;
  }
  
  return [];
};

const AIAssistant = ({ onApiConfigured }) => {
  const { toast } = useToast();
  const { user, isAuthenticated, token } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState([
    { 
      role: 'system',
      content: 'Hello! I\'m your learning assistant. How can I help you today?'
    }
  ]);
  const [savedConversations, setSavedConversations] = useState([]);
  const [dbConversations, setDbConversations] = useState([]);
  const [showConversations, setShowConversations] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [apiSettings, setApiSettings] = useState({
    provider: 'openai',
    apiKey: '',
    baseUrl: '',
    model: 'gpt-4o',
    temperature: 0.7,
    maxTokens: 1000
  });
  const [savedApiSettings, setSavedApiSettings] = useState(null);
  const messagesEndRef = useRef(null);

  // Check if API settings and saved conversations are in localStorage
  useEffect(() => {
    try {
      const storedSettings = localStorage.getItem('aiAssistantSettings');
      if (storedSettings) {
        const parsedSettings = JSON.parse(storedSettings);
        // Make sure we have valid settings with all required fields
        if (parsedSettings && parsedSettings.provider) {
          setSavedApiSettings(parsedSettings);
          setApiSettings(parsedSettings);
          console.log('Loaded AI settings from localStorage:', parsedSettings.provider);
          
          // Notify parent component about API configuration status
          if (onApiConfigured) {
            onApiConfigured(true);
          }
        } else {
          if (onApiConfigured) {
            onApiConfigured(false);
          }
        }
      } else {
        // No settings found
        if (onApiConfigured) {
          onApiConfigured(false);
        }
      }
      
      // Load conversations from localStorage for non-authenticated users
      if (!isAuthenticated) {
        const storedConversations = localStorage.getItem('aiAssistantConversations');
        if (storedConversations) {
          setSavedConversations(JSON.parse(storedConversations));
        }
      }
    } catch (error) {
      console.error('Error loading AI settings from localStorage:', error);
      // Reset to default if there's an error with stored settings
      localStorage.removeItem('aiAssistantSettings');
      setSavedApiSettings(null);
      
      // Notify parent component about API configuration failure
      if (onApiConfigured) {
        onApiConfigured(false);
      }
    }
  }, [isAuthenticated, onApiConfigured]);
  
  // Fetch conversations from database when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUserConversations();
    }
  }, [isAuthenticated, user]);
  
  // Function to fetch user's conversations from database
  const fetchUserConversations = async () => {
    if (!isAuthenticated || !token) return;
    
    setIsLoadingConversations(true);
    try {
      const response = await fetch('/api/ai/conversations', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Transform the database conversations to the expected format
      const formattedConversations = data.map(conversation => ({
        id: conversation.id.toString(),
        title: conversation.title,
        messages: typeof conversation.messages === 'string' 
          ? JSON.parse(conversation.messages) 
          : conversation.messages,
        date: conversation.createdAt,
        model: conversation.model,
        provider: conversation.provider,
        isDatabase: true
      }));
      
      setDbConversations(formattedConversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch your saved conversations.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingConversations(false);
    }
  };

  // Controlled scroll behavior - only auto-scroll for AI Assistant content
  useEffect(() => {
    // Only auto-scroll the chat window, not the entire page
    if (messagesEndRef.current && activeTab === 'chat') {
      // Get the chat container's parent element (the scrollable area)
      const chatContainer = messagesEndRef.current.closest('.ai-chat-scrollbar');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }
  }, [messages, activeTab]);

  // Function to save API settings
  const saveApiSettings = (settings) => {
    localStorage.setItem('aiAssistantSettings', JSON.stringify(settings));
    setSavedApiSettings(settings);
    setApiSettings(settings);
    toast({
      title: 'Settings saved',
      description: 'Your API settings have been saved.',
      variant: 'default',
    });
    
    // Notify parent component that API is now configured
    if (onApiConfigured) {
      onApiConfigured(true);
    }
    
    setActiveTab('chat');
  };

  // Function to send a message to the AI
  const sendMessage = async () => {
    if (!input.trim()) return;
    
    // Check if API settings are configured
    if (!savedApiSettings) {
      toast({
        title: 'API not configured',
        description: 'Please configure your AI provider settings first.',
        variant: 'destructive',
      });
      setActiveTab('settings');
      return;
    }
    
    // For non-OpenRouter providers, require an API key
    // Note: OpenRouter has a pre-configured fallback on the server
    if (savedApiSettings.provider !== 'openrouter' && !savedApiSettings.apiKey) {
      toast({
        title: 'API key missing',
        description: 'Please provide an API key for ' + savedApiSettings.provider,
        variant: 'destructive',
      });
      setActiveTab('settings');
      return;
    }

    const userMessage = { role: 'user', content: input };
    
    // Add user message to chat
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      // Create a clean copy of the API settings for this request
      const currentSettings = {
        provider: savedApiSettings.provider,
        apiKey: savedApiSettings.apiKey || '',
        baseUrl: savedApiSettings.baseUrl || undefined,
        model: savedApiSettings.model,
        temperature: savedApiSettings.temperature || 0.7,
        maxTokens: savedApiSettings.maxTokens || 1000
      };
      
      // Prepare request body based on provider
      const requestBody = {
        ...currentSettings,
        messages: [...messages, userMessage].map(msg => ({ 
          role: msg.role, 
          content: msg.content 
        }))
      };

      console.log('Sending message with provider:', currentSettings.provider);
      
      // Make API request to backend
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      // Handle error responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        
        // Show a more helpful error message based on status code
        if (response.status === 401) {
          throw new Error('Authentication failed. Please check your API key and try again.');
        } else if (response.status === 400) {
          throw new Error(errorData.error || 'Invalid request. Please check your settings.');
        } else {
          throw new Error(errorData.error || errorData.details || `Error: ${response.status}`);
        }
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
    } catch (error) {
      console.error('Error calling AI API:', error);
      
      // Add a more informative error message to the chat
      let errorMessage = 'I apologize, but I encountered an error. ';
      
      if (error.message) {
        if (error.message.includes('API key')) {
          errorMessage += 'Your API key may be invalid or expired. Please update your API settings.';
          // Switch to settings tab since there's likely a configuration issue
          setActiveTab('settings');
        } else {
          errorMessage += error.message;
        }
      } else {
        errorMessage += 'Please check your API settings or try again later.';
      }
      
      setMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: errorMessage
        }
      ]);
      
      toast({
        title: 'API Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  // Function to save current conversation
  const saveCurrentConversation = async () => {
    if (messages.length <= 1) {
      toast({
        title: "Cannot save empty conversation",
        description: "Have a conversation with the AI first!",
        variant: "destructive",
      });
      return;
    }
    
    // Get first few words of first user message for the title
    const firstUserMessage = messages.find(m => m.role === 'user')?.content || '';
    const title = firstUserMessage.split(' ').slice(0, 4).join(' ') + '...';
    
    // If user is authenticated, save to database
    if (isAuthenticated && token) {
      try {
        const conversationData = {
          title,
          messages: messages,
          model: savedApiSettings?.model || 'unknown',
          provider: savedApiSettings?.provider || 'unknown',
          createdAt: new Date().toISOString()
        };
        
        const response = await fetch('/api/ai/conversations', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(conversationData)
        });
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const savedConversation = await response.json();
        
        // Format the conversation for the UI
        const formattedConversation = {
          id: savedConversation.id.toString(),
          title: savedConversation.title,
          messages: typeof savedConversation.messages === 'string' 
            ? JSON.parse(savedConversation.messages) 
            : savedConversation.messages,
          date: savedConversation.createdAt,
          model: savedConversation.model,
          provider: savedConversation.provider,
          isDatabase: true
        };
        
        // Add to state
        setDbConversations(prev => [formattedConversation, ...prev]);
        
        toast({
          title: "Conversation saved to your account",
          description: "You can access it from your saved conversations.",
          variant: "default",
        });
      } catch (error) {
        console.error('Error saving conversation to database:', error);
        toast({
          title: 'Error',
          description: 'Failed to save conversation to database. Saving locally instead.',
          variant: 'destructive',
        });
        
        // Fallback to local storage
        saveToLocalStorage(title);
      }
    } else {
      // Save to local storage for non-authenticated users
      saveToLocalStorage(title);
    }
  };
  
  // Helper function to save to localStorage
  const saveToLocalStorage = (title) => {
    const conversation = {
      id: Date.now().toString(),
      title,
      messages: [...messages],
      date: new Date().toISOString(),
      model: savedApiSettings?.model || 'unknown',
      provider: savedApiSettings?.provider || 'unknown'
    };
    
    const updatedConversations = [conversation, ...savedConversations];
    setSavedConversations(updatedConversations);
    localStorage.setItem('aiAssistantConversations', JSON.stringify(updatedConversations));
    
    toast({
      title: "Conversation saved locally",
      description: "You can access it from your saved conversations.",
      variant: "default",
    });
  };
  
  // Function to load a saved conversation
  const loadConversation = (conversation) => {
    setMessages(ensureMessagesArray(conversation.messages));
    setShowConversations(false);
    toast({
      title: "Conversation loaded",
      description: "Previous conversation has been loaded successfully.",
      variant: "default",
    });
  };
  
  // Function to delete a conversation from database
  const deleteDbConversation = async (conversationId) => {
    if (!isAuthenticated || !token) return;
    
    try {
      const response = await fetch(`/api/ai/conversations/${conversationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      // Remove from state
      setDbConversations(prev => prev.filter(c => c.id.toString() !== conversationId.toString()));
      
      toast({
        title: "Conversation deleted",
        description: "The conversation has been deleted from your account.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error deleting conversation from database:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete conversation from database.',
        variant: 'destructive',
      });
    }
  };
  
  // Function to delete a local conversation
  const deleteLocalConversation = (conversationId) => {
    const updatedConversations = savedConversations.filter(c => c.id !== conversationId);
    setSavedConversations(updatedConversations);
    localStorage.setItem('aiAssistantConversations', JSON.stringify(updatedConversations));
    
    toast({
      title: "Conversation deleted",
      variant: "default",
    });
  };
  
  // Function to clear conversation history
  const clearConversation = () => {
    setMessages([
      { role: 'system', content: 'Hello! I\'m your learning assistant. How can I help you today?' }
    ]);
    toast({
      title: "Conversation cleared",
      description: "Your conversation has been cleared.",
      variant: "default",
    });
  };

  return (
    <div className="space-y-6">
      <div className="relative">
        {/* Modern background elements with blue/indigo styling */}
        <div className="absolute -z-10 -top-5 -right-5 w-40 h-40 bg-blue-100 rounded-full filter blur-3xl opacity-40 animate-blob"></div>
        <div className="absolute -z-10 -bottom-5 -left-5 w-40 h-40 bg-indigo-100 rounded-full filter blur-3xl opacity-40 animate-blob animation-delay-2000"></div>
        <div className="absolute -z-10 top-10 left-10 w-24 h-24 bg-sky-100 rounded-full filter blur-2xl opacity-30 animate-blob animation-delay-4000"></div>
        
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-indigo-600 flex items-center">
              <Sparkles className="mr-2 h-6 w-6 animate-pulse" /> 
              {t('chatWithAI')}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {t('askQuestionsAboutAnyTopic')}
            </p>
          </div>
          
          {/* Settings button with improved hover effects */}
          {activeTab === 'chat' && savedApiSettings && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setActiveTab('settings')}
              className="text-gray-500 hover:text-indigo-600 transition-colors duration-200 hover:bg-indigo-50"
            >
              <Settings className="h-4 w-4 mr-1" /> 
              <span className="text-xs">{t('settings')}</span>
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="chat" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-4 ai-assistant-header-gradient rounded-lg overflow-hidden shadow-md border border-indigo-100">
          <TabsTrigger value="chat" className="flex items-center justify-center data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm">
            <Bot className="mr-2 h-4 w-4" /> {t('chat')}
          </TabsTrigger>
          <TabsTrigger 
            value="saved" 
            className="flex items-center justify-center data-[state=active]:bg-white data-[state=active]:text-orange-700 data-[state=active]:shadow-sm"
            onPointerDown={(e) => {
              // Use onPointerDown instead of onClick to avoid needing double-click
              e.preventDefault();
              setShowConversations(true);
              // Don't change the active tab
              setActiveTab('chat');
              // Refresh conversations when opening the modal
              if (isAuthenticated && token) {
                fetchUserConversations();
              }
            }}
          >
            <BookOpen className="mr-2 h-4 w-4" /> {t('history')}
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center justify-center data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-md">
            <Settings className="mr-2 h-4 w-4" /> {t('settings')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="space-y-4">
          {!savedApiSettings && (
            <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-indigo-700 text-lg flex items-center">
                  <HelpCircle className="h-5 w-5 mr-2 text-indigo-500" />
                  {t('chatWithAI')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700">
                  To get started, you'll need to configure your AI provider settings. 
                  We've pre-configured the OpenRouter integration for easy setup.
                </p>
              </CardContent>
              <CardFooter>
                <Button 
                  className="ai-button-gradient text-white shadow-md"
                  onClick={() => setActiveTab('settings')}
                >
                  <Settings className="mr-2 h-4 w-4" /> Configure AI Settings
                </Button>
              </CardFooter>
            </Card>
          )}

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-lg min-h-[60vh] max-h-[70vh] flex flex-col">
            <div className="p-3 ai-assistant-gradient border-b border-indigo-100 flex items-center">
              <div className="flex items-center glass-effect rounded-full px-3 py-1 shadow-md border border-indigo-100">
                <Sparkles className="h-4 w-4 text-indigo-600 mr-1" />
                <span className="text-sm font-medium text-gray-800">Learning AI</span>
              </div>
              
              {/* Chat controls with improved styling and animations */}
              <div className="ml-2 flex items-center">
                <div className="flex space-x-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={saveCurrentConversation}
                    className="h-7 w-7 rounded-full hover:bg-indigo-100 hover:text-indigo-700 transition-colors duration-200"
                    title="Save this conversation"
                  >
                    <Save className="h-3.5 w-3.5" />
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={clearConversation}
                    className="h-7 w-7 rounded-full hover:bg-indigo-100 hover:text-indigo-700 transition-colors duration-200"
                    title="Clear current conversation"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              
              <div className="ml-auto flex items-center space-x-2">
                {savedApiSettings?.provider && (
                  <div className="text-xs px-2 py-1 glass-effect border border-indigo-100 text-indigo-700 rounded-full shadow-md">
                    {savedApiSettings.provider === 'openai' ? 'OpenAI' : 
                     savedApiSettings.provider === 'anthropic' ? 'Anthropic' : 
                     savedApiSettings.provider === 'openrouter' ? 'OpenRouter' :
                     savedApiSettings.provider === 'custom' ? 'Custom API' : 
                     savedApiSettings.provider}
                    {' • '}
                    <span className="font-mono text-xs opacity-75">{savedApiSettings.model.split('/').pop()}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-50 ai-chat-scrollbar">
              {messages.length === 0 && !isTyping && savedApiSettings && (
                <div className="flex flex-col items-center justify-center h-full opacity-80">
                  <div className="animate-bounce mb-2">
                    <Sparkles className="h-10 w-10 text-indigo-400" />
                  </div>
                  <p className="text-sm text-gray-600 text-center font-medium">
                    Ask me anything about learning techniques,<br/>subject explanations, or study strategies!
                  </p>
                </div>
              )}
              
              {ensureMessagesArray(messages).map((message, index) => (
                <ChatMessage key={index} message={message} />
              ))}
              
              {isTyping && (
                <div className="flex items-center text-gray-600 text-sm bg-white p-3 rounded-lg border border-indigo-100 shadow-md">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <span className="ml-2 font-medium">AI is thinking...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            <div className="p-3 border-t border-gray-200 bg-white">
              <div className="flex space-x-2 items-center">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t('typeYourMessage')}
                  className="flex-grow rounded-full border-indigo-200 focus:border-indigo-400 focus:ring-indigo-200 shadow-md input-focus-effect"
                  disabled={(isTyping || !savedApiSettings)}
                />
                <Button 
                  onClick={sendMessage} 
                  disabled={!input.trim() || !savedApiSettings || isTyping}
                  className="ai-button-gradient text-white rounded-full shadow-md aspect-square p-2 transition-all duration-300"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              {savedApiSettings && (
                <div className="flex justify-center">
                  <p className="text-[10px] text-gray-400 mt-2 italic">
                    Powered by {savedApiSettings.provider === 'openai' ? 'OpenAI' : 
                      savedApiSettings.provider === 'anthropic' ? 'Anthropic Claude' : 
                      savedApiSettings.provider === 'openrouter' ? 'OpenRouter' :
                      'Custom API'}
                    {savedApiSettings.hasApiKey && " • Using your API key"}
                    {!savedApiSettings.hasApiKey && savedApiSettings.provider === 'openrouter' && " • Free tier access"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Button 
            variant="ghost" 
            onClick={() => setActiveTab('chat')}
            className="text-gray-500 hover:text-indigo-600 mb-2 transition-colors duration-200"
            size="sm"
          >
            <span className="text-xs">← {t('chat')}</span>
          </Button>
          
          <APIConfiguration 
            initialSettings={apiSettings} 
            onSave={saveApiSettings} 
          />
        </TabsContent>
      </Tabs>
      
      {/* Saved Conversations Modal with glass morphism effect */}
      {showConversations && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between ai-assistant-header-gradient">
              <h3 className="text-lg font-semibold text-indigo-700 flex items-center">
                <BookOpen className="h-5 w-5 mr-2 text-indigo-600" />
                {t('conversations')}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowConversations(false)}
                className="rounded-full h-8 w-8 p-0 hover:bg-indigo-100 hover:text-indigo-700 transition-colors duration-200"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {isLoadingConversations && (
                <div className="text-center py-8 text-gray-500 flex flex-col items-center">
                  <div className="typing-indicator mb-2">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <p>Loading your conversations...</p>
                </div>
              )}
              
              {!isLoadingConversations && savedConversations.length === 0 && dbConversations.length === 0 && (
                <div className="text-center py-8 text-gray-500 flex flex-col items-center">
                  <Bot className="h-12 w-12 text-gray-300 mb-2" />
                  <p>{t('noConversations')}</p>
                  <p className="text-sm mt-2">{t('startChatting')}</p>
                </div>
              )}
              
              {!isLoadingConversations && (
                <div className="space-y-4">
                  {/* Database conversations section */}
                  {isAuthenticated && dbConversations.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <div className="flex-grow h-px bg-gray-200"></div>
                        <span className="px-2 text-xs font-medium text-gray-500">Account Conversations</span>
                        <div className="flex-grow h-px bg-gray-200"></div>
                      </div>
                      
                      {dbConversations.map((convo) => (
                        <div 
                          key={convo.id} 
                          className="bg-gray-50 rounded-lg p-3 hover:bg-indigo-50 transition-colors border border-gray-200 cursor-pointer group shadow-sm hover:shadow-md"
                          onClick={() => loadConversation(convo)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3">
                              <div className="mt-1">
                                <User className="h-4 w-4 text-indigo-500" />
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-800 group-hover:text-indigo-700 transition-colors duration-200">
                                  {convo.title}
                                </h4>
                                <div className="flex items-center mt-1 text-gray-500 text-xs">
                                  <span className="inline-block">
                                    {new Date(convo.date).toLocaleDateString('en-US', { 
                                      year: 'numeric', 
                                      month: 'short', 
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                  <span className="inline-block mx-2">•</span>
                                  <span className="font-mono">{convo.model.split('/').pop()}</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                  {getFirstUserMessage(convo.messages)}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 h-8 w-8 rounded-full p-0 transition-opacity duration-200"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteDbConversation(convo.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-500 transition-colors duration-200" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Local storage conversations section */}
                  {savedConversations.length > 0 && (
                    <div className="space-y-3">
                      {isAuthenticated && dbConversations.length > 0 && (
                        <div className="flex items-center">
                          <div className="flex-grow h-px bg-gray-200"></div>
                          <span className="px-2 text-xs font-medium text-gray-500">Local Conversations</span>
                          <div className="flex-grow h-px bg-gray-200"></div>
                        </div>
                      )}
                      
                      {savedConversations.map((convo) => (
                        <div 
                          key={convo.id} 
                          className="bg-gray-50 rounded-lg p-3 hover:bg-indigo-50 transition-colors border border-gray-200 cursor-pointer group shadow-sm hover:shadow-md"
                          onClick={() => loadConversation(convo)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3">
                              <div className="mt-1">
                                <Clock className="h-4 w-4 text-indigo-500" />
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-800 group-hover:text-indigo-700 transition-colors duration-200">
                                  {convo.title}
                                </h4>
                                <div className="flex items-center mt-1 text-gray-500 text-xs">
                                  <span className="inline-block">
                                    {new Date(convo.date).toLocaleDateString('en-US', { 
                                      year: 'numeric', 
                                      month: 'short', 
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                  <span className="inline-block mx-2">•</span>
                                  <span className="font-mono">{convo.model.split('/').pop()}</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                  {getFirstUserMessage(convo.messages)}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 h-8 w-8 rounded-full p-0 transition-opacity duration-200"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteLocalConversation(convo.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-500 transition-colors duration-200" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* Show login prompt for non-authenticated users */}
              {!isAuthenticated && savedConversations.length > 0 && (
                <div className="mt-4 p-3 border border-indigo-100 bg-indigo-50 rounded-lg shadow-sm">
                  <div className="flex items-start space-x-3">
                    <LogIn className="h-5 w-5 text-indigo-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Sign in</span> to save your conversations to your account.
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Creating an account allows you to access your conversations from any device.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-3 border-t bg-gray-50">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConversations(false)}
                className="w-full hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors duration-200"
              >
                {t('cancel')}
              </Button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default AIAssistant;