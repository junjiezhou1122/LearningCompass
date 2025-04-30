import { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Send, Bot, Settings, HelpCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import APIConfiguration from './APIConfiguration';
import ChatMessage from './ChatMessage';
import './ai-assistant.css';

const AIAssistant = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState([
    { 
      role: 'system',
      content: 'Hello! I\'m your learning assistant. How can I help you today?'
    }
  ]);
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

  // Check if API settings are saved in localStorage
  useEffect(() => {
    const storedSettings = localStorage.getItem('aiAssistantSettings');
    if (storedSettings) {
      const parsedSettings = JSON.parse(storedSettings);
      setSavedApiSettings(parsedSettings);
      setApiSettings(parsedSettings);
    }
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

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
        <TabsList className="grid grid-cols-2 mb-4 bg-orange-50">
          <TabsTrigger value="chat" className="flex items-center justify-center data-[state=active]:bg-orange-100 data-[state=active]:text-orange-800">
            <Bot className="mr-2 h-4 w-4" /> Chat
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center justify-center data-[state=active]:bg-orange-100 data-[state=active]:text-orange-800">
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
    </div>
  );
};

export default AIAssistant;