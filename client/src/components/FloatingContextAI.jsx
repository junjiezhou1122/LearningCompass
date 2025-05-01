import { useState, useEffect, useRef } from 'react';
import { 
  Bot, ArrowRight, X, MessagesSquare, Sparkles, Brain, 
  MoveUp, Copy, ArrowDownWideNarrow, Mic, Volume2,
  Volume, VolumeX, Expand, Minimize, RefreshCw, Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '../contexts/AuthContext';

// Animated chat bubbles component
const ChatMessage = ({ message, isLast }) => {
  const isUser = message.role === 'user';
  const contentRef = useRef(null);
  
  // Animation for copying text
  const [copied, setCopied] = useState(false);
  
  const copyToClipboard = () => {
    if (contentRef.current) {
      const text = message.content;
      navigator.clipboard.writeText(text)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(err => console.error('Could not copy text: ', err));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3 relative group`}
    >
      {!isUser && (
        <div className="flex-shrink-0 h-7 w-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-sm mr-2">
          <Sparkles className="h-3 w-3" />
        </div>
      )}
      
      <div 
        className={`relative max-w-[85%] rounded-2xl px-4 py-2 ${
          isUser 
            ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white' 
            : 'bg-white/90 border border-indigo-100 backdrop-blur-sm shadow-sm'
        }`}
        ref={contentRef}
      >
        <div className={`text-sm ${isUser ? 'text-white' : 'text-gray-800'}`}>
          {isUser ? (
            <p>{message.content}</p>
          ) : (
            <div className="prose prose-sm max-w-none prose-p:my-1 prose-pre:my-1 prose-headings:text-blue-700 prose-a:text-blue-600 prose-a:underline prose-a:font-medium prose-code:text-pink-600 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded-sm">
              <ReactMarkdown
                components={{
                  // Enhance code blocks with syntax highlighting
                  code({ node, inline, className, children, ...props }) {
                    return (
                      <code
                        className={`${className || ''} ${inline ? 'inline-code' : 'block-code'}`}
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  },
                  // Enhance links with proper styling
                  a: ({ node, children, ...props }) => (
                    <a 
                      {...props} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      {children}
                    </a>
                  ),
                  // Enhance lists
                  ul: ({ node, children, ...props }) => (
                    <ul className="list-disc pl-5 space-y-1" {...props}>
                      {children}
                    </ul>
                  ),
                  ol: ({ node, children, ...props }) => (
                    <ol className="list-decimal pl-5 space-y-1" {...props}>
                      {children}
                    </ol>
                  ),
                  // Enhance headings
                  h1: ({ node, children, ...props }) => (
                    <h1 className="text-xl font-bold text-indigo-800 my-3" {...props}>
                      {children}
                    </h1>
                  ),
                  h2: ({ node, children, ...props }) => (
                    <h2 className="text-lg font-bold text-indigo-700 my-2" {...props}>
                      {children}
                    </h2>
                  ),
                  h3: ({ node, children, ...props }) => (
                    <h3 className="text-base font-bold text-indigo-600 my-1.5" {...props}>
                      {children}
                    </h3>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
        
        {/* Copy button for AI messages */}
        {!isUser && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: copied ? 1 : 0 }}
            whileHover={{ opacity: 1 }}
            className="absolute -right-2 -top-2 bg-indigo-100 rounded-full p-1 text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={copyToClipboard}
            aria-label="Copy to clipboard"
          >
            <Copy className="h-3 w-3" />
            {copied && (
              <span className="absolute -top-6 right-0 text-xs bg-indigo-600 text-white px-2 py-1 rounded">
                Copied!
              </span>
            )}
          </motion.button>
        )}
      </div>
      
      {isUser && (
        <div className="flex-shrink-0 h-7 w-7 rounded-full bg-gradient-to-br from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-sm ml-2">
          <MessagesSquare className="h-3 w-3" />
        </div>
      )}
    </motion.div>
  );
};

// Context AI component
const FloatingContextAI = ({ pageContext, onClose, onApiStatusChange }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [contextSummary, setContextSummary] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voice, setVoice] = useState(null);
  const [apiSettings, setApiSettings] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const { toast } = useToast();
  const { user, isAuthenticated, token } = useAuth();
  
  // Load API settings from localStorage - sharing settings with main AI assistant
  useEffect(() => {
    try {
      const storedSettings = localStorage.getItem('aiAssistantSettings');
      if (storedSettings) {
        const parsedSettings = JSON.parse(storedSettings);
        // Make sure we have valid settings with all required fields
        if (parsedSettings && parsedSettings.provider) {
          setApiSettings(parsedSettings);
          console.log('FloatingContextAI loaded API settings from localStorage:', parsedSettings.provider);
          
          // Notify parent component that API is configured
          if (onApiStatusChange) {
            onApiStatusChange(true);
          }
        } else {
          console.warn('FloatingContextAI found invalid API settings in localStorage');
          toast({
            title: "AI service not configured",
            description: "Please configure your AI settings in the main assistant.",
            variant: "destructive",
          });
          
          // Notify parent component that API is not configured
          if (onApiStatusChange) {
            onApiStatusChange(false);
          }
        }
      } else {
        console.warn('FloatingContextAI found no API settings in localStorage');
        toast({
          title: "AI service not configured",
          description: "Please configure your AI settings in the main assistant.",
          variant: "destructive",
        });
        
        // Notify parent component that API is not configured
        if (onApiStatusChange) {
          onApiStatusChange(false);
        }
      }
    } catch (error) {
      console.error('FloatingContextAI error loading API settings from localStorage:', error);
      
      // Notify parent component that API is not configured due to error
      if (onApiStatusChange) {
        onApiStatusChange(false);
      }
    }
  }, [toast, onApiStatusChange]);

  // Focus input on open and initialize speech synthesis
  useEffect(() => {
    if (inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100);
    }
    
    // Initialize speech synthesis when component mounts
    if (window.speechSynthesis) {
      const getVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          // Prefer a natural-sounding English voice
          const preferredVoice = voices.find(v => 
            (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Premium')) && 
            v.lang.startsWith('en')
          );
          setVoice(preferredVoice || voices[0]);
        }
      };
      
      // Chrome loads voices asynchronously
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = getVoices;
      }
      
      getVoices();
    }
  }, []);
  
  // Speech recognition setup
  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      toast({
        title: "Speech Recognition Unavailable",
        description: "Your browser doesn't support speech recognition.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const SpeechRecognition = window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        setIsListening(true);
      };
      
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
        toast({
          title: "Recognition Error",
          description: "There was a problem with speech recognition.",
          variant: "destructive",
        });
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognition.start();
    } catch (error) {
      console.error('Speech recognition error:', error);
      toast({
        title: "Recognition Error",
        description: "Could not initialize speech recognition.",
        variant: "destructive",
      });
    }
  };
  
  // Text-to-speech function
  const speakMessage = (text) => {
    if (!window.speechSynthesis || !voice) {
      toast({
        title: "Text-to-Speech Unavailable",
        description: "Your browser doesn't support text-to-speech or no voice is available.",
        variant: "destructive",
      });
      return;
    }
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    // Create a new utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    utterance.onstart = () => {
      setIsSpeaking(true);
    };
    
    utterance.onend = () => {
      setIsSpeaking(false);
    };
    
    utterance.onerror = (event) => {
      console.error('Speech synthesis error', event);
      setIsSpeaking(false);
    };
    
    // Speak the text
    window.speechSynthesis.speak(utterance);
  };
  
  // Handle speaking the last AI message
  const handleSpeak = () => {
    const lastAIMessage = [...messages].reverse().find(msg => msg.role === 'assistant');
    if (lastAIMessage) {
      speakMessage(lastAIMessage.content);
    }
  };
  
  // Stop speaking
  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Prepare context summary with enhanced page information
  useEffect(() => {
    // Get current URL and page title for additional context
    const currentUrl = window.location.href;
    const pageTitle = document.title;
    const pageMetaTags = Array.from(document.querySelectorAll('meta')).map(meta => ({
      name: meta.getAttribute('name') || meta.getAttribute('property') || '',
      content: meta.getAttribute('content') || ''
    })).filter(meta => meta.name && meta.content);
    
    // Get main content text from the page (simplified version)
    const getPageContent = () => {
      try {
        // Try to get main content by common selectors
        const mainContent = document.querySelector('main') || 
                           document.querySelector('article') ||
                           document.querySelector('#content') ||
                           document.querySelector('.content');
        
        if (mainContent) {
          // Get text and trim to a reasonable length
          return mainContent.textContent.trim().substring(0, 1500) + '...';
        }
        
        // Fallback: Get the most content-rich element
        const bodyText = document.body.textContent.trim();
        return bodyText.substring(0, 1000) + '...';
      } catch (error) {
        console.error("Error extracting page content:", error);
        return "";
      }
    };
    
    // Extract page content
    const extractedContent = getPageContent();
    
    if (!pageContext) {
      console.log("No page context provided to FloatingContextAI");
      // Even without pageContext, we still have URL and title
      const defaultSummary = `browsing ${pageTitle || 'this page'} at ${currentUrl.split('?')[0]}`;
      setContextSummary(defaultSummary);
      
      // Initial message with basic page info
      setMessages([
        {
          role: 'assistant',
          content: `I'm your AI learning assistant. I can see you're viewing ${pageTitle || 'a page'} right now. How can I help you with your learning journey today?`
        }
      ]);
      return;
    }
    
    console.log("Preparing context summary from:", pageContext);
    let summary = "";
    
    // Build detailed context based on page type
    switch (pageContext.pageType) {
      case 'share':
        if (pageContext.data?.specificPost) {
          summary = `Viewing post: "${pageContext.data.post.title}" with ${pageContext.data.comments?.length || 0} comments`;
          console.log("Share page - specific post:", pageContext.data.post);
        } else {
          summary = `Browsing ${pageContext.data?.posts?.length || 0} posts in the share page`;
          console.log("Share page - browsing posts count:", pageContext.data?.posts?.length);
        }
        break;
      case 'search':
        summary = `Searching for: "${pageContext.data?.searchQuery}" with filter: ${pageContext.data?.filter}`;
        console.log("Search page context:", { 
          query: pageContext.data?.searchQuery,
          filter: pageContext.data?.filter
        });
        break;
      case 'course':
        summary = `Viewing course: "${pageContext.data?.course?.title}"`;
        console.log("Course page context:", pageContext.data?.course);
        break;
      case 'home':
        summary = `Browsing the home page with ${pageContext.data?.recommendations?.length || 0} recommendations`;
        console.log("Home page recommendations count:", pageContext.data?.recommendations?.length);
        break;
      default:
        summary = `Browsing ${pageTitle || 'the platform'} at ${currentUrl.split('?')[0]}`;
        console.log("Using page title and URL for context:", { pageTitle, currentUrl });
    }
    
    // Add user context
    if (pageContext.userContext) {
      const bookmarks = pageContext.userContext.bookmarks?.length || 0;
      const searchHistory = pageContext.userContext.searchHistory?.length || 0;
      summary += `\nYou have ${bookmarks} bookmarked items`;
      if (searchHistory > 0) {
        summary += ` and ${searchHistory} recent searches`;
      }
      console.log("User context available:", {
        bookmarks: bookmarks,
        searchHistory: searchHistory,
        profile: pageContext.userContext.profile ? "available" : "not available"
      });
    } else {
      console.log("No user context available - user may not be logged in");
    }
    
    // Add page content summary if available
    if (extractedContent) {
      console.log("Extracted page content (sample):", extractedContent.substring(0, 100) + "...");
    }
    
    console.log("Final context summary:", summary);
    setContextSummary(summary);
    
    // Add initial message with rich context
    const initialMessage = `I'm your AI learning assistant. I can see you're ${summary.toLowerCase()}. How can I help you with your learning journey today?`;
    console.log("Setting initial assistant message:", initialMessage);
    
    setMessages([
      {
        role: 'assistant',
        content: initialMessage
      }
    ]);
  }, [pageContext]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle send message - using the same API settings as the main AI assistant
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    // Check if API settings are configured
    if (!apiSettings) {
      toast({
        title: 'API not configured',
        description: 'Please configure your AI provider settings in the main assistant first.',
        variant: 'destructive',
      });
      setIsTyping(false);
      return;
    }
    
    // For non-OpenRouter providers, require an API key
    if (apiSettings.provider !== 'openrouter' && !apiSettings.apiKey) {
      toast({
        title: 'API key missing',
        description: 'Please provide an API key for ' + apiSettings.provider + ' in the main assistant settings.',
        variant: 'destructive',
      });
      setIsTyping(false);
      return;
    }
    
    // Add user message
    const userMessage = { role: 'user', content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsTyping(true);
    
    try {
      // Get current page content for enhanced context
      const currentUrl = window.location.href;
      const pageTitle = document.title;
      
      // Extract page content
      const getPageContent = () => {
        try {
          // Try to get main content by common selectors
          const mainContent = document.querySelector('main') || 
                             document.querySelector('article') ||
                             document.querySelector('#content') ||
                             document.querySelector('.content');
          
          if (mainContent) {
            return mainContent.textContent.trim().substring(0, 1500);
          }
          
          // Fallback: Get the most content-rich element
          const bodyText = document.body.textContent.trim();
          return bodyText.substring(0, 1000);
        } catch (error) {
          console.error("Error extracting page content for API:", error);
          return "";
        }
      };
      
      const extractedContent = getPageContent();
      
      // Create system message with enhanced context information
      const contextMessage = {
        role: 'system',
        content: `You are an AI learning assistant that has access to contextual information about what the user is currently viewing. 
        The user is currently ${contextSummary.toLowerCase()}. 
        
        Current page: "${pageTitle}" at URL: ${currentUrl}
        
        ${extractedContent ? `Page content summary: 
        ${extractedContent}
        ` : ''}
        
        Base your responses on this context to provide more relevant and helpful information.
        Keep your responses focused, clear, and helpful.
        
        Use markdown formatting to make your responses more readable:
        - Use headings (## and ###) for section titles
        - Use bullet points for lists
        - Use **bold** and *italic* for emphasis
        - Use \`code\` for code snippets or technical terms
        - Use [text](URL) for links
        `
      };
      
      // Prepare messages for API request
      const messagesToSend = [
        contextMessage,
        ...updatedMessages.filter(m => m.role === 'user' || m.role === 'assistant')
      ];
      
      // Send message to AI API using the same endpoint and settings as main assistant
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          provider: apiSettings.provider,
          apiKey: apiSettings.apiKey,
          baseUrl: apiSettings.baseUrl,
          model: apiSettings.model,
          temperature: apiSettings.temperature,
          maxTokens: apiSettings.maxTokens,
          messages: messagesToSend
        })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.text();
      
      const aiResponse = {
        role: 'assistant',
        content: data
      };
      
      setMessages(prev => [...prev, aiResponse]);
      
      // Save conversation if user is authenticated
      if (isAuthenticated && token) {
        try {
          // Check if this is a new conversation or continuation
          if (!conversationId) {
            // Create a new conversation with context data
            const title = userMessage.content.substring(0, 50) + (userMessage.content.length > 50 ? '...' : '');
            
            // Extract context information for storage
            const currentUrl = window.location.href;
            const pageTitle = document.title;
            
            // Create context data object
            const contextData = {
              summary: contextSummary,
              userQuery: userMessage.content,
              timestamp: new Date().toISOString(),
              location: {
                url: currentUrl,
                title: pageTitle
              },
              pageStructure: {
                headings: Array.from(document.querySelectorAll('h1, h2, h3')).map(h => ({
                  level: parseInt(h.tagName.substring(1)),
                  text: h.textContent.trim()
                })).slice(0, 10)
              },
              extractedContent: getPageContent().substring(0, 500) // Limiting to 500 chars for storage
            };
            
            const createResponse = await fetch('/api/ai/conversations', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                title,
                messages: JSON.stringify([...updatedMessages, aiResponse]),
                model: apiSettings.model,
                provider: apiSettings.provider,
                contextData: JSON.stringify(contextData),
                pageUrl: currentUrl,
                pageTitle: pageTitle
              })
            });
            
            if (createResponse.ok) {
              const createData = await createResponse.json();
              setConversationId(createData.id);
            }
          } else {
            // Update existing conversation
            await fetch(`/api/ai/conversations/${conversationId}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                messages: JSON.stringify([...updatedMessages, aiResponse])
              })
            });
          }
        } catch (saveError) {
          console.error('Error saving conversation:', saveError);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Failed to send message",
        description: "There was an error communicating with the AI service: " + error.message,
        variant: "destructive",
      });
      
      // Add fallback response in case of error
      const fallbackResponse = {
        role: 'assistant',
        content: "I'm sorry, I encountered an error while processing your request. Please check your AI service configuration or try again later."
      };
      
      setMessages(prev => [...prev, fallbackResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  // Animated typing indicator
  const TypingIndicator = () => (
    <div className="flex items-center space-x-1 pl-2 py-2 text-indigo-600">
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: [0.8, 1.2, 0.8] }}
        transition={{ duration: 1, repeat: Infinity }}
        className="w-2 h-2 rounded-full bg-indigo-400"
      />
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: [0.8, 1.2, 0.8] }}
        transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
        className="w-2 h-2 rounded-full bg-indigo-500"
      />
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: [0.8, 1.2, 0.8] }}
        transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
        className="w-2 h-2 rounded-full bg-indigo-600"
      />
    </div>
  );

  // Handle the expanded view
  const dynamicStyles = isExpanded ? {
    width: '500px',
    height: '85vh',
    maxHeight: '700px',
    bottom: '24px',
    right: '24px',
  } : {
    width: '320px',
    maxHeight: '500px',
    bottom: '80px', 
    right: '24px',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        ...dynamicStyles
      }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ 
        duration: 0.3,
        type: "spring",
        stiffness: 300,
        damping: 25
      }}
      className="fixed bg-white rounded-xl shadow-2xl border border-indigo-100 flex flex-col overflow-hidden z-50"
    >
      {/* Header */}
      <motion.div 
        className="py-3 px-4 flex items-center justify-between border-b border-indigo-100 bg-gradient-to-r from-indigo-50 to-blue-50"
        whileHover={{ backgroundColor: '#EEF2FF' }}
      >
        <div className="flex items-center space-x-2">
          <motion.div 
            whileHover={{ rotate: 15 }}
            whileTap={{ scale: 0.9 }}
            className="h-7 w-7 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center"
          >
            <Brain className="h-4 w-4 text-white" />
          </motion.div>
          <span className="font-medium text-indigo-800">Context Assistant</span>
        </div>
        <motion.button
          whileHover={{ rotate: 90, scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="h-6 w-6 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 hover:bg-indigo-100 transition-colors"
        >
          <X className="h-3 w-3" />
        </motion.button>
      </motion.div>
      
      {/* Context summary */}
      <AnimatePresence>
        {contextSummary && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 text-xs text-indigo-700 border-b border-indigo-100 overflow-hidden"
          >
            <div className="flex items-start space-x-2">
              <div className="flex-shrink-0 mt-0.5 relative">
                <ArrowDownWideNarrow className="h-3.5 w-3.5" />
                <motion.div 
                  className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-green-400" 
                  initial={{ scale: 0.8 }}
                  animate={{ scale: [0.8, 1.2, 0.8] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              </div>
              <div>
                <span className="font-semibold text-indigo-800">Using page context: </span>
                <p>{contextSummary}</p>
                <motion.p 
                  className="mt-1 text-indigo-500 text-2xs"
                  initial={{ opacity: 0.7 }}
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  Context-aware mode enabled
                </motion.p>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* API Status Indicator */}
        {!apiSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-amber-50 px-4 py-2 text-xs text-amber-700 border-b border-amber-100 overflow-hidden"
          >
            <div className="flex items-start space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p>AI service not configured. Please set up your AI provider in the main assistant first.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Chat messages */}
      <ScrollArea className="flex-1 px-4 py-3 bg-gradient-to-b from-white to-indigo-50/30">
        <div className="space-y-2">
          {messages.map((message, index) => (
            <ChatMessage 
              key={index} 
              message={message} 
              isLast={index === messages.length - 1}
            />
          ))}
          {isTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      
      {/* Action buttons bar */}
      <div className="py-1 px-2 border-t border-indigo-100 bg-indigo-50/50 flex items-center justify-between">
        <div className="flex space-x-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleSpeak}
                  disabled={isSpeaking || messages.length === 0}
                  className={`p-1.5 rounded-full ${
                    isSpeaking ? 'bg-indigo-200 text-indigo-700' : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
                  } transition-colors`}
                >
                  {isSpeaking ? <Volume2 className="h-3.5 w-3.5" /> : <Volume className="h-3.5 w-3.5" />}
                </motion.button>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-indigo-800 border-indigo-700 text-white text-xs">
                <p>{isSpeaking ? 'Speaking...' : 'Speak last message'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {isSpeaking && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={stopSpeaking}
                    className="p-1.5 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                  >
                    <VolumeX className="h-3.5 w-3.5" />
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-indigo-800 border-indigo-700 text-white text-xs">
                  <p>Stop speaking</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1.5 rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition-colors"
                >
                  {isExpanded ? <Minimize className="h-3.5 w-3.5" /> : <Expand className="h-3.5 w-3.5" />}
                </motion.button>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-indigo-800 border-indigo-700 text-white text-xs">
                <p>{isExpanded ? 'Minimize' : 'Expand'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {/* Save conversation button - only show if user is authenticated */}
          {isAuthenticated && messages.length > 1 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={async () => {
                      if (!apiSettings) {
                        toast({
                          title: 'API not configured',
                          description: 'Please configure your AI provider settings first.',
                          variant: 'destructive',
                        });
                        return;
                      }
                      
                      try {
                        const title = messages.find(m => m.role === 'user')?.content.substring(0, 50) || 'Context AI Conversation';
                        const createResponse = await fetch('/api/ai/conversations', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                          },
                          body: JSON.stringify({
                            title: title + (title.length >= 50 ? '...' : ''),
                            messages: JSON.stringify(messages),
                            model: apiSettings.model,
                            provider: apiSettings.provider
                          })
                        });
                        
                        if (createResponse.ok) {
                          const createData = await createResponse.json();
                          setConversationId(createData.id);
                          toast({
                            title: 'Conversation saved',
                            description: 'This conversation has been saved to your history.',
                            variant: 'default',
                          });
                        } else {
                          throw new Error('Failed to save conversation');
                        }
                      } catch (error) {
                        console.error('Error saving conversation:', error);
                        toast({
                          title: 'Save failed',
                          description: 'There was an error saving this conversation.',
                          variant: 'destructive',
                        });
                      }
                    }}
                    className="p-1.5 rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition-colors"
                  >
                    <Save className="h-3.5 w-3.5" />
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-indigo-800 border-indigo-700 text-white text-xs">
                  <p>Save conversation</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setMessages([
                      {
                        role: 'assistant',
                        content: `I'm your AI learning assistant. I can see you're ${contextSummary.toLowerCase()}. How can I help you?`
                      }
                    ]);
                    // Reset conversation ID when resetting conversation
                    setConversationId(null);
                  }}
                  className="p-1.5 rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition-colors"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-indigo-800 border-indigo-700 text-white text-xs">
                <p>Reset conversation</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div className="text-xs text-indigo-500/80">
          {messages.length > 0 && `${messages.length} message${messages.length > 1 ? 's' : ''}`}
        </div>
      </div>
      
      {/* Input area */}
      <form 
        onSubmit={handleSendMessage}
        className="p-3 border-t border-indigo-100 bg-white flex items-center"
      >
        <div className="relative flex-1">
          <motion.input
            whileFocus={{ boxShadow: '0 0 0 2px rgba(99, 102, 241, 0.3)' }}
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about this page..."
            className="w-full rounded-l-lg border border-indigo-200 py-2 pl-3 pr-10 text-sm focus:outline-none focus:ring-0"
            disabled={isTyping || isListening}
          />
          
          <AnimatePresence>
            {isListening && (
              <motion.div 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                <div className="h-6 w-6 rounded-full bg-red-500 animate-pulse flex items-center justify-center">
                  <div className="h-3 w-3 rounded-full bg-white" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className="flex">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={startListening}
            disabled={isListening || isTyping}
            className={`p-2 rounded-none border border-l-0 border-indigo-200 ${
              isListening 
                ? 'bg-red-50 text-red-600' 
                : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
            } transition-colors`}
          >
            <Mic className="h-4 w-4" />
          </motion.button>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  type="submit"
                  disabled={!input.trim() || isTyping || !apiSettings}
                  className="rounded-l-none rounded-r-lg px-3 py-2 h-auto bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-700 hover:to-blue-600 text-white border border-l-0 border-indigo-200"
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className={`${!apiSettings ? 'bg-amber-800' : 'bg-indigo-800'} border-indigo-700 text-white text-xs`}>
                <p>{!apiSettings ? 'AI service not configured' : 'Send message'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </form>
    </motion.div>
  );
};

export default FloatingContextAI;