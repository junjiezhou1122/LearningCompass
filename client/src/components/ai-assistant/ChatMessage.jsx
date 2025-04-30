import { User, Bot, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const ChatMessage = ({ message }) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <div className="flex items-start space-x-3 bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-100 shadow-sm">
        <div className="bg-gradient-to-br from-amber-400 to-orange-400 text-white p-2 rounded-full flex-shrink-0 shadow-sm">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="text-amber-800 text-sm font-medium">
          {message.content}
        </div>
      </div>
    );
  }

  // Chat bubble with tail design
  return (
    <div className={`flex items-end mb-4 ${isUser ? 'justify-end chat-message-user' : 'justify-start chat-message-ai'}`}>
      {!isUser && (
        <div className="flex-shrink-0 mr-2 mb-1">
          <div className="bg-gradient-to-br from-amber-500 to-orange-500 text-white p-1.5 rounded-full shadow-sm">
            <Bot className="h-4 w-4" />
          </div>
        </div>
      )}
      
      <div className={`relative max-w-[85%] ${isUser ? 'ml-4' : 'mr-4'}`}>
        <div 
          className={`px-4 py-3 rounded-2xl shadow-sm ${
            isUser 
              ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white' 
              : 'bg-white border border-gray-100 text-gray-800'
          }`}
        >
          {/* Tail/pointer for chat bubble */}
          <div 
            className={`absolute bottom-[6px] w-3 h-3 transform rotate-45 ${
              isUser 
                ? 'bg-amber-600 right-[-4px]' 
                : 'bg-white border-l border-b border-gray-100 left-[-4px]'
            }`}
          ></div>
          
          {isUser ? (
            <p className="text-sm">{message.content}</p>
          ) : (
            <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-headings:text-amber-700 prose-a:text-orange-600 ai-markdown">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>
        
        {/* Time/read indicator - can be extended later to show actual times */}
        <div className={`text-[10px] mt-1 text-gray-400 ${isUser ? 'text-right mr-1' : 'text-left ml-1'}`}>
          {isUser ? 'You' : 'AI Assistant'}
        </div>
      </div>
      
      {isUser && (
        <div className="flex-shrink-0 ml-2 mb-1">
          <div className="bg-gradient-to-br from-orange-600 to-orange-700 text-white p-1.5 rounded-full shadow-sm">
            <User className="h-4 w-4" />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatMessage;