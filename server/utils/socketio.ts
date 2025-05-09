import { Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import jwt from "jsonwebtoken";
import { storage } from "../storage";

// Store active connections
const activeConnections = new Map<number, string[]>(); // userId -> socket IDs
const socketToUser = new Map<string, number>(); // socketId -> userId
const userStatus = new Map<number, "online" | "offline">();

// JWT secret key - get from environment
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

// Message type definitions
interface ChatMessage {
  type: string;
  userId: number;
  content: string;
  receiverId?: number;
  groupId?: number;
  tempId?: string;
  timestamp?: string;
}

// Initialize Socket.IO server
export function initializeSocketIO(server: HTTPServer): SocketIOServer {
  // Create Socket.IO server
  const io = new SocketIOServer(server, {
    path: "/socket.io",
    cors: {
      origin:
        process.env.NODE_ENV === "production"
          ? process.env.FRONTEND_URL || "https://learningcompass.vercel.app"
          : "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  console.log("Socket.IO server initialized");

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    try {
      // Verify JWT token
      const userData = jwt.verify(token, JWT_SECRET) as { id: number };

      if (!userData || !userData.id) {
        return next(new Error("Authentication error: Invalid token"));
      }

      // Set user data on socket
      socket.data.userId = userData.id;
      socket.data.authenticated = true;

      return next();
    } catch (error) {
      return next(new Error("Authentication error: Token verification failed"));
    }
  });

  // Handle new connections
  io.on("connection", (socket) => {
    const userId = socket.data.userId as number;

    console.log(`Socket.IO connected: ${socket.id} for user ${userId}`);

    // Store connection
    if (activeConnections.has(userId)) {
      // If user has existing connections, add to array
      activeConnections.get(userId)!.push(socket.id);
    } else {
      // Otherwise create new array with this connection
      activeConnections.set(userId, [socket.id]);
    }

    // Store socketId to userId mapping
    socketToUser.set(socket.id, userId);

    // Set user online
    userStatus.set(userId, "online");

    // Broadcast user online status to followers
    broadcastUserStatus(userId, "online");

    // Handle direct chat messages
    socket.on("chat_message", async (message: ChatMessage) => {
      try {
        console.log(`Received chat message from user ${userId}:`, message);

        // Validate message
        if (!message.content || !message.receiverId) {
          socket.emit("error", {
            type: "error",
            tempId: message.tempId,
            message: "Invalid message: missing content or receiverId",
          });
          return;
        }

        // Add server timestamp and sender info
        const timestamp = new Date().toISOString();
        const completeMessage = {
          ...message,
          senderId: userId,
          timestamp,
          status: "delivered",
        };

        // Store message in database
        try {
          // Store the message in the database
          const storedMessage = await storage.createChatMessage({
            senderId: userId,
            receiverId: message.receiverId,
            content: message.content,
            createdAt: new Date(timestamp),
            status: "delivered",
          });

          // Set the database ID to the message
          completeMessage.id = storedMessage.id;
          console.log(
            `Message stored in database with ID: ${storedMessage.id}`
          );
        } catch (error) {
          console.error("Error storing message:", error);
          socket.emit("error", {
            type: "error",
            tempId: message.tempId,
            message: "Failed to store message",
          });
          return;
        }

        // Send message to recipient if online
        if (activeConnections.has(message.receiverId)) {
          const recipientSockets = activeConnections.get(message.receiverId)!;

          // Emit to all recipient's connected devices
          recipientSockets.forEach((socketId) => {
            io.to(socketId).emit("chat_message", completeMessage);
          });
        }

        // Send confirmation back to sender with complete message
        socket.emit("chat_message", {
          ...completeMessage,
          status: "sent",
        });
      } catch (error) {
        console.error("Error handling chat message:", error);
        socket.emit("error", {
          type: "error",
          tempId: message.tempId,
          message: "Server error processing message",
        });
      }
    });

    // Handle group chat messages
    socket.on("group_message", async (message: ChatMessage) => {
      try {
        console.log(`Received group message from user ${userId}:`, message);

        // Validate message
        if (!message.content || !message.groupId) {
          socket.emit("error", {
            type: "error",
            tempId: message.tempId,
            message: "Invalid message: missing content or groupId",
          });
          return;
        }

        // Add server timestamp and sender info
        const timestamp = new Date().toISOString();
        const completeMessage = {
          ...message,
          senderId: userId,
          timestamp,
          status: "delivered",
        };

        // Store message in database
        try {
          // Store the group message in the database
          const storedMessage = await storage.createGroupChatMessage({
            senderId: userId,
            groupId: message.groupId,
            content: message.content,
            createdAt: new Date(timestamp),
            status: "delivered",
          });

          // Set the database ID to the message
          completeMessage.id = storedMessage.id;
          console.log(
            `Group message stored in database with ID: ${storedMessage.id}`
          );
        } catch (error) {
          console.error("Error storing group message:", error);
          socket.emit("error", {
            type: "error",
            tempId: message.tempId,
            message: "Failed to store message",
          });
          return;
        }

        // TODO: Get group members from database and broadcast to all members
        // const groupMembers = await db.getGroupMembers(message.groupId);

        // For now, broadcast to everyone in the room
        // Join room based on groupId when a user enters the group chat page
        socket
          .to(`group:${message.groupId}`)
          .emit("group_message", completeMessage);

        // Send confirmation back to sender
        socket.emit("group_message", {
          ...completeMessage,
          status: "sent",
        });
      } catch (error) {
        console.error("Error handling group message:", error);
        socket.emit("error", {
          type: "error",
          tempId: message.tempId,
          message: "Server error processing group message",
        });
      }
    });

    // Join a group chat room
    socket.on("join_group", (groupId: number) => {
      socket.join(`group:${groupId}`);
      console.log(`User ${userId} joined group chat ${groupId}`);
    });

    // Leave a group chat room
    socket.on("leave_group", (groupId: number) => {
      socket.leave(`group:${groupId}`);
      console.log(`User ${userId} left group chat ${groupId}`);
    });

    // Handle ping/pong for heartbeat
    socket.on("ping", () => {
      socket.emit("pong", { timestamp: new Date().toISOString() });
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`User ${userId} disconnected socket ${socket.id}`);

      // Remove socket from active connections
      if (activeConnections.has(userId)) {
        const userSockets = activeConnections.get(userId)!;
        const updatedSockets = userSockets.filter((id) => id !== socket.id);

        if (updatedSockets.length === 0) {
          // User has no active connections, set offline
          activeConnections.delete(userId);
          userStatus.set(userId, "offline");

          // Broadcast user offline status to followers
          broadcastUserStatus(userId, "offline");
        } else {
          // User still has other active connections
          activeConnections.set(userId, updatedSockets);
        }
      }

      // Remove socket from socketToUser map
      socketToUser.delete(socket.id);
    });
  });

  return io;
}

// Helper function to broadcast user status changes
function broadcastUserStatus(
  userId: number,
  status: "online" | "offline"
): void {
  // TODO: Get user's followers from database and broadcast status to them
  // const followers = await db.getUserFollowers(userId);

  // for (const follower of followers) {
  //   if (activeConnections.has(follower.id)) {
  //     const followerSockets = activeConnections.get(follower.id)!;
  //     followerSockets.forEach(socketId => {
  //       io.to(socketId).emit("user_status", {
  //         userId,
  //         status,
  //         timestamp: new Date().toISOString()
  //       });
  //     });
  //   }
  // }

  console.log(`User ${userId} is now ${status}`);
}
