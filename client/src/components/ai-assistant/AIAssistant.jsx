import { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Send, Bot, Settings, HelpCircle } from 'lucide-react';
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
    if (!savedApiSettings || !savedApiSettings.apiKey) {
      toast({
        title: 'API not configured',
        description: 'Please configure your AI provider settings first.',
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
        {/* Background elements */}
        <div className="absolute -z-10 -top-10 -right-10 w-40 h-40 bg-orange-200 rounded-full filter blur-3xl opacity-60 animate-blob"></div>
        <div className="absolute -z-10 -bottom-10 -left-10 w-40 h-40 bg-amber-200 rounded-full filter blur-3xl opacity-60 animate-blob animation-delay-2000"></div>
        
        <h2 className="text-3xl font-bold tracking-tight text-orange-600 animate-fadeIn flex items-center">
          <Bot className="mr-3 h-8 w-8" /> 
          AI Learning Assistant
        </h2>
        <p className="text-lg text-gray-700 mt-2 animate-fadeIn animation-delay-300">
          Get personalized help with your learning journey through our AI assistant.
        </p>
      </div>

      <Tabs defaultValue="chat" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="chat" className="flex items-center justify-center">
            <Bot className="mr-2 h-4 w-4" /> Chat
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center justify-center">
            <Settings className="mr-2 h-4 w-4" /> Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="space-y-4">
          {!savedApiSettings?.apiKey && (
            <Card className="border-amber-200 bg-amber-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-amber-700 text-lg">Configure AI Provider</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-amber-700">
                  You need to configure your AI provider settings before using the assistant.
                </p>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="text-amber-700 border-amber-300 hover:bg-amber-100"
                  onClick={() => setActiveTab('settings')}
                >
                  <Settings className="mr-2 h-4 w-4" /> Configure Settings
                </Button>
              </CardFooter>
            </Card>
          )}

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm min-h-80 max-h-[500px] flex flex-col">
            <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center">
              <Bot className="h-5 w-5 text-orange-600 mr-2" />
              <span className="font-medium text-gray-700">AI Assistant</span>
              <div className="ml-auto flex items-center space-x-2">
                {savedApiSettings?.provider && (
                  <div className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded-full">
                    {savedApiSettings.provider === 'openai' ? 'OpenAI' : 
                     savedApiSettings.provider === 'anthropic' ? 'Anthropic' : 
                     savedApiSettings.provider === 'custom' ? 'Custom API' : 
                     savedApiSettings.provider}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) => (
                <ChatMessage key={index} message={message} />
              ))}
              {isTyping && (
                <div className="flex items-center text-gray-500 text-sm">
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
            
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex space-x-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  className="flex-grow"
                  disabled={!savedApiSettings?.apiKey || isTyping}
                />
                <Button 
                  onClick={sendMessage} 
                  disabled={!input.trim() || !savedApiSettings?.apiKey || isTyping}
                  className="bg-gradient-to-r from-orange-500 to-amber-600 text-white hover:from-orange-600 hover:to-amber-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              {savedApiSettings?.apiKey && (
                <p className="text-xs text-gray-500 mt-2">
                  Using {savedApiSettings.model || 'default model'} from {savedApiSettings.provider === 'openai' ? 'OpenAI' : savedApiSettings.provider === 'anthropic' ? 'Anthropic' : 'Custom API'}
                </p>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
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