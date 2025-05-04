import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { storage } from './storage';
import jwt from 'jsonwebtoken';

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
            // Simple authentication - in a real app you'd use proper JWT validation
            try {
              // This is a simplified approach; in a production app you'd verify a proper JWT token
              if (!data.token) {
                sendError(ws, 'Authentication token missing');
                return;
              }
              
              // In this simple demo, we're just using the user ID as a token
              // In a real app, you would verify a JWT token here
              userId = parseInt(data.token);
              
              if (isNaN(userId)) {
                // Try to get user by firebase ID if not a number
                const user = await storage.getUserByFirebaseId(data.token);
                if (user) {
                  userId = user.id;
                } else {
                  sendError(ws, 'Invalid authentication token');
                  return;
                }
              } else {
                // Verify the user exists
                const user = await storage.getUser(userId);
                if (!user) {
                  sendError(ws, 'User not found');
                  return;
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
            if (!userId) {
              sendError(ws, 'Not authenticated');
              return;
            }
            
            if (!data.recipientId || !data.content) {
              sendError(ws, 'Missing required fields');
              return;
            }
            
            const recipientId = parseInt(data.recipientId);
            const senderId = userId;
            
            // Save message to database
            try {
              const chatMessage = await storage.createChatMessage({
                senderId,
                recipientId,
                content: data.content,
                createdAt: new Date().toISOString(),
              });
              
              // Find the recipient's WebSocket if they're online
              const recipientWs = connectedClients.get(recipientId);
              
              // Send message to recipient if they're online
              if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
                const sender = await storage.getUser(senderId);
                
                recipientWs.send(JSON.stringify({
                  type: 'direct_message',
                  timestamp: parsedMessage.timestamp,
                  data: {
                    messageId: chatMessage.id,
                    sender: {
                      id: sender?.id,
                      username: sender?.username,
                      avatar: sender?.avatar,
                    },
                    content: data.content,
                  }
                }));
              }
              
              // Send confirmation to sender
              ws.send(JSON.stringify({
                type: 'direct_message',
                timestamp: parsedMessage.timestamp,
                data: {
                  messageId: chatMessage.id,
                  recipientId,
                  content: data.content,
                }
              }));
              
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
            
            if (!data.userId) {
              sendError(ws, 'Missing user ID');
              return;
            }
            
            try {
              const otherUserId = parseInt(data.userId);
              const chatHistory = await storage.getChatHistory(userId, otherUserId);
              
              ws.send(JSON.stringify({
                type: 'chat_history',
                data: {
                  userId: otherUserId,
                  messages: chatHistory,
                }
              }));
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
