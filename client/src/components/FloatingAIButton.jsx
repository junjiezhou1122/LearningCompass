import { useState } from 'react';
import { Bot, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import AIAssistant from './ai-assistant/AIAssistant';

const FloatingAIButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button
          className="fixed bottom-6 right-6 p-3 rounded-full bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 z-50 flex items-center justify-center"
          onClick={() => setIsOpen(true)}
          aria-label="Open AI Assistant"
        >
          <Bot className="h-6 w-6" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-hidden p-0 border-orange-200 shadow-xl">
        <div className="h-[80vh] flex flex-col">
          <button 
            className="absolute top-2 right-2 rounded-full p-1 text-gray-500 hover:bg-gray-100 z-10"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex-grow overflow-hidden">
            <AIAssistant />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FloatingAIButton;