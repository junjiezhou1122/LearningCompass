const express = require("express");
const router = express.Router();
const { db, sql } = require("../config/db");
const { authenticate } = require("../utils/auth");
const { eq, and, or, desc, asc } = require("drizzle-orm");
const {
  messages,
  users,
  user_follows,
  chat_groups,
  group_members,
  group_messages,
} = require("../config/schema");

// Get chat history with a specific user
router.get("/messages/:userId", authenticate, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const otherUserId = req.params.userId;

    // First check if users can chat with each other (must follow each other)
    const canChat = await checkIfUsersCanChat(currentUserId, otherUserId);

    if (!canChat) {
      return res.status(403).json({
        error:
          "Cannot access chat history with this user. You must follow each other to chat.",
      });
    }

    // Get messages between users, ordered by creation time
    const chatMessages = await db
      .select({
        id: messages.id,
        content: messages.content,
        createdAt: messages.created_at,
        updatedAt: messages.updated_at,
        senderId: messages.sender_id,
        receiverId: messages.receiver_id,
        isRead: messages.is_read,
        sender: {
          id: users.id,
          username: users.username,
          displayName: users.display_name,
          profileImage: users.profile_image,
        },
      })
      .from(messages)
      .leftJoin(users, eq(messages.sender_id, users.id))
      .where(
        or(
          and(
            eq(messages.sender_id, currentUserId),
            eq(messages.receiver_id, otherUserId)
          ),
          and(
            eq(messages.sender_id, otherUserId),
            eq(messages.receiver_id, currentUserId)
          )
        )
      )
      .orderBy(asc(messages.created_at));

    // Mark unread messages as read
    await db
      .update(messages)
      .set({ is_read: true })
      .where(
        and(
          eq(messages.sender_id, otherUserId),
          eq(messages.receiver_id, currentUserId),
          eq(messages.is_read, false)
        )
      );

    return res.json(chatMessages);
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    return res.status(500).json({ error: "Failed to fetch chat messages" });
  }
});

// Get recent chat partners
router.get("/partners", authenticate, async (req, res) => {
  try {
    const currentUserId = req.user.id;

    // Find users who have exchanged messages with the current user
    const recentPartners = await db.query.messages.findMany({
      columns: {},
      with: {
        sender: {
          columns: {
            id: true,
            username: true,
            display_name: true,
            profile_image: true,
          },
        },
        receiver: {
          columns: {
            id: true,
            username: true,
            display_name: true,
            profile_image: true,
          },
        },
      },
      where: or(
        eq(messages.sender_id, currentUserId),
        eq(messages.receiver_id, currentUserId)
      ),
      orderBy: [desc(messages.created_at)],
    });

    // Extract unique partners
    const partnersMap = new Map();

    recentPartners.forEach((message) => {
      if (message.sender_id === currentUserId) {
        // The other user is the receiver
        if (!partnersMap.has(message.receiver.id)) {
          partnersMap.set(message.receiver.id, {
            id: message.receiver.id,
            username: message.receiver.username,
            displayName: message.receiver.display_name,
            profileImage: message.receiver.profile_image,
            lastMessage: message.content,
            lastMessageTime: message.created_at,
          });
        }
      } else {
        // The other user is the sender
        if (!partnersMap.has(message.sender.id)) {
          partnersMap.set(message.sender.id, {
            id: message.sender.id,
            username: message.sender.username,
            displayName: message.sender.display_name,
            profileImage: message.sender.profile_image,
            lastMessage: message.content,
            lastMessageTime: message.created_at,
            unreadCount: message.is_read ? 0 : 1,
          });
        } else if (!message.is_read) {
          // Increment unread count if message is not read
          const partner = partnersMap.get(message.sender.id);
          partner.unreadCount = (partner.unreadCount || 0) + 1;
          partnersMap.set(message.sender.id, partner);
        }
      }
    });

    // Convert map to array and sort by most recent message
    const partners = Array.from(partnersMap.values()).sort(
      (a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
    );

    return res.json(partners);
  } catch (error) {
    console.error("Error fetching chat partners:", error);
    return res.status(500).json({ error: "Failed to fetch chat partners" });
  }
});

// Check if two users can chat with each other (they must follow each other)
router.get("/can-chat/:userId", authenticate, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const otherUserId = req.params.userId;

    const canChat = await checkIfUsersCanChat(currentUserId, otherUserId);

    return res.json({ canChat });
  } catch (error) {
    console.error("Error checking if users can chat:", error);
    return res.status(500).json({ error: "Failed to check if users can chat" });
  }
});

