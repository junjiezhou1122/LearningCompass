const express = require("express");
const router = express.Router();
const { admin } = require("../config/firebase-admin");
const { generateToken } = require("../utils/auth");
const { db } = require("../db");
const { users } = require("@shared/schema");
const { eq } = require("drizzle-orm");
const bcrypt = require("bcrypt");

// Google Sign In
router.post("/google", async (req, res) => {
  try {
    // Ensure we set the content type for the response
    res.setHeader("Content-Type", "application/json");

    const { token } = req.body;
    console.log(
      "Received Google auth request with token:",
      token ? "Token exists" : "No token"
    );

    if (!token) {
      return res.status(400).json({ message: "No token provided" });
    }

    // Verify the Google ID token
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(token);
      console.log("Token verified successfully");
    } catch (verifyError) {
      console.error("Token verification failed:", verifyError);
      return res.status(401).json({
        message: "Invalid token",
        error: verifyError.message,
      });
    }

    // Get user info from the decoded token
    const { uid, email, name, picture } = decodedToken;
    console.log("Verified Google user:", email, "with UID:", uid);

    if (!email) {
      console.error("No email found in decoded token");
      return res
        .status(400)
        .json({ message: "No email found in Google account" });
    }

    // Check if the user already exists in the database by email
    let dbUser;
    try {
      dbUser = await db.query.users.findFirst({
        where: eq(users.email, email),
      });
      console.log(
        "Database lookup result:",
        dbUser ? "User found" : "User not found"
      );
    } catch (dbError) {
      console.error("Database lookup error:", dbError);
      return res.status(500).json({
        message: "Database error when looking up user",
        error: dbError.message,
      });
    }

    // If user doesn't exist, create a new one
    if (!dbUser) {
      console.log("Creating new user for Google sign-in:", email);

      // Generate a random password for Google users
      const randomPassword = Math.random().toString(36).slice(-12);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      // Use name as username but make it unique by adding part of the UID
      const usernameBase = name || email.split("@")[0];
      const username = `${usernameBase}_${uid.substring(0, 6)}`;

      // Create new user in database
      const newUser = {
        username: username,
        email: email,
        password: hashedPassword,
        firstName: name ? name.split(" ")[0] : "",
        lastName: name ? name.split(" ").slice(1).join(" ") : "",
        createdAt: new Date().toISOString(),
        authProvider: "google",
        providerId: uid,
      };

      try {
        const insertResult = await db.insert(users).values(newUser).returning();
        dbUser = insertResult[0];
        console.log(
          "Created new user from Google sign-in:",
          dbUser.username,
          "with ID:",
          dbUser.id
        );
      } catch (insertError) {
        console.error("Error creating new user:", insertError);
        return res.status(500).json({
          message: "Failed to create new user",
          error: insertError.message,
        });
      }
    } else {
      console.log(
        "Existing user signed in with Google:",
        dbUser.username,
        "with ID:",
        dbUser.id
      );

      // Update the providerId if it doesn't exist yet
      if (!dbUser.providerId) {
        try {
          await db
            .update(users)
            .set({
              authProvider: "google",
              providerId: uid,
              // Update profile photo if available and user doesn't have one
              ...(picture && !dbUser.photoURL ? { photoURL: picture } : {}),
            })
            .where(eq(users.id, dbUser.id));

          // Refresh the user data after update
          dbUser = await db.query.users.findFirst({
            where: eq(users.id, dbUser.id),
          });

          console.log("Updated existing user with Google provider ID");
        } catch (updateError) {
          console.error("Error updating user with provider ID:", updateError);
          // Continue with login even if update fails
        }
      }
    }

    // Create a user object from the database data
    const userObject = {
      id: dbUser.id,
      email: dbUser.email,
      username: dbUser.username,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      photoURL: dbUser.photoURL || picture,
      // Make sure authProvider and providerId are included in the user object
      authProvider: dbUser.authProvider || "google",
      providerId: dbUser.providerId || uid,
    };

    // Generate a JWT token for the user
    const customToken = generateToken(userObject);

    // Return user data and token
    const responseData = {
      user: userObject,
      token: customToken,
    };

    console.log("Sending successful Google auth response");
    return res.status(200).json(responseData);
  } catch (error) {
    console.error("Error in Google authentication:", error);
    return res.status(500).json({
      message: "Authentication failed",
      error: error.message,
    });
  }
});

