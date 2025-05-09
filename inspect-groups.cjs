require("dotenv").config();
const { db, sql } = require("./server/config/db.js");

async function inspectGroups() {
  try {
    // Check the chat_groups table
    console.log("CHAT_GROUPS TABLE:");
    const groupsColumns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'chat_groups'`;
    console.log(groupsColumns);

    // Check the group_members table
    console.log("\nGROUP_MEMBERS TABLE:");
    const membersColumns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'group_members'`;
    console.log(membersColumns);

    // Test a user follow - add test data
    console.log("\nINSERTING TEST FOLLOW RELATIONSHIPS:");
    await sql`
      INSERT INTO user_follows (follower_id, following_id, created_at)
      VALUES (1, 3, NOW()), (3, 1, NOW())
      ON CONFLICT DO NOTHING`;

    // Verify follow relationships
    console.log("\nVERIFYING FOLLOW RELATIONSHIPS:");
    const follows1to3 = await sql`
      SELECT * FROM user_follows 
      WHERE follower_id = 1 AND following_id = 3`;
    console.log("User 1 follows 3:", follows1to3.length > 0);

    const follows3to1 = await sql`
      SELECT * FROM user_follows 
      WHERE follower_id = 3 AND following_id = 1`;
    console.log("User 3 follows 1:", follows3to1.length > 0);
  } catch (err) {
    console.error("Error inspecting database:", err);
  } finally {
    process.exit(0);
  }
}

inspectGroups();