// Get recent chats (both direct and group)
router.get("/recent", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get recent direct chats
    const directChats = await getRecentDirectChats(userId);

    // Get user's group chats
    const groupChats = await getRecentGroupChats(userId);

    // Combine and sort by most recent message
    const allChats = [...directChats, ...groupChats].sort(
      (a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
    );

    return res.json(allChats);
  } catch (error) {
    console.error("Error fetching recent chats:", error);
    return res.status(500).json({ error: "Failed to fetch recent chats" });
  }
});

// Get all user's group chats
router.get("/groups/user", authenticate, async (req, res) => {
  try {
    // Ensure we have valid user information
    if (!req.user || !req.user.id) {
      console.error("Missing user information in request");
      return res.status(401).json({ error: "Authentication required" });
    }

    const userId = req.user.id;
    console.log("GET /groups/user called by user:", userId);

    // Parse userId to integer
    const userIdNum = parseInt(userId);
    if (isNaN(userIdNum)) {
      console.error("Invalid userId format:", userId);
      return res.status(400).json({ error: "Invalid user ID format" });
    }

    // Get all groups the user is a member of using try/catch for error handling
    let userGroupsResult;
    try {
      userGroupsResult = await sql`
        SELECT g.id, g.name, g.description, g.image_url as "imageUrl", 
               g.created_at as "createdAt", gm.is_admin as "isAdmin"
        FROM chat_groups g
        JOIN group_members gm ON g.id = gm.group_id
        WHERE gm.user_id = ${userIdNum}
        ORDER BY g.created_at DESC
      `;
      console.log(
        `Found ${userGroupsResult.length} groups for user ${userIdNum}`
      );
    } catch (sqlError) {
      console.error("SQL error in fetching user groups:", sqlError);
      return res.status(500).json({
        error: "Database error when fetching groups",
        message: sqlError.message,
      });
    }

    if (!userGroupsResult || userGroupsResult.length === 0) {
      console.log(`No groups found for user ${userIdNum}`);
      return res.json([]);
    }

    try {
      // Diagnostic: log the raw userGroupsResult
      console.log("Raw userGroupsResult:", JSON.stringify(userGroupsResult));
      // For each group, get the last message and member count
      const groupsWithDetails = await Promise.all(
        userGroupsResult.map(async (group) => {
          // Diagnostic: log each group object before parsing groupId
          console.log("Processing group object:", JSON.stringify(group));
          // Ensure group ID is a number
          const groupId = parseInt(group.id);
          if (isNaN(groupId) || groupId <= 0) {
            console.warn(
              "Skipping invalid group ID in group_members:",
              group.id
            );
            return null;
          }

          // Get last message
          let lastMessage = null;
          let lastMessageTime = null;
          try {
            const lastMessageResult = await sql`
              SELECT gm.content, gm.created_at as "createdAt", 
                     u.id as "senderId", u.username as "senderUsername", 
                     u.first_name as "senderFirstName", u.last_name as "senderLastName"
              FROM group_messages gm
              JOIN users u ON gm.sender_id = u.id
              WHERE gm.group_id = ${groupId}
              ORDER BY gm.created_at DESC
              LIMIT 1
            `;

            if (lastMessageResult && lastMessageResult.length > 0) {
              const msg = lastMessageResult[0];
              const senderDisplayName =
                `${msg.senderFirstName || ""} ${
                  msg.senderLastName || ""
                }`.trim() || msg.senderUsername;
              lastMessage = `${senderDisplayName}: ${msg.content}`;
              lastMessageTime = msg.createdAt;
            }
          } catch (msgError) {
            console.error(
              `Error fetching last message for group ${groupId}:`,
              msgError
            );
            // Continue with null last message
          }

          // Get member count
          let memberCount = 0;
          try {
            const memberCountResult = await sql`
              SELECT COUNT(*) as "memberCount"
              FROM group_members
              WHERE group_id = ${groupId}
            `;
            memberCount = parseInt(memberCountResult[0]?.memberCount) || 0;
          } catch (countError) {
            console.error(
              `Error fetching member count for group ${groupId}:`,
              countError
            );
            // Continue with 0 member count
          }

          // Return the complete group info
          return {
            id: groupId,
            name: group.name,
            description: group.description,
            imageUrl: group.imageUrl,
            createdAt: group.createdAt,
            isAdmin: group.isAdmin,
            lastMessage: lastMessage || "No messages yet",
            lastMessageTime: lastMessageTime || group.createdAt,
            memberCount: memberCount,
            type: "group",
          };
        })
      );

      // Filter out any null entries (from errors)
      const validGroups = groupsWithDetails.filter((group) => group !== null);
      console.log(`Returning ${validGroups.length} valid groups`);

      return res.json(validGroups);
    } catch (detailsError) {
      console.error("Error processing group details:", detailsError);
      return res.status(500).json({
        error: "Error processing group details",
        message: detailsError.message,
      });
    }
  } catch (error) {
    console.error("Error fetching user's group chats:", error);
    console.error("Stack trace:", error.stack);
    return res.status(500).json({
      error: "Failed to fetch group chats",
      message: error.message,
    });
  }
});

