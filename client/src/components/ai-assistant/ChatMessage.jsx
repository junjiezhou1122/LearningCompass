import { User, Bot, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';

const ChatMessage = ({ message }) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-start space-x-3 bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-xl border border-indigo-100 shadow-sm mb-4"
      >
        <div className="bg-gradient-to-br from-indigo-500 to-blue-500 text-white p-2 rounded-full flex-shrink-0 shadow-md">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="text-indigo-800 text-sm font-medium">
          {message.content}
        </div>
      </motion.div>
    );
  }

  // Chat bubble with enhanced design and animations
  return (
    <motion.div 
      initial={{ opacity: 0, x: isUser ? 20 : -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ 
        type: "spring",
        stiffness: 260,
        damping: 20
      }}
      className={`flex items-end mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && (
        <div className="flex-shrink-0 mr-2 mb-1">
          <motion.div 
            whileHover={{ scale: 1.1 }}
            className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-2 rounded-full shadow-md"
          >
            <Bot className="h-4 w-4" />
          </motion.div>
        </div>
      )}
      
      <div className={`relative max-w-[85%] ${isUser ? 'ml-4' : 'mr-4'}`}>
        <div 
          className={`px-4 py-3 rounded-2xl shadow-md ${
            isUser 
              ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white' 
              : 'bg-white border border-gray-100 text-gray-800'
          }`}
        >
          {/* Glass effect for AI messages */}
          {!isUser && (
            <div className="absolute inset-0 bg-white bg-opacity-10 rounded-2xl backdrop-blur-sm"></div>
          )}
          
          {/* Tail/pointer for chat bubble */}
          <div 
            className={`absolute bottom-[6px] w-3 h-3 transform rotate-45 ${
              isUser 
                ? 'bg-indigo-600 right-[-4px]' 
                : 'bg-white border-l border-b border-gray-100 left-[-4px]'
            }`}
          ></div>
          
          <div className="relative">
            {isUser ? (
              <p className="text-sm">{message.content}</p>
            ) : (
              <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-headings:text-blue-700 prose-a:text-indigo-600 ai-markdown">
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
            )}
          </div>
        </div>
        
        {/* Time/read indicator with subtle fade-in */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          transition={{ delay: 0.3 }}
          className={`text-[10px] mt-1 text-gray-500 ${isUser ? 'text-right mr-1' : 'text-left ml-1'}`}
        >
          {isUser ? 'You' : 'AI Assistant'}
        </motion.div>
      </div>
      
      {isUser && (
        <div className="flex-shrink-0 ml-2 mb-1">
          <motion.div 
            whileHover={{ scale: 1.1 }}
            className="bg-gradient-to-br from-indigo-600 to-blue-700 text-white p-2 rounded-full shadow-md"
          >
            <User className="h-4 w-4" />
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default ChatMessage;