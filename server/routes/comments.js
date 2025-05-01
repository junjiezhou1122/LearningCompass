const express = require("express");
const router = express.Router();
const { authenticateJWT } = require("../utils/auth");

// In-memory store for comments (in production, use your database)
const comments = [];
let commentIdCounter = 1;

// Get comments for a post
router.get("/learning-posts/:postId/comments", (req, res) => {
  try {
    const postId = parseInt(req.params.postId);

    // Filter comments for this post
    const postComments = comments.filter(
      (comment) => comment.postId === postId
    );

    res.json(postComments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ message: "Failed to fetch comments" });
  }
});

// Create a new comment
router.post("/learning-posts/:postId/comments", authenticateJWT, (req, res) => {
  try {
    const postId = parseInt(req.params.postId);
    const { content } = req.body;
    const userId = req.user.id;

    if (!content || content.trim() === "") {
      return res
        .status(400)
        .json({ message: "Comment content cannot be empty" });
    }

    console.log(`Adding comment for user ${userId} on post ${postId}`);

    // Create new comment
    const newComment = {
      id: commentIdCounter++,
      postId,
      userId,
      content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      user: {
        id: userId,
        username: req.user.username || `user_${userId.substring(0, 8)}`,
      },
    };

    // Add to comments list
    comments.push(newComment);

    res.status(201).json(newComment);
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).json({ message: "Failed to create comment" });
  }
});

// Delete a comment
router.delete(
  "/learning-post-comments/:commentId",
  authenticateJWT,
  (req, res) => {
    try {
      const commentId = parseInt(req.params.commentId);
      const userId = req.user.id;

      // Find comment
      const commentIndex = comments.findIndex((c) => c.id === commentId);

      if (commentIndex === -1) {
        return res.status(404).json({ message: "Comment not found" });
      }

      // Check if user owns this comment
      if (comments[commentIndex].userId !== userId) {
        return res
          .status(403)
          .json({ message: "You can only delete your own comments" });
      }

      // Remove the comment
      comments.splice(commentIndex, 1);

      res.json({ success: true, commentId });
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ message: "Failed to delete comment" });
    }
  }
);

// Like/unlike endpoints (these would complement the comment functionality)
router.get("/learning-posts/:postId/like", authenticateJWT, (req, res) => {
  // For demonstration - in production, query your database
  res.json({ liked: false, count: 0 });
});

router.post("/learning-posts/:postId/like", authenticateJWT, (req, res) => {
  // For demonstration - in production, add to your database
  res.json({ liked: true, count: 1 });
});

router.delete("/learning-posts/:postId/like", authenticateJWT, (req, res) => {
  // For demonstration - in production, remove from your database
  res.json({ liked: false, count: 0 });
});

module.exports = router;
