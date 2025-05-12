const express = require("express");
const { storage } = require("../storage");
const { authenticate } = require("../utils/auth.js");

const router = express.Router();

// Anonymous recommendations (trending/popular courses)
router.get("/recommendations/anonymous", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const offset = parseInt(req.query.offset) || 0;
    // Placeholder: Fetch top 10 trending/popular courses
    // Replace with real DB query in production
    const courses = [
      {
        id: "6001",
        title: "Artificial Intelligence Ethics",
        shortIntro:
          "Explore the ethical implications of AI systems and learn frameworks for responsible AI development.",
        category: "Computer Science",
        subCategory: "AI Ethics",
        courseType: "Video Course",
        language: "English",
        site: "MIT OpenCourseWare",
        instructors: "Sarah Johnson",
        rating: 4.9,
        duration: "4 weeks",
        enrollments: 45000,
        price: 0,
        lastUpdated: "2023-10-05",
        trending: true,
      },
      {
        id: "7123",
        title: "Digital Marketing Fundamentals",
        shortIntro: "Master the core concepts and tools of digital marketing.",
        category: "Business",
        subCategory: "Digital Marketing",
        courseType: "Interactive Course",
        language: "English",
        site: "Udemy",
        instructors: "Elena Rodriguez",
        rating: 4.4,
        duration: "8 weeks",
        enrollments: 120000,
        price: 29.99,
        originalPrice: 149.99,
        lastUpdated: "2023-09-18",
        trending: true,
      },
      // ... more mock courses ...
    ];
    // Slice for pagination
    const paged = courses.slice(offset, offset + limit);
    res.json(paged);
  } catch (error) {
    console.error("Error fetching anonymous recommendations:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch anonymous recommendations" });
  }
});

// Personalized recommendations (content-based, AI-powered)
router.get("/recommendations", authenticate, async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    const limit = parseInt(req.query.limit) || 5;
    const offset = parseInt(req.query.offset) || 0;
    const recommendations = await storage.generateRecommendations(userId, limit, offset);
    res.json(recommendations);
  } catch (error) {
    console.error("Error generating personalized recommendations:", error);
    res.status(500).json({ message: "Failed to generate recommendations" });
  }
});

module.exports = router;
