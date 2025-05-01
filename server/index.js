const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const bookmarkRoutes = require("./routes/bookmarks");
const commentRoutes = require("./routes/comments");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api", bookmarkRoutes);
app.use("/api", commentRoutes);

// Simple posts route for testing
app.get("/api/learning-posts/:id", (req, res) => {
  // Mock data for testing
  res.json({
    id: parseInt(req.params.id),
    title: "Learning Post " + req.params.id,
    content: "This is a sample post content for testing.",
    userId: "sample-user-id",
    type: "thought",
    createdAt: new Date().toISOString(),
    views: 42,
    tags: ["learning", "education"],
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something broke!", error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