// Get group chat details
router.get("/groups/:groupId", authenticate, async (req, res) => {
  try {
    // Ensure we have valid user information
    if (!req.user || !req.user.id) {
      console.error("Missing user information in request");
      return res.status(401).json({ error: "Authentication required" });
    }

    // Parse groupId to integer
    const groupId = parseInt(req.params.groupId, 10);
    if (isNaN(groupId)) {
      console.error("Invalid groupId format:", req.params.groupId);
      return res.status(400).json({ error: "Invalid group ID format" });
    }
    const userId = req.user.id;

    console.log(
      `Fetching group details for groupId:${groupId}, userId:${userId}`
    );

    // Parse userId to integer
    const userIdNum = parseInt(userId);
    if (isNaN(userIdNum)) {
      console.error("Invalid userId format:", userId);
      return res.status(400).json({ error: "Invalid user ID format" });
    }

    // Check if user is a member of the group using raw SQL to avoid NeonDbError
    let isMember = null;
    try {
      const memberResult = await sql`
        SELECT * FROM group_members WHERE group_id = ${groupId} AND user_id = ${userId} LIMIT 1
      `;
      isMember = memberResult[0];
    } catch (sqlError) {
      console.error("SQL error in group membership check:", sqlError);
      return res.status(500).json({
        error: "Database error when checking group membership",
        message: sqlError.message,
      });
    }

    if (!isMember) {
      console.log(`User ${userIdNum} is not a member of group ${groupId}`);
      return res
        .status(403)
        .json({ error: "You are not a member of this group" });
    }

    console.log(
      `User ${userIdNum} is a member of group ${groupId}, fetching details`
    );

    // Get group data with members
    const group = await getGroupWithMembers(groupId);

    if (!group) {
      console.log(`Group ${groupId} not found`);
      return res.status(404).json({ error: "Group not found" });
    }

    console.log(`Successfully retrieved group ${groupId} details`);
    return res.json(group);
  } catch (error) {
    console.error("Error fetching group chat details:", error);
    console.error("Stack trace:", error.stack);
    return res.status(500).json({
      error: "Failed to fetch group chat details",
      message: error.message,
    });
  }
});

