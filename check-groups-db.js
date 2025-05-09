import dotenv from "dotenv";
import { db, sql } from "./server/config/db.js";

dotenv.config();

async function checkDatabase() {
  try {
    console.log("CHECKING CHAT GROUPS TABLE:");
    const groups = await sql`SELECT * FROM chat_groups`;
    console.log(JSON.stringify(groups, null, 2));

    console.log("\nCHECKING GROUP MEMBERS TABLE:");
    const members = await sql`SELECT * FROM group_members`;
    console.log(JSON.stringify(members, null, 2));

    console.log("\nUSER DATA FOR COMPARISON:");
    const users =
      await sql`SELECT id, username, first_name, last_name FROM users LIMIT 5`;
    console.log(JSON.stringify(users, null, 2));
  } catch (err) {
    console.error("Error querying database:", err);
  }
}

checkDatabase();
