import { useState, useEffect, useCallback } from 'react';
import { Bot, AlertTriangle, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog';
import AIAssistant from './ai-assistant/AIAssistant';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import FloatingContextAI from './FloatingContextAI';

const FloatingAIButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [apiConfigured, setApiConfigured] = useState(true);
  const [pageContext, setPageContext] = useState(null);
  const [loadingContext, setLoadingContext] = useState(false);
  const { toast } = useToast();
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth();
  
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

  // Extract context information from the current page
  const extractPageContext = useCallback(async () => {
    console.log("Extracting page context...");
    setLoadingContext(true);
    let contextData = {
      pageType: 'unknown',
      data: null,
      url: location,
      timestamp: new Date().toISOString()
    };
    
    console.log("Current location:", location);

    try {
      // Determine page type based on URL pattern
      if (location.includes('/share')) {
        contextData.pageType = 'share';
        console.log("Detected share page type from URL");
        
        // Get posts data
        console.log("Fetching posts data for share page");
        const postsData = await apiRequest('/api/learning-posts');
        console.log("Received posts data:", postsData?.length || 0, "posts");
        
        // If on a specific post page, extract that post ID
        const postMatch = location.match(/\/share\/post\/(\d+)/);
        if (postMatch && postMatch[1]) {
          const postId = parseInt(postMatch[1]);
          console.log("Detected specific post page with ID:", postId);
          
          console.log("Fetching specific post data");
          const postData = await apiRequest(`/api/learning-posts/${postId}`);
          console.log("Received post data:", postData);
          
          console.log("Fetching post comments");
          const comments = await apiRequest(`/api/learning-posts/${postId}/comments`);
          console.log("Received comments:", comments?.length || 0, "comments");
          
          contextData.data = {
            specificPost: true,
            post: postData,
            comments: comments
          };
        } else {
          console.log("General share page, using all posts data");
          // Get all visible posts on the share page
          contextData.data = {
            specificPost: false,
            posts: postsData
          };
        }
      } else if (location.includes('/search')) {
        contextData.pageType = 'search';
        console.log("Detected search page type from URL");
        
        // Extract search parameters from URL
        const searchParams = new URLSearchParams(location.split('?')[1]);
        const query = searchParams.get('q') || '';
        const filter = searchParams.get('filter') || 'all';
        
        console.log("Extracted search parameters:", { query, filter });
        
        contextData.data = {
          searchQuery: query,
          filter: filter
        };
      } else if (location.includes('/course/')) {
        contextData.pageType = 'course';
        console.log("Detected course page type from URL");
        
        // Extract course ID from URL
        const courseMatch = location.match(/\/course\/(\d+)/);
        if (courseMatch && courseMatch[1]) {
          const courseId = parseInt(courseMatch[1]);
          console.log("Extracted course ID:", courseId);
          
          console.log("Fetching course data");
          const courseData = await apiRequest(`/api/courses/${courseId}`);
          console.log("Received course data:", courseData);
          
          contextData.data = { course: courseData };
        }
      } else {
        contextData.pageType = 'home';
        console.log("Detected home page type from URL");
        
        // Get general information for the home page
        console.log("Fetching recommendations", isAuthenticated ? "for authenticated user" : "for anonymous user");
        const recommendationsData = isAuthenticated
          ? await apiRequest('/api/recommendations')
          : await apiRequest('/api/recommendations/anonymous');
        
        console.log("Received recommendations:", recommendationsData?.length || 0, "recommendations");
        
        contextData.data = { recommendations: recommendationsData };
      }

      // Add user-specific information if authenticated
      if (isAuthenticated && user) {
        try {
          const [bookmarks, searchHistory, profile] = await Promise.all([
            apiRequest('/api/bookmarks'),
            apiRequest('/api/search-history'),
            apiRequest('/api/profile')
          ]);
          
          contextData.userContext = {
            bookmarks,
            searchHistory,
            profile
          };
        } catch (err) {
          console.error('Error fetching user context:', err);
        }
      }
    } catch (error) {
      console.error('Error extracting page context:', error);
      toast({
        title: "Context extraction issue",
        description: "Could not fully extract page context. AI assistant may have limited information.",
        variant: "destructive",
      });
    } finally {
      setLoadingContext(false);
      setPageContext(contextData);
    }
  }, [location, isAuthenticated, user, toast]);

  // Handle dialog open/close
  const handleOpenChange = (open) => {
    if (open) {
      // Extract context when opening the dialog
      extractPageContext();
    } else {
      // When dialog closes, update API configured status
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
    <>
      {/* Floating AI Assistant Button */}
      <motion.div
        className="fixed bottom-6 right-6 z-50 w-20 h-20 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {/* Multiple orbiting particles */}
        {[
          { bgClass: 'bg-blue-400', opacityClass: 'opacity-30', size: 3, shadow: '0 0 2px 1px rgba(99, 102, 241, 0.8)' },
          { bgClass: 'bg-blue-300', opacityClass: 'opacity-25', size: 6, shadow: '0 0 4px 2px rgba(99, 102, 241, 0.6)' },
          { bgClass: 'bg-blue-200', opacityClass: 'opacity-20', size: 9, shadow: '0 0 6px 3px rgba(99, 102, 241, 0.4)' }
        ].map((particle, i) => (
          <motion.div
            key={`particle-${i}`}
            className={`absolute rounded-full ${particle.bgClass} ${particle.opacityClass}`}
            style={{ 
              width: `${particle.size}px`, 
              height: `${particle.size}px`,
              boxShadow: particle.shadow
            }}
            animate={{ 
              x: [0, Math.cos(i * Math.PI/4) * 20, 0, Math.cos(i * Math.PI/4 + Math.PI) * 20, 0],
              y: [0, Math.sin(i * Math.PI/4) * 20, 0, Math.sin(i * Math.PI/4 + Math.PI) * 20, 0],
              scale: [1, 1.2, 1, 0.8, 1]
            }}
            transition={{
              duration: 6 + i,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5
            }}
          />
        ))}
        
        {/* Circular orbit paths */}
        {[...Array(2)].map((_, i) => (
          <motion.div 
            key={`orbit-${i}`}
            className="absolute rounded-full"
            style={{ 
              width: `${(i+1) * 40}px`, 
              height: `${(i+1) * 40}px`,
              border: `1px solid rgba(99, 102, 241, ${0.2 - i*0.05})`,
              opacity: 0.5
            }}
            animate={{ rotate: 360 * (i % 2 ? 1 : -1) }}
            transition={{ 
              duration: 10 + i * 5, 
              repeat: Infinity, 
              ease: "linear"
            }}
          />
        ))}
        
        {/* Main button */}
        <motion.button
          className="relative w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg hover:shadow-xl flex items-center justify-center z-10"
          onClick={() => setIsOpen(true)}
          aria-label="Open AI Assistant"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          animate={{ 
            boxShadow: [
              '0 10px 15px -3px rgba(99, 102, 241, 0.4)',
              '0 15px 20px -3px rgba(99, 102, 241, 0.6)',
              '0 10px 15px -3px rgba(99, 102, 241, 0.4)'
            ]
          }}
          transition={{ 
            boxShadow: {
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            },
            scale: {
              type: "spring",
              stiffness: 400,
              damping: 17
            }
          }}
        >
          {/* Inner pulse effect */}
          <motion.span 
            className="absolute inset-0 rounded-full bg-white opacity-30 blur-sm"
            animate={{ 
              scale: [0.8, 1.05, 0.8],
              opacity: [0.2, 0.35, 0.2]
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity,
              ease: "easeInOut" 
            }}
          />
          
          {/* Outer pulse effect */}
          <motion.span 
            className="absolute inset-0 rounded-full"
            animate={{ 
              scale: [1, 1.5, 1],
              opacity: [0.6, 0, 0.6],
              border: [
                '2px solid rgba(255,255,255,0.4)',
                '0px solid rgba(255,255,255,0)',
                '2px solid rgba(255,255,255,0.4)'
              ]
            }}
            transition={{ 
              duration: 2.5, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          {/* Icon with context indicator */}
          <motion.span
            className="relative"
            animate={{ 
              rotate: [0, 10, 0, -10, 0],
              scale: [1, 1.1, 1, 1.1, 1]
            }}
            transition={{ 
              duration: 5, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Sparkles className="h-6 w-6" />
            
            {/* Context-aware indicator with tooltip */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div 
                    className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-400 border border-white cursor-pointer"
                    initial={{ scale: 0.8 }}
                    animate={{ 
                      scale: [0.8, 1.2, 0.8],
                      boxShadow: ['0 0 0 0 rgba(74, 222, 128, 0.7)', '0 0 0 4px rgba(74, 222, 128, 0)', '0 0 0 0 rgba(74, 222, 128, 0.7)']
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity, 
                      ease: "easeInOut" 
                    }}
                  />
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-indigo-800 border-indigo-700 text-white text-xs">
                  <p>Context-aware assistant</p>
                  <p className="text-2xs text-indigo-200">Understands page content</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </motion.span>
        </motion.button>
        
        {/* Outer glowing ring */}
        <motion.div
          className="absolute w-14 h-14 rounded-full"
          style={{
            background: 'linear-gradient(180deg, rgba(99,102,241,0.2) 0%, rgba(79,70,229,0.1) 100%)',
            boxShadow: '0 0 20px 5px rgba(99,102,241,0.3)',
            filter: 'blur(8px)'
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </motion.div>
      
      {/* Context-aware AI Assistant */}
      <AnimatePresence>
        {isOpen && (
          <FloatingContextAI 
            pageContext={pageContext} 
            onClose={() => setIsOpen(false)} 
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingAIButton;