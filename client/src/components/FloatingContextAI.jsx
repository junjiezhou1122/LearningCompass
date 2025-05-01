import { useState, useEffect, useRef } from 'react';
import { 
  Bot, ArrowRight, X, MessagesSquare, Sparkles, Brain, 
  MoveUp, Copy, ArrowDownWideNarrow, Mic, Volume2,
  Volume, VolumeX, Expand, Minimize, RefreshCw 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
            <div className="prose prose-sm max-w-none prose-p:my-1 prose-pre:my-1 prose-headings:text-blue-700">
              <ReactMarkdown>{message.content}</ReactMarkdown>
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
const FloatingContextAI = ({ pageContext, onClose }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [contextSummary, setContextSummary] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voice, setVoice] = useState(null);
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const { toast } = useToast();
  
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

  // Prepare context summary
  useEffect(() => {
    if (pageContext) {
      console.log("Preparing context summary from:", pageContext);
      let summary = "";
      
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
          summary = "Browsing the platform";
          console.log("Unknown page type:", pageContext.pageType);
      }
      
      // Add user context
      if (pageContext.userContext) {
        const bookmarks = pageContext.userContext.bookmarks?.length || 0;
        summary += `\nYou have ${bookmarks} bookmarked items`;
        console.log("User context available:", {
          bookmarks: bookmarks,
          searchHistory: pageContext.userContext.searchHistory?.length || 0,
          profile: pageContext.userContext.profile ? "available" : "not available"
        });
      } else {
        console.log("No user context available - user may not be logged in");
      }
      
      console.log("Final context summary:", summary);
      setContextSummary(summary);
      
      // Add initial message
      const initialMessage = `I'm your AI learning assistant. I can see you're ${summary.toLowerCase()}. How can I help you?`;
      console.log("Setting initial assistant message:", initialMessage);
      
      setMessages([
        {
          role: 'assistant',
          content: initialMessage
        }
      ]);
    } else {
      console.log("No page context provided to FloatingContextAI");
    }
  }, [pageContext]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    // Add user message
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    
    try {
      // In a real implementation, we would send the message to the backend
      // along with the context data and get a response
      
      // Simulate AI response for now
      setTimeout(() => {
        // Get contextual response based on the page type
        let response;
        
        if (input.toLowerCase().includes('recommendation') || input.toLowerCase().includes('suggest')) {
          response = {
            role: 'assistant',
            content: `Based on the content you're currently viewing${
              pageContext.userContext 
                ? ' and your previous activity' 
                : ''
            }, here are some personalized recommendations:\n\n* Explore courses on similar topics\n* Check related discussions in the community\n* Consider saving this content for later reference`
          };
        } else if (input.toLowerCase().includes('explain') || input.toLowerCase().includes('how')) {
          response = {
            role: 'assistant',
            content: `I'd be happy to explain more about this content. What specific aspect would you like me to elaborate on?\n\nSome common questions include:\n* How to apply this knowledge\n* How this connects to other topics\n* The foundational concepts behind this`
          };
        } else {
          response = {
            role: 'assistant',
            content: `I can help you with information about what you're currently viewing. Feel free to ask about:\n\n* More details about this content\n* How to apply this information\n* Related resources\n* How to save or share this content`
          };
        }
        
        setMessages(prev => [...prev, response]);
        setIsTyping(false);
      }, 1500);
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Failed to send message",
        description: "There was an error communicating with the AI service.",
        variant: "destructive",
      });
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
              <ArrowDownWideNarrow className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
              <p>{contextSummary}</p>
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
            type="button"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            disabled={isTyping}
            onClick={startListening}
            className={`p-2 ${
              isListening ? 'bg-red-500' : 'bg-indigo-200 hover:bg-indigo-300'
            } text-indigo-700 border-t border-b border-indigo-200 transition-colors`}
          >
            <Mic className="h-4 w-4" />
          </motion.button>
          
          <Button 
            type="submit"
            disabled={!input.trim() || isTyping}
            className="rounded-r-lg border border-indigo-600 bg-gradient-to-r from-blue-500 to-indigo-600 py-2 px-4 h-full"
          >
            <AnimatePresence mode="wait">
              {isTyping ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </motion.div>
              ) : (
                <motion.div
                  key="send"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  whileHover={{ x: 2 }}
                >
                  <ArrowRight className="h-4 w-4 text-white" />
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
        </div>
      </form>
      
      {/* Minimize/Expand button */}
      <motion.button
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.95 }}
        className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-10 bg-indigo-600 rounded-full flex items-center justify-center shadow-md"
      >
        <MoveUp className="h-3 w-3 text-white" />
      </motion.button>
    </motion.div>
  );
};

export default FloatingContextAI;