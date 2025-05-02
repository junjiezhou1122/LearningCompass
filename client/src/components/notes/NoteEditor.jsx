import React, { useState, useRef, useEffect } from 'react';
import { motion, useDragControls, useMotionValue, AnimatePresence } from 'framer-motion';
import { X, Save, Tag, Hash, Pin, Trash, Maximize2, Minimize2, Copy, Share2, Image, Bold, Italic, Underline, List, AlignLeft, AlignCenter, AlignRight, PenTool, FileImage, Calendar, Clock, Link } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '../../contexts/AuthContext';
import { apiRequest } from '@/lib/queryClient';

const COLORS = [
  '#FFFFFF', // White
  '#F9FBE7', // Light Yellow
  '#E8F5E9', // Light Green
  '#E0F7FA', // Light Blue
  '#F3E5F5', // Light Purple
  '#FFF3E0', // Light Orange
  '#FFEBEE', // Light Red
];

const ColorPickerButton = ({ color, selectedColor, onClick }) => (
  <button
    className={`w-6 h-6 rounded-full border ${selectedColor === color ? 'border-gray-800 ring-2 ring-blue-400' : 'border-gray-300'}`}
    style={{ backgroundColor: color }}
    onClick={() => onClick(color)}
    aria-label={`Select ${color} color`}
  />
);