// Get group chat messages
router.get("/groups/:groupId/messages", authenticate, async (req, res) => {
  // Diagnostic: log request method and headers
  console.log("Request method:", req.method, "Headers:", req.headers);
  try {
    // Parse groupId to integer
    const groupId = parseInt(req.params.groupId, 10);
    if (isNaN(groupId)) {
      console.error("Invalid groupId format:", req.params.groupId);
      return res.status(400).json({ error: "Invalid group ID format" });
    }
    // Parse userId to integer
    const userId = parseInt(req.user.id, 10);
    if (isNaN(userId)) {
      console.error("Invalid userId format:", req.user.id);
      return res.status(400).json({ error: "Invalid user ID format" });
    }

    // Diagnostic: log groupId and userId values and types
    console.log(
      "Fetching group messages with groupId:",
      groupId,
      typeof groupId,
      "userId:",
      userId,
      typeof userId
    );

    // Check if user is a member of the group using raw SQL to avoid NeonDbError
    let isMember = null;
    try {
      const memberResult = await sql`
        SELECT * FROM group_members WHERE group_id = ${groupId} AND user_id = ${userId} LIMIT 1
      `;
      isMember = memberResult[0];
    } catch (sqlError) {
      console.error("SQL error in group membership check:", sqlError);
      return res.status(500).json({
        error: "Database error when checking group membership",
        message: sqlError.message,
      });
    }

    if (!isMember) {
      return res
        .status(403)
        .json({ error: "You are not a member of this group" });
    }

    // Get messages from the group using raw SQL to avoid NeonDbError
    let groupMessages = [];
    try {
      groupMessages = await sql`
        SELECT 
          gm.id, gm.content, gm.created_at as "createdAt", gm.updated_at as "updatedAt",
          gm.sender_id as "senderId", gm.group_id as "groupId",
          u.id as "userId", u.username
        FROM group_messages gm
        LEFT JOIN users u ON gm.sender_id = u.id
        WHERE gm.group_id = ${groupId}
        ORDER BY gm.created_at ASC
      `;
      // Map sender info into a nested object for frontend compatibility
      groupMessages = groupMessages.map((msg) => ({
        id: msg.id,
        content: msg.content,
        createdAt: msg.createdAt,
        updatedAt: msg.updatedAt,
        senderId: msg.senderId,
        groupId: msg.groupId,
        sender: {
          id: msg.userId,
          username: msg.username,
          displayName: msg.username, // fallback to username
          profileImage: null, // fallback to null
        },
      }));
    } catch (sqlError) {
      console.error("SQL error in group messages fetch:", sqlError);
      return res.status(500).json({
        error: "Database error when fetching group messages",
        message: sqlError.message,
      });
    }

    return res.json(groupMessages);
  } catch (error) {
    console.error("Error fetching group chat messages:", error);
    if (error && error.stack) {
      console.error("Stack trace:", error.stack);
    }
    return res.status(500).json({
      error: "Failed to fetch group chat messages",
      message: error && error.message,
    });
  }
});

// Send message to group chat
router.post("/groups/:groupId/messages", authenticate, async (req, res) => {
  try {
    const { content } = req.body;
    const groupId = req.params.groupId;
    const senderId = req.user.id;

    if (!content) {
      return res.status(400).json({ error: "Message content is required" });
    }

    // Check if user is a member of the group
    const isMember = await db
      .select()
      .from(group_members)
      .where(
        and(
          eq(group_members.group_id, groupId),
          eq(group_members.user_id, senderId)
        )
      )
      .then((rows) => rows[0]);

    if (!isMember) {
      return res
        .status(403)
        .json({ error: "You are not a member of this group" });
    }

    // Create message
    const [newMessage] = await db
      .insert(group_messages)
      .values({
        content,
        sender_id: senderId,
        group_id: groupId,
        created_at: new Date(),
      })
      .returning();

    // Get complete message data with sender info
    const messageWithSender = await db
      .select({
        id: group_messages.id,
        content: group_messages.content,
        createdAt: group_messages.created_at,
        updatedAt: group_messages.updated_at,
        senderId: group_messages.sender_id,
        groupId: group_messages.group_id,
        sender: {
          id: users.id,
          username: users.username,
          displayName: users.display_name,
          profileImage: users.profile_image,
        },
      })
      .from(group_messages)
      .leftJoin(users, eq(group_messages.sender_id, users.id))
      .where(eq(group_messages.id, newMessage.id))
      .then((rows) => rows[0]);

    return res.status(201).json(messageWithSender);
  } catch (error) {
    console.error("Error sending group message:", error);
    return res.status(500).json({ error: "Failed to send group message" });
  }
});

