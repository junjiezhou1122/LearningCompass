const express = require("express");
const router = express.Router();
const { authenticateJWT } = require("../utils/auth");

// Store bookmarks in memory for now (you'll want to use your database in production)
const userBookmarks = new Map();

// Check if a post is bookmarked by the current user
router.get("/learning-posts/:postId/bookmark", authenticateJWT, (req, res) => {
  try {
    const postId = parseInt(req.params.postId);
    const userId = req.user.id;

    console.log(
      `Checking bookmark status for user ${userId} on post ${postId}`
    );

    // Get user's bookmarks
    const userBookmarksList = userBookmarks.get(userId) || [];

    // Check if post is bookmarked
    const isBookmarked = userBookmarksList.includes(postId);

    res.json({
      bookmarked: isBookmarked,
    });
  } catch (error) {
    console.error("Error checking bookmark status:", error);
    res.status(500).json({ message: "Failed to check bookmark status" });
  }
});

// Bookmark a post
router.post("/learning-posts/:postId/bookmark", authenticateJWT, (req, res) => {
  try {
    const postId = parseInt(req.params.postId);
    const userId = req.user.id;

    console.log(`Adding bookmark for user ${userId} on post ${postId}`);

    // Get user's bookmarks
    let userBookmarksList = userBookmarks.get(userId) || [];

    // Add bookmark if not already bookmarked
    if (!userBookmarksList.includes(postId)) {
      userBookmarksList.push(postId);
      userBookmarks.set(userId, userBookmarksList);
    }

    res.json({
      bookmarked: true,
    });
  } catch (error) {
    console.error("Error adding bookmark:", error);
    res.status(500).json({ message: "Failed to bookmark post" });
  }
});

// Remove a bookmark
router.delete(
  "/learning-posts/:postId/bookmark",
  authenticateJWT,
  (req, res) => {
    try {
      const postId = parseInt(req.params.postId);
      const userId = req.user.id;

      console.log(`Removing bookmark for user ${userId} on post ${postId}`);

      // Get user's bookmarks
      let userBookmarksList = userBookmarks.get(userId) || [];

      // Remove bookmark if exists
      if (userBookmarksList.includes(postId)) {
        userBookmarksList = userBookmarksList.filter((id) => id !== postId);
        userBookmarks.set(userId, userBookmarksList);
      }

      res.json({
        bookmarked: false,
      });
    } catch (error) {
      console.error("Error removing bookmark:", error);
      res.status(500).json({ message: "Failed to remove bookmark" });
    }
  }
);

module.exports = router;