const NoteEditor = ({ note = null, onClose, pageInfo = {} }) => {
  const [content, setContent] = useState(note?.content || '');
  const [color, setColor] = useState(note?.color || '#FFFFFF');
  const [isPinned, setIsPinned] = useState(note?.isPinned || false);
  const [tags, setTags] = useState(note?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [imageUrl, setImageUrl] = useState(note?.imageUrl || '');
  const [fontSize, setFontSize] = useState(note?.fontSize || 'normal');
  // We're using Markdown instead of rich text now
  const [textAlignment, setTextAlignment] = useState(note?.textAlignment || 'left'); // left, center, right
  const [timestamp, setTimestamp] = useState(note?.timestamp || '');
  const [reminderDate, setReminderDate] = useState(note?.reminderDate || '');
  const { toast } = useToast();
  const { token } = useAuth();
  const contentRef = useRef(null);
  const noteRef = useRef(null);
  
  // Position constraining values
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const dragControls = useDragControls();
  
  // Initialize position from saved note if available
  useEffect(() => {
    // Parse position data if available
    if (note?.position) {
      try {
        const savedPosition = JSON.parse(note.position);
        if (savedPosition && typeof savedPosition.x === 'number' && typeof savedPosition.y === 'number') {
          x.set(savedPosition.x);
          y.set(savedPosition.y);
        }
      } catch (error) {
        console.error('Error parsing saved position:', error);
      }
    }
    
    // Set expanded state if available
    if (note?.isExpanded) {
      setIsExpanded(note.isExpanded);
    }
    
    // Set focus on content when opened
    if (contentRef.current) {
      contentRef.current.focus();
    }
  }, [note, x, y]);
  
  // Setup bounds for dragging to ensure note stays within viewport
  useEffect(() => {
    const handleResize = () => {
      // Reset position when window is resized to make sure it's visible
      x.set(Math.min(x.get(), window.innerWidth / 4));
      y.set(Math.min(y.get(), window.innerHeight / 4));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [x, y]);

  // Enhanced drag handling with improved feedback
  const startDrag = (event) => {
    // Stop propagation to prevent other elements from capturing the event
    event.stopPropagation();
    
    // Start drag using drag controls
    dragControls.start(event);
    
    // Set cursor to grabbing during drag with visual feedback
    if (noteRef.current) {
      noteRef.current.style.cursor = 'grabbing';
      noteRef.current.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.1)';
      noteRef.current.style.transform = 'scale(1.01)';
    }
    
    // Add a global mouse up event handler to reset cursor and styles
    const handleMouseUp = () => {
      if (noteRef.current) {
        noteRef.current.style.cursor = '';
        noteRef.current.style.boxShadow = '';
        noteRef.current.style.transform = '';
      }
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleMouseUp);
      
      // Save the new position
      const currentPosition = {
        x: x.get(),
        y: y.get()
      };
      console.log('New note position:', currentPosition);
    };
    
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchend', handleMouseUp);
  };

  // Add tag handler
  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  // Handle adding tags with Enter key
  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  // Remove tag handler
  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // Delete note handler
  const handleDelete = async () => {
    if (!note) return;
    
    try {
      setIsSubmitting(true);
      await apiRequest(`/api/notes/${note.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      toast({
        title: "Note Deleted",
        description: "Your note has been deleted successfully."
      });
      
      onClose();
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: "Error",
        description: "Failed to delete the note. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save note handler
  // Copy note content to clipboard
  const handleCopyContent = () => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied",
      description: "Note content copied to clipboard."
    });
  };

  // Toggle expanded view
  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // Toggle fullscreen mode
  const handleToggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
    // Reset position when entering/exiting fullscreen
    x.set(0);
    y.set(0);
  };

  // Handle image upload (placeholder - would need server implementation)
  const handleAddImage = () => {
    const url = window.prompt('Enter image URL:');
    if (url) {
      setImageUrl(url);
    }
  };

  // Toggle font size with better zoom controls
  const handleToggleFontSize = () => {
    if (fontSize === 'small') {
      setFontSize('normal');
      toast({
        title: "Font Size: Normal",
        description: "Font size set to normal"
      });
    } else if (fontSize === 'normal') {
      setFontSize('large');
      toast({
        title: "Font Size: Large",
        description: "Font size set to large"
      });
    } else {
      setFontSize('small');
      toast({
        title: "Font Size: Small",
        description: "Font size set to small"
      });
    }
  };

  // Share note (placeholder)
  const handleShareNote = () => {
    if (!note) {
      toast({
        title: "Note Not Saved",
        description: "Please save your note before sharing.",
        variant: "destructive"
      });
      return;
    }
    
    // Generate shareable link
    const shareableUrl = `${window.location.origin}/notes/shared/${note.id}`;
    navigator.clipboard.writeText(shareableUrl);
    
    toast({
      title: "Link Copied",
      description: "Shareable link copied to clipboard."
    });
  };

  const handleSave = async () => {
    if (!content.trim()) {
      toast({
        title: "Empty Note",
        description: "Please add some content to your note.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Save position as a JSON string
      const position = {
        x: x.get(),
        y: y.get()
      };
      
      const noteData = {
        content,
        color,
        isPinned,
        tags,
        fontSize,
        imageUrl,
        position: JSON.stringify(position),
        isExpanded,
        textAlignment,
        timestamp,
        reminderDate,
        pageUrl: pageInfo.pageUrl || note?.pageUrl || window.location.href,
        pageTitle: pageInfo.pageTitle || note?.pageTitle || document.title,
        courseId: pageInfo.courseId || note?.courseId || null
      };
      
      console.log('Saving note data:', noteData);
      
      // Get query client for cache invalidation
      const queryClient = window.queryClient || null;
      
      if (note) {
        // Update existing note
        console.log(`Updating note with ID: ${note.id}`);
        const response = await fetch(`/api/notes/${note.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(noteData)
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error response:', errorText);
          throw new Error('Failed to update note: ' + errorText);
        }
        
        const data = await response.json();
        console.log('Note updated successfully:', data);
        
        toast({
          title: "Note Updated",
          description: "Your note has been updated successfully."
        });
        
        // Force refresh the notes list
        if (queryClient) {
          queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
          queryClient.refetchQueries({ queryKey: ['/api/notes'] });
        }
        
        onClose();
      } else {
        // Create new note
        console.log('Creating new note');
        const response = await fetch('/api/notes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(noteData)
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error response:', errorText);
          throw new Error('Failed to create note: ' + errorText);
        }
        
        const data = await response.json();
        console.log('Note created successfully:', data);
        
        toast({
          title: "Note Created",
          description: "Your note has been saved successfully."
        });
        
        // Force refresh the notes list
        if (queryClient) {
          queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
          queryClient.refetchQueries({ queryKey: ['/api/notes'] });
        }
        
        onClose();
      }
    } catch (error) {
      console.error('Error saving note:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save your note. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="note-editor-container" key="note-editor">
        {/* Modal/overlay that doesn't block clicks on the page */}
        <motion.div
          className="fixed inset-0 bg-black/30 z-40 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
        
        {/* Container for the note */}
        <motion.div
          className="fixed inset-0 flex items-center justify-center p-4 z-50 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            ref={noteRef}
            className={`relative ${isFullScreen ? 'fixed inset-0' : isExpanded ? 'max-w-2xl' : 'max-w-md'} w-full rounded-lg shadow-xl overflow-hidden pointer-events-auto`}
            style={{ backgroundColor: color }}
            initial={{ scale: 0.9, opacity: 0, x: 0, y: 0 }}
            animate={{ 
              scale: 1, 
              opacity: 1,
              x: isFullScreen ? 0 : x,  // Only apply x position when not fullscreen
              y: isFullScreen ? 0 : y   // Only apply y position when not fullscreen
            }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 20 }}
            onClick={(e) => e.stopPropagation()}
            // Make component draggable with constraints
            drag={!isFullScreen}
            dragControls={dragControls}
            dragConstraints={{
              left: -window.innerWidth / 2 + 200,  // Don't let it go completely offscreen
              right: window.innerWidth / 2 - 200,
              top: -window.innerHeight / 2 + 100,
              bottom: window.innerHeight / 2 - 100
            }}
            dragElastic={0.1}  // Reduce elasticity for more controlled movement
            dragMomentum={false}  // Disable momentum for precise positioning
            onDrag={(_, info) => {
              // Update position values as the element is dragged
              x.set(info.point.x);
              y.set(info.point.y);
            }}
          >
            {/* Drag handle for better UX */}
            <div 
              className="h-8 w-full bg-black/5 flex items-center justify-between px-2 cursor-move"
              onPointerDown={startDrag}
              onMouseDown={startDrag}
              onTouchStart={startDrag}
            >
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 rounded-full bg-red-400" />
                <div className="h-2 w-2 rounded-full bg-yellow-400" />
                <div className="h-2 w-2 rounded-full bg-green-400" />
              </div>
              <div className="flex items-center space-x-2">
                {/* Size toggle button - cycles between normal, expanded, and fullscreen */}
                <button
                  className="p-1 rounded-full hover:bg-black/10 transition-colors"
                  onClick={() => {
                    if (isFullScreen) {
                      setIsFullScreen(false);
                      setIsExpanded(false);
                    } else if (isExpanded) {
                      setIsFullScreen(true);
                    } else {
                      setIsExpanded(true);
                    }
                  }}
                  aria-label={isFullScreen ? 'Exit fullscreen' : isExpanded ? 'Go fullscreen' : 'Expand note'}
                >
                  {isFullScreen ? (
                    <Minimize2 className="h-3.5 w-3.5" />
                  ) : isExpanded ? (
                    <Maximize2 className="h-3.5 w-3.5" />
                  ) : (
                    <Maximize2 className="h-3.5 w-3.5" />
                  )}
                </button>
                
                {/* Close button */}
                <button
                  className="p-1 rounded-full hover:bg-black/10 transition-colors"
                  onClick={onClose}
                  aria-label="Close note editor"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
        
            {/* Content area */}
            <div className="p-4">
              {/* Display image if available */}
              {imageUrl && (
                <div className="mb-4 relative group">
                  <img 
                    src={imageUrl} 
                    alt="Note attachment" 
                    className="w-full h-auto rounded-md max-h-64 object-cover" 
                  />
                  <button
                    className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setImageUrl('')}
                    aria-label="Remove image"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
          )}
          
          {/* No toolbar - removed date/time buttons as requested */}
          
          <Textarea
            ref={contentRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Take a note..."
            className={`min-h-[150px] w-full border-none focus:ring-0 resize-none bg-transparent placeholder:text-gray-400 ${
              fontSize === 'small' ? 'text-sm' : fontSize === 'large' ? 'text-lg' : 'text-base'
            } ${
              textAlignment === 'center' ? 'text-center' : textAlignment === 'right' ? 'text-right' : 'text-left'
            }`}
          />
        </div>
        
        {/* Tag input */}
        <div className="px-4 py-2 border-t border-gray-200/50">
          <div className="flex items-center mb-2">
            <Tag className="h-4 w-4 mr-2 text-gray-500" />
            <div className="flex-1 relative">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Add a tag..."
                className="pl-2 pr-8 py-1 h-8 text-sm bg-transparent border-none focus:ring-0"
              />
              {tagInput && (
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={handleAddTag}
                >
                  <Hash className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          
          {/* Tag display */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {tags.map((tag, index) => (
                <Badge 
                  key={index} 
                  variant="outline"
                  className="bg-white/50 hover:bg-white/80 transition-colors flex items-center gap-1"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 text-gray-500 hover:text-gray-700 rounded-full h-3 w-3 flex items-center justify-center"
                  >
                    <X className="h-2 w-2" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
        
        {/* Advanced toolbar */}
        <div className="px-4 py-2 border-t border-gray-200/50 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center flex-wrap gap-2">
            {/* Color picker */}
            <div className="flex items-center space-x-1">
              {COLORS.map((c) => (
                <ColorPickerButton
                  key={c}
                  color={c}
                  selectedColor={color}
                  onClick={setColor}
                />
              ))}
            </div>
            
            {/* Pin button */}
            <button
              className={`p-1.5 rounded-full ${isPinned ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'} transition-colors`}
              onClick={() => setIsPinned(!isPinned)}
              aria-label={isPinned ? 'Unpin note' : 'Pin note'}
            >
              <Pin className="h-3.5 w-3.5" />
            </button>
            
            {/* Font size toggle */}
            <button
              className="p-1.5 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
              onClick={handleToggleFontSize}
              aria-label="Change font size"
            >
              <span className={`font-medium ${fontSize === 'small' ? 'text-xs' : fontSize === 'large' ? 'text-base' : 'text-sm'}`}>
                A
              </span>
            </button>
            
            {/* Add image */}
            <button
              className="p-1.5 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
              onClick={handleAddImage}
              aria-label="Add image"
            >
              <Image className="h-3.5 w-3.5" />
            </button>
            
            {/* Copy content */}
            <button
              className="p-1.5 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
              onClick={handleCopyContent}
              aria-label="Copy note content"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
            
            {/* Share note */}
            {note && (
              <button
                className="p-1.5 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                onClick={handleShareNote}
                aria-label="Share note"
              >
                <Share2 className="h-3.5 w-3.5" />
              </button>
            )}
            
            {/* Delete button (show only for existing notes) */}
            {note && (
              <button
                className="p-1.5 rounded-full bg-gray-100 text-red-500 hover:bg-red-100 transition-colors"
                onClick={handleDelete}
                disabled={isSubmitting}
                aria-label="Delete note"
              >
                <Trash className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          
          {/* Save button */}
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSubmitting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1"
          >
            <Save className="h-3.5 w-3.5 mr-1" />
            {note ? 'Update' : 'Save'}
          </Button>
        </div>
      </motion.div>
    </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default NoteEditor;
