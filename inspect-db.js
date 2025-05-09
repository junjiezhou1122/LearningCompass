require("dotenv").config();
const { db, sql } = require("./server/config/db.js");

async function inspectDB() {
  try {
    // Check the users table
    console.log("USERS TABLE:");
    const usersColumns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'`;
    console.log(usersColumns);

    // Check the user_follows table
    console.log("\nUSER_FOLLOWS TABLE:");
    const followsColumns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'user_follows'`;
    console.log(followsColumns);

    // Also check if user_followers table exists
    console.log("\nCHECKING IF user_followers EXISTS:");
    const followersTable = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'user_followers'`;
    console.log(followersTable);

    // Test a follow relationship
    console.log("\nTEST USER FOLLOWS RELATIONSHIP FOR USER 1 AND 3:");
    const followRelationship = await sql`
      SELECT * FROM user_follows 
      WHERE follower_id = 1 AND following_id = 3`;
    console.log(followRelationship);

    const reverseFollowRelationship = await sql`
      SELECT * FROM user_follows 
      WHERE follower_id = 3 AND following_id = 1`;
    console.log(reverseFollowRelationship);
  } catch (err) {
    console.error("Error inspecting database:", err);
  } finally {
    process.exit(0);
  }
}

inspectDB();
