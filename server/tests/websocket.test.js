/**
 * WebSocket Unit Tests
 * Test WebSocket connection, authentication, and message handling
 */
import { WebSocket, WebSocketServer } from "ws";
import http from "http";
import jwt from "jsonwebtoken";
import { jest } from "@jest/globals";
import { initializeWebSocket } from "../utils/websocket.js";

// Mock dependencies
jest.mock("../config/db.js", () => ({
  db: {
    query: {
      users: {
        findFirst: jest.fn().mockResolvedValue({
          id: 1,
          username: "testuser",
          display_name: "Test User",
        }),
      },
      messages: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    },
    insert: jest.fn().mockReturnValue({
      values: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([
        {
          id: 1,
          content: "Test message",
          sender_id: 1,
          receiver_id: 2,
          created_at: new Date(),
          is_read: false,
        },
      ]),
    }),
    update: jest.fn().mockReturnValue({
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([
        {
          id: 1,
          is_read: true,
        },
      ]),
    }),
  },
}));

// JWT secret for testing
const JWT_SECRET = "test_jwt_secret";
process.env.JWT_SECRET = JWT_SECRET;

describe("WebSocket Server", () => {
  let httpServer;
  let wss;
  let clientSocket;
  let port;

  // Setup and teardown for tests
  beforeAll((done) => {
    // Create HTTP server
    httpServer = http.createServer();

    // Initialize WebSocket server
    wss = initializeWebSocket(httpServer);

    // Start server on random port
    httpServer.listen(() => {
      port = httpServer.address().port;
      done();
    });
  });

  afterAll((done) => {
    // Close server and existing connections
    if (clientSocket) {
      clientSocket.close();
    }

    wss.close(() => {
      httpServer.close(done);
    });
  });

  afterEach(() => {
    // Close client socket after each test
    if (clientSocket) {
      clientSocket.close();
      clientSocket = null;
    }
  });

  /**
   * Helper function to create a client WebSocket connection
   */
  function createClientSocket() {
    return new Promise((resolve, reject) => {
      const socket = new WebSocket(`ws://localhost:${port}/api/ws`);

      socket.onopen = () => resolve(socket);
      socket.onerror = (error) => reject(error);

      // Add message handling
      const messages = [];
      socket.messages = messages;

      socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        messages.push(message);
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
        const message = socket.messages.find((m) => m.type === type);
        if (message) {
          clearTimeout(timeoutId);
          resolve(message);
        } else {
          setTimeout(checkMessage, 10);
        }
      };

      checkMessage();
    });
  }

  /**
   * Generate a valid JWT token for testing
   */
  function generateToken(userId = 1) {
    return jwt.sign({ id: userId }, JWT_SECRET);
  }

  /**
   * Test cases
   */
  test("should connect and authenticate with valid token", async () => {
    // Create client socket
    clientSocket = await createClientSocket();

    // Send authentication message
    const token = generateToken();
    clientSocket.send(
      JSON.stringify({
        type: "auth",
        token,
      })
    );

    // Wait for auth success message
    const authMessage = await waitForMessageType(clientSocket, "auth_success");

    // Verify message
    expect(authMessage).toBeDefined();
    expect(authMessage.userId).toBe(1);
  });

  test("should reject authentication with invalid token", async () => {
    // Create client socket
    clientSocket = await createClientSocket();

    // Send authentication message with invalid token
    clientSocket.send(
      JSON.stringify({
        type: "auth",
        token: "invalid-token",
      })
    );

    // Wait for error message
    const errorMessage = await waitForMessageType(clientSocket, "error");

    // Verify message
    expect(errorMessage).toBeDefined();
    expect(errorMessage.message).toContain("Authentication failed");
  });

  test("should reject non-auth messages when not authenticated", async () => {
    // Create client socket
    clientSocket = await createClientSocket();

    // Send non-auth message without authentication
    clientSocket.send(
      JSON.stringify({
        type: "chat_message",
        content: "Test message",
        receiverId: 2,
      })
    );

    // Wait for error message
    const errorMessage = await waitForMessageType(clientSocket, "error");

    // Verify message
    expect(errorMessage).toBeDefined();
    expect(errorMessage.message).toBe("Not authenticated");
  });

  test("should handle chat messages when authenticated", async () => {
    // Create client socket and authenticate
    clientSocket = await createClientSocket();

    // Send authentication message
    const token = generateToken();
    clientSocket.send(
      JSON.stringify({
        type: "auth",
        token,
      })
    );

    // Wait for auth success
    await waitForMessageType(clientSocket, "auth_success");

    // Clear messages array
    clientSocket.messages = [];

    // Send chat message
    const tempId = Date.now().toString();
    clientSocket.send(
      JSON.stringify({
        type: "chat_message",
        content: "Test message",
        receiverId: 2,
        tempId,
      })
    );

    // Wait for message sent confirmation
    const sentMessage = await waitForMessageType(clientSocket, "message_sent");

    // Verify message
    expect(sentMessage).toBeDefined();
    expect(sentMessage.tempId).toBe(tempId);
    expect(sentMessage.message).toBeDefined();
    expect(sentMessage.message.content).toBe("Test message");
  });
});
