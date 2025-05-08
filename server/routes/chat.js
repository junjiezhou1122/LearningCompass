const express = require("express");
const router = express.Router();
const { db } = require("../config/db");
const { authenticate } = require("../utils/auth");
const { eq, and, or, desc, asc } = require("drizzle-orm");
const {
  messages,
  users,
  user_followers,
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

// Create a new group chat
router.post("/groups", authenticate, async (req, res) => {
  try {
    const { name, memberIds } = req.body;
    const creatorId = req.user.id;

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
    for (const memberId of memberIds) {
      const canChat = await checkIfUsersCanChat(creatorId, memberId);
      if (!canChat) {
        const member = await db.query.users.findFirst({
          where: eq(users.id, memberId),
          columns: { username: true },
        });

        return res.status(403).json({
          error: `Cannot add user ${
            member?.username || memberId
          } to group. You must follow each other to add them.`,
        });
      }
    }

    // Create group chat
    const [newGroup] = await db
      .insert(chat_groups)
      .values({
        name,
        creator_id: creatorId,
        created_at: new Date(),
      })
      .returning();

    // Add creator and members to the group
    const membershipValues = [
      { group_id: newGroup.id, user_id: creatorId, is_admin: true },
      ...memberIds.map((memberId) => ({
        group_id: newGroup.id,
        user_id: memberId,
        is_admin: false,
      })),
    ];

    await db.insert(group_members).values(membershipValues);

    // Get complete group data with members
    const group = await getGroupWithMembers(newGroup.id);

    return res.status(201).json(group);
  } catch (error) {
    console.error("Error creating group chat:", error);
    return res.status(500).json({ error: "Failed to create group chat" });
  }
});

// Get group chat details
router.get("/groups/:groupId", authenticate, async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const userId = req.user.id;

    // Check if user is a member of the group
    const isMember = await db.query.group_members.findFirst({
      where: and(
        eq(group_members.group_id, groupId),
        eq(group_members.user_id, userId)
      ),
    });

    if (!isMember) {
      return res
        .status(403)
        .json({ error: "You are not a member of this group" });
    }

    // Get group data with members
    const group = await getGroupWithMembers(groupId);

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    return res.json(group);
  } catch (error) {
    console.error("Error fetching group chat details:", error);
    return res
      .status(500)
      .json({ error: "Failed to fetch group chat details" });
  }
});

// Get group chat messages
router.get("/groups/:groupId/messages", authenticate, async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const userId = req.user.id;

    // Check if user is a member of the group
    const isMember = await db.query.group_members.findFirst({
      where: and(
        eq(group_members.group_id, groupId),
        eq(group_members.user_id, userId)
      ),
    });

    if (!isMember) {
      return res
        .status(403)
        .json({ error: "You are not a member of this group" });
    }

    // Get messages from the group
    const groupMessages = await db
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
      .where(eq(group_messages.group_id, groupId))
      .orderBy(asc(group_messages.created_at));

    return res.json(groupMessages);
  } catch (error) {
    console.error("Error fetching group chat messages:", error);
    return res
      .status(500)
      .json({ error: "Failed to fetch group chat messages" });
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
    const isMember = await db.query.group_members.findFirst({
      where: and(
        eq(group_members.group_id, groupId),
        eq(group_members.user_id, senderId)
      ),
    });

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

// Helper function to check if users can chat with each other
async function checkIfUsersCanChat(userId1, userId2) {
  // Users can chat if they follow each other
  const follows1to2 = await db.query.user_followers.findFirst({
    where: and(
      eq(user_followers.follower_id, userId1),
      eq(user_followers.following_id, userId2)
    ),
  });

  const follows2to1 = await db.query.user_followers.findFirst({
    where: and(
      eq(user_followers.follower_id, userId2),
      eq(user_followers.following_id, userId1)
    ),
  });

  return !!follows1to2 && !!follows2to1;
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

// Helper to get group with members
async function getGroupWithMembers(groupId) {
  // Get group data
  const group = await db.query.chat_groups.findFirst({
    where: eq(chat_groups.id, groupId),
    with: {
      creator: {
        columns: {
          id: true,
          username: true,
          display_name: true,
          profile_image: true,
        },
      },
    },
  });

  if (!group) return null;

  // Get group members
  const members = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.display_name,
      profileImage: users.profile_image,
      isAdmin: group_members.is_admin,
    })
    .from(group_members)
    .innerJoin(users, eq(group_members.user_id, users.id))
    .where(eq(group_members.group_id, groupId));

  return {
    id: group.id,
    name: group.name,
    createdAt: group.created_at,
    updatedAt: group.updated_at,
    creator: group.creator,
    members,
  };
}

module.exports = router;
