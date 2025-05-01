const express = require("express");
const router = express.Router();
const { admin } = require("../config/firebase-admin");

// Google Sign In
router.post("/google", async (req, res) => {
  try {
    const { token } = req.body;

    // Verify the Google ID token
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Get or create user in your database
    const { uid, email, name, picture } = decodedToken;

    // Create a custom token for the client
    const customToken = await admin.auth().createCustomToken(uid);

    // Return user data and token
    res.json({
      user: {
        id: uid,
        email,
        username: name,
        photoURL: picture,
      },
      token: customToken,
    });
  } catch (error) {
    console.error("Error in Google authentication:", error);
    res.status(500).json({
      message: "Authentication failed",
      error: error.message,
    });
  }
});

module.exports = router;