// GitHub Sign In
router.post("/github", async (req, res) => {
  try {
    // Ensure we set the content type for the response
    res.setHeader("Content-Type", "application/json");

    const { token } = req.body;
    console.log(
      "Received GitHub auth request with token:",
      token ? "Token exists" : "No token"
    );

    if (!token) {
      return res.status(400).json({ message: "No token provided" });
    }

    // Verify the GitHub ID token
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(token);
      console.log("Token verified successfully");
    } catch (verifyError) {
      console.error("Token verification failed:", verifyError);
      return res.status(401).json({
        message: "Invalid token",
        error: verifyError.message,
      });
    }

    // Get user info from the decoded token
    const { uid, email, name, picture } = decodedToken;
    console.log("Verified GitHub user:", email, "with UID:", uid);

    // For GitHub, email might not be available or verified
    if (!email) {
      console.error("No email found in decoded token");
      return res
        .status(400)
        .json({ message: "No email found in GitHub account" });
    }

    // Check if the user already exists in the database by email
    let dbUser;
    try {
      dbUser = await db.query.users.findFirst({
        where: eq(users.email, email),
      });
      console.log(
        "Database lookup result:",
        dbUser ? "User found" : "User not found"
      );
    } catch (dbError) {
      console.error("Database lookup error:", dbError);
      return res.status(500).json({
        message: "Database error when looking up user",
        error: dbError.message,
      });
    }

    // If user doesn't exist, create a new one
    if (!dbUser) {
      console.log("Creating new user for GitHub sign-in:", email);

      // Generate a random password for GitHub users
      const randomPassword = Math.random().toString(36).slice(-12);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      // Use name as username but make it unique by adding part of the UID
      const usernameBase = name || email.split("@")[0] || `github_user`;
      const username = `${usernameBase}_${uid.substring(0, 6)}`;

      // Create new user in database
      const newUser = {
        username: username,
        email: email,
        password: hashedPassword,
        firstName: name ? name.split(" ")[0] : "",
        lastName: name ? name.split(" ").slice(1).join(" ") : "",
        photoURL: picture,
        createdAt: new Date().toISOString(),
        authProvider: "github",
        providerId: uid,
      };

      try {
        const insertResult = await db.insert(users).values(newUser).returning();
        dbUser = insertResult[0];
        console.log(
          "Created new user from GitHub sign-in:",
          dbUser.username,
          "with ID:",
          dbUser.id
        );
      } catch (insertError) {
        console.error("Error creating new user:", insertError);
        return res.status(500).json({
          message: "Failed to create new user",
          error: insertError.message,
        });
      }
    } else {
      console.log(
        "Existing user signed in with GitHub:",
        dbUser.username,
        "with ID:",
        dbUser.id
      );

      // Update the providerId if it doesn't exist yet
      if (!dbUser.providerId) {
        try {
          await db
            .update(users)
            .set({
              authProvider: "github",
              providerId: uid,
              // Update profile photo if available and user doesn't have one
              ...(picture && !dbUser.photoURL ? { photoURL: picture } : {}),
            })
            .where(eq(users.id, dbUser.id));

          // Refresh the user data after update
          dbUser = await db.query.users.findFirst({
            where: eq(users.id, dbUser.id),
          });

          console.log("Updated existing user with GitHub provider ID");
        } catch (updateError) {
          console.error("Error updating user with provider ID:", updateError);
          // Continue with login even if update fails
        }
      }
    }

    // Create a user object from the database data
    const userObject = {
      id: dbUser.id,
      email: dbUser.email,
      username: dbUser.username,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      photoURL: dbUser.photoURL || picture,
      // Make sure authProvider and providerId are included in the user object
      authProvider: dbUser.authProvider || "github",
      providerId: dbUser.providerId || uid,
    };

    // Generate a JWT token for the user
    const customToken = generateToken(userObject);

    // Return user data and token
    const responseData = {
      user: userObject,
      token: customToken,
    };

    console.log("Sending successful GitHub auth response");
    return res.status(200).json(responseData);
  } catch (error) {
    console.error("Error in GitHub authentication:", error);
    return res.status(500).json({
      message: "Authentication failed",
      error: error.message,
    });
  }
});

// Export as ES Module default export
module.exports = router;