// Create a new group chat
router.post("/groups", authenticate, async (req, res) => {
  try {
    console.log("Incoming group creation request:", req.body);
    const { name, memberIds } = req.body;
    const creatorId = parseInt(req.user.id);
    console.log("Parsed creatorId:", creatorId);
    if (isNaN(creatorId)) {
      console.error("Invalid creatorId:", req.user.id);
      return res.status(400).json({ error: "Invalid creatorId" });
    }

    if (
      !name ||
      !memberIds ||
      !Array.isArray(memberIds) ||
      memberIds.length === 0
    ) {
      return res
        .status(400)
        .json({ error: "Invalid group data. Name and members are required." });
    }

    // Verify all members can chat with the creator (they follow each other)
    for (const memberIdRaw of memberIds) {
      const memberId = parseInt(memberIdRaw);
      console.log("Parsed memberId:", memberId, "from raw:", memberIdRaw);
      if (isNaN(memberId)) {
        console.error("Invalid memberId:", memberIdRaw);
        return res
          .status(400)
          .json({ error: `Invalid memberId: ${memberIdRaw}` });
      }
      const canChat = await checkIfUsersCanChat(creatorId, memberId);
      if (!canChat) {
        // Use SQL directly to get username
        const memberResult = await sql`
          SELECT username FROM users WHERE id = ${memberId} LIMIT 1
        `;
        const memberUsername =
          memberResult.length > 0 ? memberResult[0].username : memberId;

        return res.status(403).json({
          error: `Cannot add user ${memberUsername} to group. You must follow each other to add them.`,
        });
      }
    }

    // Create group chat using raw SQL
    console.log("Creating new group with name:", name);
    const now = new Date().toISOString();
    const newGroupResult = await sql`
      INSERT INTO chat_groups (name, creator_id, created_at, updated_at)
      VALUES (${name}, ${creatorId}, ${now}, ${now})
      RETURNING id, name, creator_id, created_at, updated_at
    `;

    if (!newGroupResult || newGroupResult.length === 0) {
      return res.status(500).json({ error: "Failed to create group" });
    }

    const newGroup = newGroupResult[0];
    console.log("Group created:", newGroup);

    // Add creator as admin
    await sql`
      INSERT INTO group_members (group_id, user_id, is_admin, joined_at)
      VALUES (${newGroup.id}, ${creatorId}, true, ${now})
    `;

    // Add other members
    for (const memberIdRaw of memberIds) {
      const memberId = parseInt(memberIdRaw);
      if (memberId !== creatorId) {
        // Don't add creator twice
        await sql`
          INSERT INTO group_members (group_id, user_id, is_admin, joined_at)
          VALUES (${newGroup.id}, ${memberId}, false, ${now})
        `;
      }
    }

    // Get complete group data with members
    const group = await getGroupWithMembers(newGroup.id);

    return res.status(201).json(group);
  } catch (error) {
    console.error("Error creating group chat:", error);
    return res.status(500).json({ error: "Failed to create group chat" });
  }
});

// Delete a group (creator only)
router.delete("/groups/:groupId", authenticate, async (req, res) => {
  try {
    const groupId = parseInt(req.params.groupId, 10);
    const userId = parseInt(req.user.id, 10);

    // Check if user is the creator
    const group =
      await sql`SELECT * FROM chat_groups WHERE id = ${groupId} LIMIT 1`;
    if (!group[0]) return res.status(404).json({ error: "Group not found" });
    if (group[0].creator_id !== userId) {
      return res
        .status(403)
        .json({ error: "Only the group creator can delete this group" });
    }

    // Manually delete group members and messages first (if no ON DELETE CASCADE)
    await sql`DELETE FROM group_members WHERE group_id = ${groupId}`;
    await sql`DELETE FROM group_messages WHERE group_id = ${groupId}`;
    // Now delete the group
    await sql`DELETE FROM chat_groups WHERE id = ${groupId}`;
    return res.status(204).send();
  } catch (error) {
    console.error("Error deleting group:", error);
    return res.status(500).json({ error: "Failed to delete group" });
  }
});

