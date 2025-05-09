/**
 * Chat Integration Tests
 * Test the complete chat flow between multiple users
 */
import http from 'http';
import express from 'express';
import { WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import { jest } from '@jest/globals';
import { initializeWebSocket } from '../utils/websocket.js';

// Mock database and users
const mockUsers = [
  { id: 1, username: 'user1', displayName: 'User One' },
  { id: 2, username: 'user2', displayName: 'User Two' },
];

// Mock messages storage
const mockMessages = [];

// Mock database interactions
jest.mock('../config/db.js', () => {
  return {
    db: {
      query: {
        users: {
          findFirst: jest.fn((params) => {
            const userId = params.where.id;
            return Promise.resolve(mockUsers.find(u => u.id === userId) || null);
          }),
        },
        messages: {
          findMany: jest.fn(() => Promise.resolve(mockMessages)),
        },
      },
      insert: jest.fn().mockImplementation((table) => {
        return {
          values: (values) => ({
            returning: () => {
              const newMessage = {
                id: mockMessages.length + 1,
                ...values,
                created_at: new Date(),
                sender: mockUsers.find(u => u.id === values.sender_id),
              };
              mockMessages.push(newMessage);
              return Promise.resolve([newMessage]);
            },
          });
        };
      }),
      update: jest.fn().mockReturnValue({
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returning: jest.fn().mockImplementation(() => {
          return Promise.resolve([{ id: 1, is_read: true }]);
        }),
      }),
    },
  };
});

// JWT secret for testing
const JWT_SECRET = 'test_integration_secret';
process.env.JWT_SECRET = JWT_SECRET;

describe('Chat Integration Tests', () => {
  let server;
  let wss;
  let port;
  let user1Socket;
  let user2Socket;
  
  /**
   * Generate a valid JWT token for testing
   */
  function generateToken(userId) {
    return jwt.sign({ id: userId }, JWT_SECRET);
  }
  
  /**
   * Helper function to create a client socket
   */
  async function createAuthenticatedSocket(userId) {
    return new Promise((resolve, reject) => {
      const token = generateToken(userId);
      const socket = new WebSocket(`ws://localhost:${port}/api/ws`);
      
      // Setup message handling
      const messages = [];
      socket.messages = messages;
      
      socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        messages.push(message);
        
        // If this is the auth success message, resolve
        if (message.type === 'auth_success') {
          resolve(socket);
        }
      };
      
      socket.onopen = () => {
        // Send auth message
        socket.send(JSON.stringify({
          type: 'auth',
          token,
        }));
      };
      
      socket.onerror = (error) => {
        reject(error);
      };
    });
  }
  
  /**
   * Helper function to wait for a specific message type
   */
  function waitForMessageType(socket, type, timeout = 1000) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Timeout waiting for message type: ${type}`));
      }, timeout);
      
      const checkMessage = () => {
        const message = socket.messages.find(m => m.type === type);
        if (message) {
          clearTimeout(timeoutId);
          resolve(message);
          
          // Remove the message from the array
          const index = socket.messages.indexOf(message);
          if (index !== -1) {
            socket.messages.splice(index, 1);
          }
        } else {
          setTimeout(checkMessage, 10);
        }
      };
      
      checkMessage();
    });
  }
  
  // Setup and teardown
  beforeAll((done) => {
    // Create express app and http server
    const app = express();
    server = http.createServer(app);
    
    // Initialize WebSocket server
    wss = initializeWebSocket(server);
    
    // Start server on random port
    server.listen(() => {
      port = server.address().port;
      done();
    });
  });
  
  afterAll((done) => {
    // Close all connections and server
    if (user1Socket) user1Socket.close();
    if (user2Socket) user2Socket.close();
    
    wss.close(() => {
      server.close(done);
    });
  });
  
  // Test cases
  test('two users can connect, authenticate, and exchange messages', async () => {
    // Connect and authenticate both users
    user1Socket = await createAuthenticatedSocket(1);
    user2Socket = await createAuthenticatedSocket(2);
    
    // Clear messages after authentication
    user1Socket.messages = [];
    user2Socket.messages = [];
    
    // User1 sends a message to User2
    const tempId = Date.now().toString();
    user1Socket.send(JSON.stringify({
      type: 'chat_message',
      content: 'Hello from User 1!',
      receiverId: 2,
      tempId,
    }));
    
    // Wait for message sent confirmation to User1
    const sentConfirmation = await waitForMessageType(user1Socket, 'message_sent');
    expect(sentConfirmation).toBeDefined();
    expect(sentConfirmation.tempId).toBe(tempId);
    
    // Wait for new message notification to User2
    const newMessage = await waitForMessageType(user2Socket, 'new_message');
    expect(newMessage).toBeDefined();
    expect(newMessage.message.content).toBe('Hello from User 1!');
    expect(newMessage.message.senderId).toBe(1);
    
    // User2 marks the message as read
    user2Socket.send(JSON.stringify({
      type: 'mark_read',
      senderId: 1,
    }));
    
    // Wait for read receipt to User1
    const readReceipt = await waitForMessageType(user1Socket, 'messages_read');
    expect(readReceipt).toBeDefined();
    expect(readReceipt.readBy).toBe(2);
  });
  
  test('users can join and communicate in a chat room', async () => {
    // Clear messages
    user1Socket.messages = [];
    user2Socket.messages = [];
    
    // Both users join the same room
    const roomId = 'test-room-123';
    
    user1Socket.send(JSON.stringify({
      type: 'join_room',
      roomId,
    }));
    
    user2Socket.send(JSON.stringify({
      type: 'join_room',
      roomId,
    }));
    
    // Wait a bit for join operations to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // User1 sends a room message
    const tempId = Date.now().toString();
    user1Socket.send(JSON.stringify({
      type: 'room_message',
      content: 'Hello everyone in the room!',
      roomId,
      tempId,
    }));
    
    // Wait for message confirmation
    const messageSent = await waitForMessageType(user1Socket, 'message_sent');
    expect(messageSent).toBeDefined();
    expect(messageSent.tempId).toBe(tempId);
    
    // User2 should receive the room message
    const roomMessage = await waitForMessageType(user2Socket, 'room_message');
    expect(roomMessage).toBeDefined();
    expect(roomMessage.content).toBe('Hello everyone in the room!');
    expect(roomMessage.roomId).toBe(roomId);
  });
}); 