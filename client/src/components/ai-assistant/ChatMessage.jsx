import { User, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const ChatMessage = ({ message }) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <div className="flex items-start space-x-3 bg-amber-50 p-3 rounded-lg border border-amber-100">
        <div className="bg-amber-500 text-white p-2 rounded-full flex-shrink-0">
          <Bot className="h-5 w-5" />
        </div>
        <div className="text-amber-800">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-start space-x-3 ${isUser ? 'justify-end' : ''}`}>
      <div className={`max-w-[85%] ${isUser ? 'order-2' : 'order-2'}`}>
        <div className={`px-4 py-3 rounded-lg ${
          isUser 
            ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {isUser ? (
            <p>{message.content}</p>
          ) : (
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
      
      <div className={`${isUser ? 'order-1' : 'order-1'} flex-shrink-0`}>
        <div className={`p-2 rounded-full flex items-center justify-center ${
          isUser 
            ? 'bg-orange-700 text-white' 
            : 'bg-amber-600 text-white'
        }`}>
          {isUser ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;