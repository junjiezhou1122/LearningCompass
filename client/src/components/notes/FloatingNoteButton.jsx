import { useState } from 'react';
import { Pencil, X, Plus, Edit, Tag, PinIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from 'wouter';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import NoteEditor from './NoteEditor';

const FloatingNoteButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [location] = useLocation();

  // Handler for opening the note editor
  const handleOpenNoteEditor = () => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please log in to use the note-taking feature.",
        variant: "destructive",
      });
      return;
    }
    setIsOpen(true);
  };

  // Get current page info for note context
  const getPageInfo = () => {
    return {
      pageUrl: window.location.href,
      pageTitle: document.title,
      courseId: extractCourseId(location)
    };
  };

  // Extract course ID from URL if present
  const extractCourseId = (url) => {
    const courseMatch = url.match(/\/course\/(\d+)/);
    if (courseMatch && courseMatch[1]) {
      return parseInt(courseMatch[1]);
    }
    return null;
  };

  return (
    <>
      {/* Floating Note Button */}
      <motion.div
        className="fixed bottom-24 right-6 z-40"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                className="w-12 h-12 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg hover:shadow-xl flex items-center justify-center"
                onClick={handleOpenNoteEditor}
                aria-label="Take a note"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Pencil className="h-5 w-5" />
              </motion.button>
            </TooltipTrigger>
            <TooltipContent side="left" className="bg-emerald-800 border-emerald-700 text-white">
              <p>Take a note</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </motion.div>

      {/* Note Editor Modal */}
      <AnimatePresence>
        {isOpen && (
          <NoteEditor
            onClose={() => setIsOpen(false)}
            pageInfo={getPageInfo()}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingNoteButton;
