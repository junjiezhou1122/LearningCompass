import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import jwt from "jsonwebtoken";

// Store active connections
const activeConnections = new Map<number, WebSocket[]>();
// Store user status (online/offline)
const userStatus = new Map<number, "online" | "offline">();

// JWT secret key - get from environment
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

// Message type definitions
interface BaseMessage {
  type: string;
  timestamp?: string;
}

interface AuthMessage extends BaseMessage {
  type: "auth";
  token: string;
}

interface ChatMessage extends BaseMessage {
  type: "chat_message";
  content: string;
  receiverId: number;
  tempId?: string;
}

interface GroupMessage extends BaseMessage {
  type: "group_message";
  content: string;
  groupId: number;
  tempId?: string;
}

type MessageData = AuthMessage | ChatMessage | GroupMessage | BaseMessage;

// Initialize WebSocket server
export function initializeWebSocket(server: Server): WebSocketServer {
  // Create WebSocket server
  const wss = new WebSocketServer({
    server,
    path: "/ws",
  });

  console.log("WebSocket server initialized at path: /ws");

  // Handle new WebSocket connections
  wss.on("connection", (ws: WebSocket) => {
    console.log("New WebSocket connection established");

    // Set a timeout for authentication
    const authTimeout = setTimeout(() => {
      console.log("Client did not authenticate within timeout period");
      ws.close(1008, "Authentication timeout");
    }, 30000); // 30 second timeout

    let authenticated = false;
    let userId: number | null = null;

    // Handle messages from client
    ws.on("message", (data: WebSocket.Data) => {
      try {
        const messageData = JSON.parse(data.toString()) as MessageData;
        console.log("Received WebSocket message type:", messageData.type);

        // Handle authentication message first if not authenticated
        if (!authenticated) {
          if (messageData.type === "auth") {
            const { token } = messageData;

            if (!token) {
              sendError(ws, "No authentication token provided");
              return;
            }

            try {
              // Verify JWT token
              const userData = jwt.verify(token, JWT_SECRET) as { id: number };

              if (!userData || !userData.id) {
                sendError(ws, "Invalid authentication token");
                return;
              }

              userId = userData.id;
              authenticated = true;
              clearTimeout(authTimeout);

              // Store connection
              if (activeConnections.has(userId)) {
                // If user has existing connections, add to array
                activeConnections.get(userId)!.push(ws);
              } else {
                // Otherwise create new array with this connection
                activeConnections.set(userId, [ws]);
              }

              // Set user online
              userStatus.set(userId, "online");

              // Send auth success message
              ws.send(
                JSON.stringify({
                  type: "auth_success",
                  message: "Successfully authenticated",
                  userId: userData.id,
                  timestamp: new Date().toISOString(),
                })
              );

              console.log(`WebSocket authenticated for user ${userId}`);

              // Send ping at regular intervals to keep connection alive
              const pingInterval = setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) {
                  ws.send(
                    JSON.stringify({
                      type: "ping",
                      timestamp: Date.now(),
                    })
                  );
                } else {
                  clearInterval(pingInterval);
                }
              }, 30000); // 30 second ping

              // Clear interval on close
              ws.on("close", () => {
                clearInterval(pingInterval);
              });
            } catch (error) {
              console.error("Authentication error:", error);
              sendError(
                ws,
                "Authentication failed: " + (error as Error).message
              );
            }
            return;
          } else {
            // Not authenticated and not an auth message
            sendError(ws, "Not authenticated");
            return;
          }
        }

        // For authenticated users, handle message types
        switch (messageData.type) {
          case "chat_message":
            // Simple echo for now until database is working
            ws.send(
              JSON.stringify({
                type: "message_sent",
                message: {
                  id: Date.now(),
                  content: (messageData as ChatMessage).content,
                  senderId: userId,
                  receiverId: (messageData as ChatMessage).receiverId,
                  createdAt: new Date().toISOString(),
                  isRead: false,
                },
                tempId: (messageData as ChatMessage).tempId,
                timestamp: new Date().toISOString(),
              })
            );
            break;

          case "pong":
            // Handle pong response (if needed)
            break;

          default:
            console.warn(`Unknown message type: ${messageData.type}`);
        }
      } catch (error) {
        console.error("Error handling WebSocket message:", error);
        sendError(ws, "Failed to process message");
      }
    });

    // Handle client disconnection
    ws.on("close", () => {
      clearTimeout(authTimeout);
      if (authenticated && userId !== null) {
        handleUserDisconnect(userId, ws);
      }
    });

    // Handle errors
    ws.on("error", (error) => {
      clearTimeout(authTimeout);
      console.error(`WebSocket error:`, error);
      if (authenticated && userId !== null) {
        handleUserDisconnect(userId, ws);
      }
    });
  });

  console.log("WebSocket server fully initialized");
  return wss;
}

// Helper function to send error messages
function sendError(ws: WebSocket, message: string): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(
      JSON.stringify({
        type: "error",
        message,
        timestamp: new Date().toISOString(),
      })
    );
  }
}

// Handle user disconnect
function handleUserDisconnect(userId: number, ws: WebSocket): void {
  // Get all connections for this user
  const connections = activeConnections.get(userId) || [];

  // Filter out the closed connection
  const remainingConnections = connections.filter((conn) => conn !== ws);

  if (remainingConnections.length > 0) {
    // User still has other connections open
    activeConnections.set(userId, remainingConnections);
  } else {
    // User has no more connections
    activeConnections.delete(userId);
    userStatus.set(userId, "offline");
  }
}

// Send message to specific user (all connections)
export function sendToUser(userId: number, message: object): void {
  const connections = activeConnections.get(userId);
  if (!connections || connections.length === 0) return;

  const messageString = JSON.stringify(message);

  // Send to all connections for this user
  connections.forEach((connection) => {
    if (connection.readyState === WebSocket.OPEN) {
      connection.send(messageString);
    }
  });
}

// Check if user is online
export function isUserOnline(userId: number): boolean {
  return userStatus.get(userId) === "online";
}

// Get all online users (for admin purposes)
export function getOnlineUsers(): number[] {
  return Array.from(userStatus.entries())
    .filter(([, status]) => status === "online")
    .map(([userId]) => userId);
}
