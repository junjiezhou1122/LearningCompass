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
import APIConfiguration from './APIConfiguration';
import ChatMessage from './ChatMessage';
import './ai-assistant.css';

const AIAssistant = () => {
  const { toast } = useToast();
  const { user, isAuthenticated, token } = useAuth();
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
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
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
    const storedSettings = localStorage.getItem('aiAssistantSettings');
    if (storedSettings) {
      const parsedSettings = JSON.parse(storedSettings);
      setSavedApiSettings(parsedSettings);
      setApiSettings(parsedSettings);
    }
    
    // Load conversations from localStorage for non-authenticated users
    if (!isAuthenticated) {
      const storedConversations = localStorage.getItem('aiAssistantConversations');
      if (storedConversations) {
        setSavedConversations(JSON.parse(storedConversations));
      }
    }
  }, [isAuthenticated]);
  
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
      // Prepare request body based on provider
      const requestBody = {
        provider: savedApiSettings.provider,
        apiKey: savedApiSettings.apiKey,
        baseUrl: savedApiSettings.baseUrl || undefined,
        model: savedApiSettings.model,
        temperature: savedApiSettings.temperature,
        maxTokens: savedApiSettings.maxTokens,
        messages: [...messages, userMessage].map(msg => ({ role: msg.role, content: msg.content }))
      };

      // Make API request to backend
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
    } catch (error) {
      console.error('Error calling AI API:', error);
      setMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: 'I apologize, but I encountered an error. Please check your API settings or try again later.' 
        }
      ]);
      toast({
        title: 'Error',
        description: 'Failed to get a response from the AI service. Please check your settings.',
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
    setMessages(conversation.messages);
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
        {/* Background elements - made more subtle */}
        <div className="absolute -z-10 -top-5 -right-5 w-36 h-36 bg-orange-100 rounded-full filter blur-3xl opacity-40 animate-blob"></div>
        <div className="absolute -z-10 -bottom-5 -left-5 w-36 h-36 bg-amber-100 rounded-full filter blur-3xl opacity-40 animate-blob animation-delay-2000"></div>
        
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-orange-600 animate-fadeIn flex items-center">
              <Bot className="mr-2 h-6 w-6" /> 
              AI Learning Assistant
            </h2>
            <p className="text-sm text-gray-600 mt-1 animate-fadeIn animation-delay-300">
              Ask questions about any topic to enhance your learning journey
            </p>
          </div>
          
          {/* Settings button in the header for quick access */}
          {activeTab === 'chat' && savedApiSettings && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setActiveTab('settings')}
              className="text-gray-500 hover:text-orange-600"
            >
              <Settings className="h-4 w-4 mr-1" /> 
              <span className="text-xs">Settings</span>
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="chat" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg overflow-hidden shadow-sm border border-orange-100">
          <TabsTrigger value="chat" className="flex items-center justify-center data-[state=active]:bg-white data-[state=active]:text-orange-700 data-[state=active]:shadow-sm">
            <Bot className="mr-2 h-4 w-4" /> Chat
          </TabsTrigger>
          <TabsTrigger value="saved" className="flex items-center justify-center data-[state=active]:bg-white data-[state=active]:text-orange-700 data-[state=active]:shadow-sm"
            onClick={(e) => {
              e.preventDefault();
              setShowConversations(true);
              // Don't change the active tab
              setActiveTab('chat');
            }}
          >
            <BookOpen className="mr-2 h-4 w-4" /> History
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center justify-center data-[state=active]:bg-white data-[state=active]:text-orange-700 data-[state=active]:shadow-sm">
            <Settings className="mr-2 h-4 w-4" /> Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="space-y-4">
          {!savedApiSettings && (
            <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-orange-700 text-lg flex items-center">
                  <HelpCircle className="h-5 w-5 mr-2 text-orange-500" />
                  Welcome to AI Assistant
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
                  className="bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 shadow-sm"
                  onClick={() => setActiveTab('settings')}
                >
                  <Settings className="mr-2 h-4 w-4" /> Configure AI Settings
                </Button>
              </CardFooter>
            </Card>
          )}

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-md min-h-[60vh] max-h-[70vh] flex flex-col">
            <div className="p-3 ai-assistant-gradient border-b border-orange-100 flex items-center">
              <div className="flex items-center bg-white rounded-full px-3 py-1 shadow-sm border border-orange-100">
                <Bot className="h-4 w-4 text-orange-600 mr-1" />
                <span className="text-sm font-medium text-gray-800">Learning AI</span>
              </div>
              
              {/* Chat controls - simplified to avoid duplication */}
              <div className="ml-2 flex items-center">
                <div className="flex space-x-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={saveCurrentConversation}
                    className="h-7 w-7 rounded-full hover:bg-orange-100 hover:text-orange-700"
                    title="Save this conversation"
                  >
                    <Save className="h-3.5 w-3.5" />
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={clearConversation}
                    className="h-7 w-7 rounded-full hover:bg-orange-100 hover:text-orange-700"
                    title="Clear current conversation"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              
              <div className="ml-auto flex items-center space-x-2">
                {savedApiSettings?.provider && (
                  <div className="text-xs px-2 py-1 bg-white border border-orange-100 text-orange-700 rounded-full shadow-sm">
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
                <div className="flex flex-col items-center justify-center h-full opacity-70">
                  <Sparkles className="h-8 w-8 text-orange-300 mb-2" />
                  <p className="text-sm text-gray-500 text-center">Ask me anything about learning techniques,<br/>subject explanations, or study strategies!</p>
                </div>
              )}
              
              {messages.map((message, index) => (
                <ChatMessage key={index} message={message} />
              ))}
              
              {isTyping && (
                <div className="flex items-center text-gray-500 text-sm bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <span className="ml-2">AI is thinking...</span>
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
                  placeholder="Ask a question..."
                  className="flex-grow rounded-full border-orange-200 focus:border-orange-300 focus:ring-orange-200 shadow-sm input-focus-effect"
                  disabled={(isTyping || !savedApiSettings)}
                />
                <Button 
                  onClick={sendMessage} 
                  disabled={!input.trim() || !savedApiSettings || isTyping}
                  className="bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 rounded-full shadow-sm aspect-square p-2"
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
            className="text-gray-500 hover:text-orange-600 mb-2"
            size="sm"
          >
            <span className="text-xs">← Back to chat</span>
          </Button>
          
          <APIConfiguration 
            initialSettings={apiSettings} 
            onSave={saveApiSettings} 
          />
        </TabsContent>
      </Tabs>
      
      {/* Saved Conversations Modal */}
      {showConversations && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-orange-50 to-amber-50">
              <h3 className="text-lg font-semibold text-orange-700 flex items-center">
                <BookOpen className="h-5 w-5 mr-2 text-orange-600" />
                Your Saved Conversations
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowConversations(false)}
                className="rounded-full h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {savedConversations.length === 0 ? (
                <div className="text-center py-8 text-gray-500 flex flex-col items-center">
                  <Bot className="h-12 w-12 text-gray-300 mb-2" />
                  <p>No saved conversations yet.</p>
                  <p className="text-sm mt-2">Have a chat and click the save button to store your conversations.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedConversations.map((convo) => (
                    <div 
                      key={convo.id} 
                      className="bg-gray-50 rounded-lg p-3 hover:bg-orange-50 transition-colors border border-gray-200 cursor-pointer group"
                      onClick={() => loadConversation(convo)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className="mt-1">
                            <Clock className="h-4 w-4 text-orange-500" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-800 group-hover:text-orange-700">
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
                              {convo.messages.find(m => m.role === 'user')?.content || ''}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 h-8 w-8 rounded-full p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            const updatedConversations = savedConversations.filter(c => c.id !== convo.id);
                            setSavedConversations(updatedConversations);
                            localStorage.setItem('aiAssistantConversations', JSON.stringify(updatedConversations));
                            toast({
                              title: "Conversation deleted",
                              variant: "default",
                            });
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-3 border-t bg-gray-50">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConversations(false)}
                className="w-full"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default AIAssistant;