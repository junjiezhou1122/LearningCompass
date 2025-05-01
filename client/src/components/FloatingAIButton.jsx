import { useState, useEffect } from 'react';
import { Bot, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog';
import AIAssistant from './ai-assistant/AIAssistant';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const FloatingAIButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [apiConfigured, setApiConfigured] = useState(true);
  const { toast } = useToast();
  
  // Check if AI API settings exist in localStorage
  useEffect(() => {
    const checkApiSettings = () => {
      try {
        const storedSettings = localStorage.getItem('aiAssistantSettings');
        setApiConfigured(!!storedSettings);
      } catch (error) {
        console.error('Error checking AI settings:', error);
        setApiConfigured(false);
      }
    };
    
    // Check on initial load
    checkApiSettings();
    
    // Check whenever the component is opened
    if (isOpen) {
      checkApiSettings();
    }
    
    // Set up a storage event listener to detect changes
    const handleStorageChange = (e) => {
      if (e.key === 'aiAssistantSettings') {
        checkApiSettings();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isOpen]);
  
  // Handle dialog close
  const handleOpenChange = (open) => {
    // When dialog closes, update API configured status
    if (!open) {
      try {
        const storedSettings = localStorage.getItem('aiAssistantSettings');
        setApiConfigured(!!storedSettings);
      } catch (error) {
        console.error('Error checking AI settings on close:', error);
      }
    }
    setIsOpen(open);
  };

  return (
    <TooltipProvider>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <button
                className="fixed bottom-6 right-6 p-3 rounded-full bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 z-50 flex items-center justify-center hover:rotate-6 active:scale-95 group"
                onClick={() => setIsOpen(true)}
                aria-label="Open AI Assistant"
              >
                <Bot className="h-6 w-6" />
                {!apiConfigured && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                )}
              </button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Ask questions to the AI assistant</p>
            {!apiConfigured && (
              <div className="flex items-center gap-1 text-red-500 mt-1 text-xs">
                <AlertTriangle className="h-3 w-3" />
                <span>API settings need configuration</span>
              </div>
            )}
          </TooltipContent>
        </Tooltip>
        
        <DialogContent 
          className="sm:max-w-[600px] md:max-w-[700px] max-h-[90vh] overflow-hidden p-0 border-orange-200 shadow-xl" 
          aria-describedby="ai-assistant-description"
        >
          <DialogTitle className="sr-only">AI Assistant</DialogTitle>
          <p className="sr-only" id="ai-assistant-description">
            Ask questions and get help from our AI learning assistant
          </p>
          <div className="h-[90vh] flex flex-col">
            <div className="flex-grow overflow-hidden">
              <AIAssistant onApiConfigured={(status) => setApiConfigured(status)} />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};

export default FloatingAIButton;