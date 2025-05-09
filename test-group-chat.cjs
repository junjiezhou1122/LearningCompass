require("dotenv").config();
const { db, sql } = require("./server/config/db.js");

async function testGroupChat() {
  try {
    // Ensure mutual follow relationships exist
    console.log("Setting up follow relationship between users 1 and 3...");
    await sql`
      INSERT INTO user_follows (follower_id, following_id, created_at)
      VALUES (1, 3, NOW()), (3, 1, NOW())
      ON CONFLICT DO NOTHING
    `;

    // Create a test group directly via SQL
    console.log("Creating test group...");
    const now = new Date().toISOString();
    const groupResult = await sql`
      INSERT INTO chat_groups (name, creator_id, created_at, updated_at)
      VALUES ('Test Group Direct SQL', 1, ${now}, ${now})
      RETURNING id
    `;

    if (groupResult.length === 0) {
      throw new Error("Failed to create test group");
    }

    const groupId = groupResult[0].id;
    console.log("Test group created with ID:", groupId);

    // Add creator as admin
    await sql`
      INSERT INTO group_members (group_id, user_id, is_admin, joined_at)
      VALUES (${groupId}, 1, true, ${now})
    `;

    // Add member
    await sql`
      INSERT INTO group_members (group_id, user_id, is_admin, joined_at)
      VALUES (${groupId}, 3, false, ${now})
    `;

    console.log("Group members added successfully");

    // Get group data
    console.log("Retrieving group data with members...");
    const groupWithMembers = await getGroupWithMembers(groupId);
    console.log(
      "Group with members:",
      JSON.stringify(groupWithMembers, null, 2)
    );

    console.log("Test successful!");
  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    process.exit(0);
  }
}

// Copy of the fixed function
async function getGroupWithMembers(groupId) {
  try {
    // Get group data
    const groupResult = await sql`
      SELECT id, name, created_at, updated_at, creator_id
      FROM chat_groups
      WHERE id = ${groupId}
      LIMIT 1
    `;

    if (!groupResult || groupResult.length === 0) {
      return null;
    }

    const group = groupResult[0];

    // Get creator info
    const creatorResult = await sql`
      SELECT id, username, first_name, last_name, photo_url as "profileImage"
      FROM users
      WHERE id = ${group.creator_id}
      LIMIT 1
    `;

    const creator =
      creatorResult.length > 0
        ? {
            ...creatorResult[0],
            displayName:
              `${creatorResult[0].first_name || ""} ${
                creatorResult[0].last_name || ""
              }`.trim() || creatorResult[0].username,
          }
        : null;

    // Get group members
    const membersResult = await sql`
      SELECT u.id, u.username, u.first_name, u.last_name, 
             u.photo_url as "profileImage", gm.is_admin as "isAdmin"
      FROM group_members gm
      INNER JOIN users u ON gm.user_id = u.id
      WHERE gm.group_id = ${groupId}
    `;

    const members =
      membersResult.map((member) => ({
        ...member,
        displayName:
          `${member.first_name || ""} ${member.last_name || ""}`.trim() ||
          member.username,
      })) || [];

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
    return null;
  }
}

testGroupChat();
