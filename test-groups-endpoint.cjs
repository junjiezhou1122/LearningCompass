require("dotenv").config();
const { sql } = require("./server/config/db.js");
const fetch = require("node-fetch");

async function testGroupsEndpoint() {
  try {
    console.log("Getting JWT token for test...");

    // Use hardcoded test credentials
    const testUsername = "junjiezhou"; // Username from your database
    const testPassword = "password123"; // You'll need to use the actual password

    console.log(`Using username: ${testUsername}`);

    // First, let's get a valid token
    const loginResponse = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: testUsername,
        password: testPassword,
      }),
    });

    if (!loginResponse.ok) {
      const errorData = await loginResponse.json();
      throw new Error(`Login failed: ${JSON.stringify(errorData)}`);
    }

    const { token } = await loginResponse.json();
    console.log("Got token:", token ? "✅" : "❌");

    if (!token) {
      throw new Error("No token received from login");
    }

    console.log("Testing /api/chat/groups/user endpoint...");
    const groupsResponse = await fetch(
      "http://localhost:5000/api/chat/groups/user",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("Response status:", groupsResponse.status);

    if (!groupsResponse.ok) {
      const errorText = await groupsResponse.text();
      throw new Error(
        `Failed to fetch groups: ${groupsResponse.status} ${errorText}`
      );
    }

    const groups = await groupsResponse.json();
    console.log("Groups found:", groups.length);
    console.log("Groups:", JSON.stringify(groups, null, 2));

    // Also test the groups creation endpoint
    console.log("\nTesting group creation...");
    const createGroupResponse = await fetch(
      "http://localhost:5000/api/chat/groups",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: "Test Group " + Date.now(),
          memberIds: [3], // Use ID of a user who follows you and you follow back
        }),
      }
    );

    console.log("Create group response status:", createGroupResponse.status);

    if (createGroupResponse.ok) {
      const newGroup = await createGroupResponse.json();
      console.log("Created group:", JSON.stringify(newGroup, null, 2));
    } else {
      const errorText = await createGroupResponse.text();
      console.error(
        `Failed to create group: ${createGroupResponse.status} ${errorText}`
      );
    }
  } catch (error) {
    console.error("Error in test:", error);
  }
}

testGroupsEndpoint();