// Remove a member from a group (creator only, cannot remove self)
router.delete(
  "/groups/:groupId/members/:userId",
  authenticate,
  async (req, res) => {
    try {
      const groupId = parseInt(req.params.groupId, 10);
      const userId = parseInt(req.params.userId, 10);
      const requesterId = parseInt(req.user.id, 10);

      // Check if group exists and requester is creator
      const group =
        await sql`SELECT * FROM chat_groups WHERE id = ${groupId} LIMIT 1`;
      if (!group[0]) return res.status(404).json({ error: "Group not found" });
      if (group[0].creator_id !== requesterId) {
        return res
          .status(403)
          .json({ error: "Only the group creator can remove members" });
      }
      if (userId === requesterId) {
        return res
          .status(403)
          .json({ error: "Creator cannot remove themselves from the group" });
      }

      // Check if user is a member
      const member =
        await sql`SELECT * FROM group_members WHERE group_id = ${groupId} AND user_id = ${userId} LIMIT 1`;
      if (!member[0])
        return res
          .status(404)
          .json({ error: "User is not a member of this group" });

      // Remove the member
      await sql`DELETE FROM group_members WHERE group_id = ${groupId} AND user_id = ${userId}`;
      return res.status(204).send();
    } catch (error) {
      console.error("Error removing group member:", error);
      return res.status(500).json({ error: "Failed to remove group member" });
    }
  }
);

// Helper function to check if users can chat with each other
async function checkIfUsersCanChat(userId1, userId2) {
  try {
    console.log("checkIfUsersCanChat called with:", userId1, userId2);
    const id1 = parseInt(userId1);
    const id2 = parseInt(userId2);

    if (isNaN(id1) || isNaN(id2)) {
      console.error(
        "Invalid userId(s) in checkIfUsersCanChat:",
        userId1,
        userId2
      );
      throw new Error("Invalid userId(s) in checkIfUsersCanChat");
    }

    // Use plain SQL queries instead of Drizzle ORM
    console.log("Checking if user", id1, "follows user", id2);
    const follows1to2Result = await sql`
      SELECT * FROM user_follows 
      WHERE follower_id = ${id1} AND following_id = ${id2}
      LIMIT 1
    `;
    console.log("follows1to2Result:", follows1to2Result);

    console.log("Checking if user", id2, "follows user", id1);
    const follows2to1Result = await sql`
      SELECT * FROM user_follows 
      WHERE follower_id = ${id2} AND following_id = ${id1}
      LIMIT 1
    `;
    console.log("follows2to1Result:", follows2to1Result);

    const follows1to2 = follows1to2Result.length > 0;
    const follows2to1 = follows2to1Result.length > 0;

    console.log("Follow status:", { follows1to2, follows2to1 });
    return follows1to2 && follows2to1;
  } catch (err) {
    console.error("Error in checkIfUsersCanChat:", err);
    // Return false instead of throwing to prevent group creation from failing
    return false;
  }
}

// Helper to get recent direct chats
async function getRecentDirectChats(userId) {
  // Find most recent message with each chat partner
  const recentMessages = await db.query.messages.findMany({
    where: or(eq(messages.sender_id, userId), eq(messages.receiver_id, userId)),
    orderBy: [desc(messages.created_at)],
    with: {
      sender: {
        columns: {
          id: true,
          username: true,
          display_name: true,
          profile_image: true,
        },
      },
      receiver: {
        columns: {
          id: true,
          username: true,
          display_name: true,
          profile_image: true,
        },
      },
    },
  });

  // Process messages to get unique partners with their last message
  const partnersMap = new Map();

  recentMessages.forEach((message) => {
    const partnerId =
      message.sender_id === userId ? message.receiver_id : message.sender_id;

    const partner =
      message.sender_id === userId ? message.receiver : message.sender;

    if (!partnersMap.has(partnerId)) {
      const unreadCount =
        message.sender_id !== userId && !message.is_read ? 1 : 0;

      partnersMap.set(partnerId, {
        id: partnerId,
        username: partner.username,
        displayName: partner.display_name,
        profileImage: partner.profile_image,
        lastMessage: message.content,
        lastMessageTime: message.created_at,
        unreadCount,
        type: "direct",
      });
    }
  });

  return Array.from(partnersMap.values());
}

