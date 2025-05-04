import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { storage } from './storage';
import { generateToken } from './utils/auth';
import jwt from 'jsonwebtoken';

// Use the same JWT secret as in auth.ts
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// Map of connected clients
const connectedClients = new Map<number, WebSocket>();

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp?: string;
}

export function setupWebSocketServer(httpServer: Server): WebSocketServer {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  console.log('WebSocket server initialized at path: /ws');

  wss.on('connection', (ws: WebSocket) => {
    let userId: number | null = null;
    
    ws.on('message', async (message: string) => {
      try {
        const parsedMessage: WebSocketMessage = JSON.parse(message);
        const { type, data } = parsedMessage;
        
        // Add timestamp to all messages
        parsedMessage.timestamp = new Date().toISOString();
        
        switch (type) {
          case 'auth':
            // Handle authentication
            try {
              console.log('Auth data received:', data);
              
              // Support multiple formats of authentication token
              const authToken = data.token || (data.data && data.data.token);
              
              if (!authToken) {
                console.error('Authentication token missing');
                sendError(ws, 'Authentication token missing');
                return;
              }
              
              console.log('Using auth token:', authToken);
              
              // Try parsing as user ID first
              let parsedId = parseInt(authToken);
              
              if (!isNaN(parsedId)) {
                // Token is a user ID
                console.log('Token is a numeric user ID:', parsedId);
                userId = parsedId;
                
                // Verify the user exists
                const user = await storage.getUser(userId);
                if (!user) {
                  console.error('User not found with ID:', userId);
                  sendError(ws, 'User not found');
                  return;
                }
                console.log('Found user by ID:', user.username);
              } else {
                // Variable to store decoded token info if we succeed
                let tokenData: any = null;
                
                try {
                  // Try JWT validation with the same secret used in auth.ts
                  // Use the JWT_SECRET defined at the top of the file
                  console.log('Using JWT secret:', JWT_SECRET.substring(0, 3) + '...');
                  
                  try {
                    // Try JWT validation
                    tokenData = jwt.verify(authToken, JWT_SECRET);
                    console.log('JWT token decoded:', tokenData);
                    
                    // Check for different field names that might contain user ID
                    if (tokenData && typeof tokenData === 'object') {
                      if ('userId' in tokenData) {
                        userId = parseInt(tokenData.userId);
                      } else if ('id' in tokenData) {
                        userId = parseInt(tokenData.id);
                      } else if ('sub' in tokenData) {
                        userId = parseInt(tokenData.sub);
                      }
                      
                      if (userId) {
                        console.log('Found user ID in JWT:', userId);
                      } else {
                        console.log('No user ID found in JWT payload');
                      }
                    }
                  } catch (jwtError) {
                    console.error('JWT verification error:', jwtError.message);
                  }
                  
                  // If we couldn't extract userId from JWT, try to get a user by their email
                  if (!userId && tokenData && typeof tokenData === 'object' && 'email' in tokenData) {
                    console.log('Looking up user by email:', tokenData.email);
                    const user = await storage.getUserByEmail(tokenData.email);
                    if (user) {
                      userId = user.id;
                      console.log('Found user by email:', user.username);
                    }
                  }
                  
                  // If still no userId, try as firebase ID
                  if (!userId) {
                    console.log('Attempting to find user by token as ID');
                    const user = await storage.getUserByFirebaseId(authToken);
                    if (user) {
                      userId = user.id;
                      console.log('Found user by firebase ID:', user.username);
                    } else {
                      console.error('Invalid token format, not numeric, JWT, or firebase ID');
                      sendError(ws, 'Invalid authentication token');
                      return;
                    }
                  }
                } catch (tokenError) {
                  // If all methods fail, try firebase ID
                  console.log('Authentication error, trying firebase ID as last resort');
                  const user = await storage.getUserByFirebaseId(authToken);
                  if (user) {
                    userId = user.id;
                    console.log('Found user by firebase ID after JWT check:', user.username);
                  } else {
                    console.error('Invalid token, all authentication methods failed:', tokenError);
                    sendError(ws, 'Invalid authentication token');
                    return;
                  }
                }
              }
              
              // Register the client
              connectedClients.set(userId, ws);
              
              // Notify other clients that this user is online
              broadcastUserOnline(userId);
              
              console.log(`User ${userId} authenticated`);
            } catch (error) {
              console.error('Auth error:', error);
              sendError(ws, 'Authentication failed');
            }
            break;
            
          case 'direct_message':
          case 'chat_message':
            if (!userId) {
              sendError(ws, 'Not authenticated');
              return;
            }
            
            // Log the entire message for debugging
            console.log('Received message data:', JSON.stringify(data, null, 2));
            
            // Check if data is directly in message or in data property
            const messageData = data.recipientId ? data : (data.data || {});
            console.log('Extracted message data:', JSON.stringify(messageData, null, 2));
            
            if (!messageData) {
              console.error('Invalid message structure (no data):', data);
              sendError(ws, 'Missing message data');
              return;
            }
            
            // Standardize on receiverId for database schema compatibility
            // First check for recipientId (UI might use this) or receiverId (DB uses this)
            let receiverId = null;
            if (messageData.recipientId) {
              receiverId = parseInt(messageData.recipientId);
              console.log('Using recipientId:', receiverId);
            } else if (messageData.receiverId) {
              receiverId = parseInt(messageData.receiverId);
              console.log('Using receiverId:', receiverId);
            } else if (typeof messageData === 'object' && 'to' in messageData) {
              // Some clients might use 'to' field
              receiverId = parseInt(messageData.to);
              console.log('Using "to" field as receiverId:', receiverId);
            }
            
            // Make sure we have both receiver ID and content
            if (!receiverId || isNaN(receiverId)) {
              console.error('Missing or invalid receiver ID:', messageData);
              sendError(ws, 'Missing or invalid recipient ID');
              return;
            }
            
            // Prevent users from sending messages to themselves
            if (receiverId === userId) {
              console.error('User attempting to send message to self:', userId);
              sendError(ws, 'You cannot send messages to yourself');
              return;
            }
            
            if (!messageData.content) {
              console.error('Missing message content:', messageData);
              sendError(ws, 'Missing message content');
              return;
            }
            
            const senderId = userId;
            console.log(`Preparing to send message: sender=${senderId}, receiver=${receiverId}, content=${messageData.content}`);
            
            // Save message to database
            try {
              const chatMessage = await storage.createChatMessage({
                senderId,
                receiverId, // Use receiverId to match DB schema
                content: messageData.content,
                // Don't include createdAt, let the database set it with defaultNow()
              });
              
              console.log('Message saved successfully:', chatMessage.id);
              
              // Find the recipient's WebSocket if they're online
              const recipientWs = connectedClients.get(receiverId);
              console.log(`Looking for recipient ${receiverId} in connected clients:`, Array.from(connectedClients.keys()));
              
              // Send message to recipient if they're online
              if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
                console.log(`Recipient ${receiverId} is online, sending message`);
                const sender = await storage.getUser(senderId);
                
                recipientWs.send(JSON.stringify({
                  type: 'direct_message',
                  timestamp: parsedMessage.timestamp,
                  data: {
                    messageId: chatMessage.id,
                    senderId: senderId, // CRITICAL: Include sender ID
                    recipientId: receiverId, // Include recipient ID
                    sender: {
                      id: sender?.id,
                      username: sender?.username,
                      avatar: sender?.avatar,
                    },
                    content: messageData.content,
                    createdAt: new Date().toISOString(), // Include timestamp for consistent sorting
                  }
                }));
              }
              
              // Send confirmation to sender with consistent format as recipient message
              // CRITICAL FIX: Include sender ID in the message to ensure client displays it correctly
              const sender = await storage.getUser(senderId);
              
              ws.send(JSON.stringify({
                type: 'direct_message',
                timestamp: parsedMessage.timestamp,
                data: {
                  messageId: chatMessage.id,
                  senderId: senderId, // CRITICAL: Include sender ID (self) to correctly position message
                  recipientId: receiverId,
                  sender: {
                    id: sender?.id,
                    username: sender?.username,
                    avatar: sender?.avatar,
                  },
                  content: messageData.content,
                  createdAt: new Date().toISOString(), // Include timestamp for consistent sorting
                  status: 'sent'
                }
              }));
              
              console.log('Confirmation sent to sender with proper senderId:', senderId);
              
            } catch (error) {
              console.error('Error saving message:', error);
              sendError(ws, 'Failed to send message');
            }
            break;
            
          case 'get_chat_history':
            if (!userId) {
              sendError(ws, 'Not authenticated');
              return;
            }
            
            // Check various possible field names that clients might use
            const otherUserField = data.userId || data.receiverId || data.recipientId;
            
            if (!otherUserField) {
              console.error('Missing user ID in chat history request:', data);
              sendError(ws, 'Missing user ID for chat history');
              return;
            }
            
            try {
              const otherUserId = parseInt(otherUserField);
              console.log(`Retrieving chat history between users ${userId} and ${otherUserId}`);
              
              if (isNaN(otherUserId)) {
                sendError(ws, 'Invalid user ID format');
                return;
              }
              
              // Support pagination with limit and offset parameters
              const limit = data.limit ? parseInt(data.limit) : 20;
              const offset = data.offset ? parseInt(data.offset) : 0;
              
              console.log(`Fetching chat history with limit=${limit}, offset=${offset}`);
              
              // Get total count of messages between users for accurate pagination
              const chatHistory = await storage.getChatHistory(userId, otherUserId, { limit, offset });
              const totalMessageCount = await storage.getChatMessageCount(userId, otherUserId);
              
              console.log(`Retrieved ${chatHistory?.length || 0} messages out of ${totalMessageCount} total messages`);
              const hasMoreMessages = offset + chatHistory.length < totalMessageCount;
              
              // Fetch user details for each sender in the chat history
              const enhancedMessages = await Promise.all(chatHistory.map(async (message) => {
                // CRITICAL FIX: Include explicit senderId field to ensure messages are properly positioned
                const sender = await storage.getUser(message.senderId);
                
                return {
                  ...message,
                  sender: {
                    id: sender?.id,
                    username: sender?.username,
                    avatar: sender?.avatar,
                  },
                };
              }));
              
              // FIXED: Ensure the message structure is consistent and properly formatted
              ws.send(JSON.stringify({
                type: 'chat_history',
                data: {
                  userId: otherUserId,
                  // Use enhanced messages with sender info to ensure correct message positioning
                  messages: enhancedMessages, 
                  // Include pagination info in the response
                  pagination: {
                    limit,
                    offset,
                    hasMore: hasMoreMessages,
                    totalCount: totalMessageCount
                  }
                }
              }));
              
              console.log(`Sent chat history with ${enhancedMessages.length} messages to client - hasMore: ${hasMoreMessages}, totalCount: ${totalMessageCount}`);
              if (enhancedMessages.length > 0) {
                console.log('First message in response:', JSON.stringify(enhancedMessages[0]));
              }
              
              console.log('Enhanced chat history sent to client with proper sender details');
            } catch (error) {
              console.error('Error fetching chat history:', error);
              sendError(ws, 'Failed to fetch chat history');
            }
            break;
            
          case 'ping':
            // Keep-alive ping
            ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
            break;
            
          default:
            console.log(`Unhandled message type: ${type}`);
        }
      } catch (error) {
        console.error('Error processing message:', error);
        sendError(ws, 'Invalid message format');
      }
    });
    
    ws.on('close', () => {
      if (userId) {
        console.log(`User ${userId} disconnected`);
        connectedClients.delete(userId);
        broadcastUserOffline(userId);
      }
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      if (userId) {
        connectedClients.delete(userId);
        broadcastUserOffline(userId);
      }
    });
  });
  
  return wss;
}

function sendError(ws: WebSocket, message: string): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'error',
      timestamp: new Date().toISOString(),
      data: { message }
    }));
  }
}

function broadcastUserOnline(userId: number): void {
  for (const [clientId, clientWs] of connectedClients.entries()) {
    if (clientId !== userId && clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({
        type: 'user_online',
        timestamp: new Date().toISOString(),
        data: { userId }
      }));
    }
  }
}

function broadcastUserOffline(userId: number): void {
  for (const [clientId, clientWs] of connectedClients.entries()) {
    if (clientId !== userId && clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({
        type: 'user_offline',
        timestamp: new Date().toISOString(),
        data: { userId }
      }));
    }
  }
}
