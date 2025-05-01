import { useState } from 'react';
import { Bot } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog';
import AIAssistant from './ai-assistant/AIAssistant';

const FloatingAIButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button
          className="fixed bottom-6 right-6 p-3 rounded-full bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 z-50 flex items-center justify-center hover:rotate-12 active:scale-95"
          onClick={() => setIsOpen(true)}
          aria-label="Open AI Assistant"
        >
          <Bot className="h-6 w-6" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] md:max-w-[700px] max-h-[90vh] overflow-hidden p-0 border-orange-200 shadow-xl" aria-describedby="ai-assistant-description">
        <DialogTitle className="sr-only">AI Assistant</DialogTitle>
        <p className="sr-only" id="ai-assistant-description">
          Ask questions and get help from our AI learning assistant
        </p>
        <div className="h-[90vh] flex flex-col">
          <div className="flex-grow overflow-hidden">
            <AIAssistant />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FloatingAIButton;