// Helper to get recent group chats
async function getRecentGroupChats(userId) {
  // Get groups the user is a member of
  const userGroups = await db.query.group_members.findMany({
    where: eq(group_members.user_id, userId),
    with: {
      group: true,
    },
  });

  const groupChats = [];

  // For each group, get the most recent message
  for (const membership of userGroups) {
    const group = membership.group;

    // Get most recent message in the group
    const recentMessage = await db.query.group_messages.findFirst({
      where: eq(group_messages.group_id, group.id),
      orderBy: [desc(group_messages.created_at)],
      with: {
        sender: {
          columns: {
            username: true,
          },
        },
      },
    });

    // Get member count
    const memberCount = await db
      .select({ count: count() })
      .from(group_members)
      .where(eq(group_members.group_id, group.id))
      .then((rows) => rows[0]?.count || 0);

    groupChats.push({
      id: group.id,
      name: group.name,
      lastMessage: recentMessage
        ? `${recentMessage.sender.username}: ${recentMessage.content}`
        : "No messages yet",
      lastMessageTime: recentMessage?.created_at || group.created_at,
      memberCount,
      isAdmin: membership.is_admin,
      type: "group",
    });
  }

  return groupChats;
}

// Helper to get group with members - replace with raw SQL
async function getGroupWithMembers(groupId) {
  try {
    console.log("Getting group data for groupId:", groupId);

    // Validate groupId is a number
    const groupIdNum = parseInt(groupId);
    if (isNaN(groupIdNum)) {
      console.error("Invalid groupId:", groupId);
      return null;
    }

    // Get group data
    const groupResult = await sql`
      SELECT id, name, created_at, updated_at, creator_id
      FROM chat_groups
      WHERE id = ${groupIdNum}
      LIMIT 1
    `;

    if (!groupResult || groupResult.length === 0) {
      console.log("No group found with ID:", groupIdNum);
      return null;
    }

    const group = groupResult[0];
    console.log("Found group:", group.id, group.name);

    // Get creator info - handle the case where creator_id might be null
    let creator = null;
    if (group.creator_id) {
      const creatorId = parseInt(group.creator_id);

      if (!isNaN(creatorId)) {
        try {
          const creatorResult = await sql`
            SELECT id, username, first_name, last_name, photo_url as "profileImage"
            FROM users
            WHERE id = ${creatorId}
            LIMIT 1
          `;

          if (creatorResult && creatorResult.length > 0) {
            creator = {
              ...creatorResult[0],
              displayName:
                `${creatorResult[0].first_name || ""} ${
                  creatorResult[0].last_name || ""
                }`.trim() || creatorResult[0].username,
            };
          }
        } catch (error) {
          console.error("Error fetching creator info:", error);
          // Continue execution even if creator info can't be fetched
        }
      }
    }

    // Get group members with error handling
    let members = [];
    try {
      const membersResult = await sql`
        SELECT 
          u.id, 
          u.username, 
          u.first_name, 
          u.last_name, 
          u.photo_url as "profileImage",
          gm.is_admin as "isAdmin"
        FROM group_members gm
        INNER JOIN users u ON gm.user_id = u.id
        WHERE gm.group_id = ${groupIdNum}
      `;

      console.log(
        `Found ${membersResult.length} members for group ${groupIdNum}`
      );

      members = membersResult.map((member) => ({
        id: member.id,
        username: member.username,
        firstName: member.first_name,
        lastName: member.last_name,
        profileImage: member.profileImage,
        isAdmin: member.isAdmin,
        displayName:
          `${member.first_name || ""} ${member.last_name || ""}`.trim() ||
          member.username,
      }));
    } catch (error) {
      console.error("Error fetching group members:", error);
      // Return an empty array for members if there's an error
      members = [];
    }

    return {
      id: group.id,
      name: group.name,
      createdAt: group.created_at,
      updatedAt: group.updated_at,
      creator,
      members,
    };
  } catch (error) {
    console.error("Error in getGroupWithMembers:", error);
    console.error("Stack trace:", error.stack);
    // Return null instead of throwing to prevent request from failing
    return null;
  }
}

module.exports = router;
