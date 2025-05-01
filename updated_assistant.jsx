// Helper function to safely get the first user message from conversations
const getFirstUserMessage = (messages) => {
  if (!messages) return '';
  
  // If it's a string (JSON), try to parse it
  if (typeof messages === 'string') {
    try {
      const parsedMessages = JSON.parse(messages);
      return parsedMessages.find(m => m.role === 'user')?.content || '';
    } catch (e) {
      console.error('Error parsing messages:', e);
      return '';
    }
  }
  
  // If it's already an array, use it directly
  if (Array.isArray(messages)) {
    return messages.find(m => m.role === 'user')?.content || '';
  }
  
  return '';
};
