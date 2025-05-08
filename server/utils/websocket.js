const WebSocket = require("ws");
const jwt = require("jsonwebtoken");
const { db } = require("../config/db");
const {
  messages,
  group_messages,
  users,
  group_members,
} = require("../config/schema");
const { eq, and, or, desc, count } = require("drizzle-orm");

// Store active connections
const activeConnections = new Map();
// Store user status (online/offline)
const userStatus = new Map();

// Initialize WebSocket server
function initializeWebSocket(server) {
  // Create WebSocket server
  const wss = new WebSocket.Server({
    noServer: true,
    path: "/api/ws",
  });

  // Handle WebSocket connection upgrades from HTTP
  server.on("upgrade", async (request, socket, head) => {
    try {
      // Parse URL params to get token
      const url = new URL(request.url, `http://${request.headers.host}`);
      const token = url.searchParams.get("token");

      if (!token) {
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
      }

      // Verify JWT token
      let userData;
      try {
        userData = jwt.verify(token, process.env.JWT_SECRET);
        if (!userData || !userData.id) throw new Error("Invalid token");
      } catch (error) {
        console.error("WebSocket auth error:", error.message);
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
      }

      // Upgrade connection
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request, userData);
      });
    } catch (error) {
      console.error("WebSocket upgrade error:", error);
      socket.write("HTTP/1.1 500 Internal Server Error\r\n\r\n");
      socket.destroy();
    }
  });

  // Handle new WebSocket connections
  wss.on("connection", async (ws, request, userData) => {
    const userId = userData.id;

    // Get user data from database
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        id: true,
        username: true,
        display_name: true,
      },
    });

    if (!user) {
      ws.close(1008, "User not found");
      return;
    }

    console.log(`WebSocket connected for user ${user.username} (${userId})`);

    // Store connection
    if (activeConnections.has(userId)) {
      // If user has existing connections, add to array
      activeConnections.get(userId).push(ws);
    } else {
      // Otherwise create new array with this connection
      activeConnections.set(userId, [ws]);
    }

    // Update user status
    setUserOnline(userId);

    // Get number of unread messages on connect
    sendUnreadMessagesCount(ws, userId);

    // Handle messages from client
    ws.on("message", async (data) => {
      try {
        const messageData = JSON.parse(data);

        // Attach user ID to all messages
        messageData.userId = userId;

        // Handle different message types
        switch (messageData.type) {
          case "chat_message":
            await handleChatMessage(messageData);
            break;

          case "group_message":
            await handleGroupMessage(messageData);
            break;

          case "mark_read":
            await markMessagesAsRead(messageData);
            break;

          case "typing":
            await broadcastTypingStatus(messageData);
            break;

          default:
            console.warn(`Unknown message type: ${messageData.type}`);
        }
      } catch (error) {
        console.error("Error handling WebSocket message:", error);
        sendToUser(userId, {
          type: "error",
          message: "Failed to process message",
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Handle client disconnection
    ws.on("close", () => {
      handleUserDisconnect(userId, ws);
    });

    // Handle errors
    ws.on("error", (error) => {
      console.error(`WebSocket error for user ${userId}:`, error);
      handleUserDisconnect(userId, ws);
    });

    // Send welcome message to client
    ws.send(
      JSON.stringify({
        type: "connected",
        message: "Connected to chat server",
        userId: userId,
        timestamp: new Date().toISOString(),
      })
    );
  });

  console.log("WebSocket server initialized");
  return wss;
}

// Handle direct chat messages
async function handleChatMessage(messageData) {
  const { userId, receiverId, content, tempId } = messageData;

  if (!receiverId || !content) {
    sendToUser(userId, {
      type: "error",
      message: "Invalid message data",
      tempId,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  try {
    // Store message in database
    const [newMessage] = await db
      .insert(messages)
      .values({
        content,
        sender_id: userId,
        receiver_id: receiverId,
        created_at: new Date(),
        is_read: false,
      })
      .returning();

    // Get sender info
    const sender = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        id: true,
        username: true,
        display_name: true,
        profile_image: true,
      },
    });

    // Construct full message object
    const fullMessage = {
      id: newMessage.id,
      content: newMessage.content,
      senderId: newMessage.sender_id,
      receiverId: newMessage.receiver_id,
      createdAt: newMessage.created_at,
      isRead: newMessage.is_read,
      sender,
    };

    // Send confirmation to sender
    sendToUser(userId, {
      type: "message_sent",
      message: fullMessage,
      tempId,
      timestamp: new Date().toISOString(),
    });

    // Send message to receiver if online
    if (isUserOnline(receiverId)) {
      sendToUser(receiverId, {
        type: "new_message",
        message: fullMessage,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("Error saving chat message:", error);
    sendToUser(userId, {
      type: "error",
      message: "Failed to send message",
      tempId,
      timestamp: new Date().toISOString(),
    });
  }
}

// Handle group chat messages
async function handleGroupMessage(messageData) {
  const { userId, groupId, content, tempId } = messageData;

  if (!groupId || !content) {
    sendToUser(userId, {
      type: "error",
      message: "Invalid group message data",
      tempId,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  try {
    // Check if user is a member of the group
    const isMember = await db.query.group_members.findFirst({
      where: and(
        eq(group_members.group_id, groupId),
        eq(group_members.user_id, userId)
      ),
    });

    if (!isMember) {
      sendToUser(userId, {
        type: "error",
        message: "You are not a member of this group",
        tempId,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Store message in database
    const [newMessage] = await db
      .insert(group_messages)
      .values({
        content,
        sender_id: userId,
        group_id: groupId,
        created_at: new Date(),
      })
      .returning();

    // Get sender info
    const sender = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        id: true,
        username: true,
        display_name: true,
        profile_image: true,
      },
    });

    // Construct full message object
    const fullMessage = {
      id: newMessage.id,
      content: newMessage.content,
      senderId: newMessage.sender_id,
      groupId: newMessage.group_id,
      createdAt: newMessage.created_at,
      sender,
    };

    // Send confirmation to sender
    sendToUser(userId, {
      type: "group_message_sent",
      message: fullMessage,
      tempId,
      timestamp: new Date().toISOString(),
    });

    // Get all group members
    const members = await db
      .select({ userId: group_members.user_id })
      .from(group_members)
      .where(eq(group_members.group_id, groupId));

    // Send message to all online members except sender
    members.forEach((member) => {
      if (member.userId !== userId && isUserOnline(member.userId)) {
        sendToUser(member.userId, {
          type: "new_group_message",
          message: fullMessage,
          timestamp: new Date().toISOString(),
        });
      }
    });
  } catch (error) {
    console.error("Error saving group message:", error);
    sendToUser(userId, {
      type: "error",
      message: "Failed to send group message",
      tempId,
      timestamp: new Date().toISOString(),
    });
  }
}

// Mark messages as read
async function markMessagesAsRead(messageData) {
  const { userId, senderId, conversationId } = messageData;

  if (!senderId) {
    return;
  }

  try {
    // Mark all messages from sender as read
    await db
      .update(messages)
      .set({ is_read: true })
      .where(
        and(
          eq(messages.sender_id, senderId),
          eq(messages.receiver_id, userId),
          eq(messages.is_read, false)
        )
      );

    // Notify sender that messages were read
    if (isUserOnline(senderId)) {
      sendToUser(senderId, {
        type: "messages_read",
        readBy: userId,
        conversationId,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("Error marking messages as read:", error);
  }
}

// Broadcast typing status to recipient
async function broadcastTypingStatus(messageData) {
  const { userId, receiverId, isTyping, conversationId } = messageData;

  if (!receiverId) {
    return;
  }

  // Get user data
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      username: true,
      display_name: true,
    },
  });

  if (!user) return;

  // Send typing status to recipient if online
  if (isUserOnline(receiverId)) {
    sendToUser(receiverId, {
      type: "typing_status",
      userId,
      username: user.username,
      displayName: user.display_name,
      isTyping,
      conversationId,
      timestamp: new Date().toISOString(),
    });
  }
}

// Send unread messages count to user
async function sendUnreadMessagesCount(ws, userId) {
  try {
    // Count unread messages
    const unreadCount = await db
      .select({ count: count() })
      .from(messages)
      .where(and(eq(messages.receiver_id, userId), eq(messages.is_read, false)))
      .then((rows) => rows[0]?.count || 0);

    // Get unread messages with sender info
    const unreadMessages = await db
      .select({
        id: messages.id,
        content: messages.content,
        createdAt: messages.created_at,
        senderId: messages.sender_id,
        sender: {
          id: users.id,
          username: users.username,
          displayName: users.display_name,
        },
      })
      .from(messages)
      .leftJoin(users, eq(messages.sender_id, users.id))
      .where(and(eq(messages.receiver_id, userId), eq(messages.is_read, false)))
      .orderBy(desc(messages.created_at))
      .limit(10);

    // Send to user
    ws.send(
      JSON.stringify({
        type: "unread_messages",
        count: unreadCount,
        messages: unreadMessages,
        timestamp: new Date().toISOString(),
      })
    );
  } catch (error) {
    console.error("Error getting unread messages count:", error);
  }
}

// Send message to specific user (all connections)
function sendToUser(userId, message) {
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
function isUserOnline(userId) {
  return userStatus.get(userId) === "online";
}

// Set user as online
function setUserOnline(userId) {
  userStatus.set(userId, "online");

  // Broadcast status change to followers
  broadcastUserStatus(userId, "online");
}

// Handle user disconnect
function handleUserDisconnect(userId, ws) {
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

    // Broadcast status change to followers
    broadcastUserStatus(userId, "offline");
  }
}

// Broadcast user status change to followers
async function broadcastUserStatus(userId, status) {
  try {
    // Get user's followers
    const followers = await db
      .select({ followerId: user_followers.follower_id })
      .from(user_followers)
      .where(eq(user_followers.following_id, userId));

    // Get user info
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        id: true,
        username: true,
        display_name: true,
      },
    });

    if (!user) return;

    // Create status update message
    const statusMessage = {
      type: "user_status",
      userId: user.id,
      username: user.username,
      displayName: user.display_name,
      status,
      timestamp: new Date().toISOString(),
    };

    // Send to all online followers
    followers.forEach((follower) => {
      if (isUserOnline(follower.followerId)) {
        sendToUser(follower.followerId, statusMessage);
      }
    });
  } catch (error) {
    console.error("Error broadcasting user status:", error);
  }
}

// Get all online users (for admin purposes)
function getOnlineUsers() {
  return Array.from(userStatus.entries())
    .filter(([userId, status]) => status === "online")
    .map(([userId]) => userId);
}

module.exports = {
  initializeWebSocket,
  sendToUser,
  isUserOnline,
  getOnlineUsers,
};
