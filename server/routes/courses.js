import express from "express";
import { db } from "../config/db.js";
import { authenticate } from "../utils/auth.js";

const router = express.Router();

// Get all courses
router.get("/", async (req, res) => {
  try {
    // Extract query parameters
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    const category = req.query.category;
    const subCategory = req.query.subCategory;
    const courseType = req.query.courseType;
    const language = req.query.language;
    const search = req.query.search;
    const sortBy = req.query.sortBy || "newest";

    // Mock data - in production, this would query your database
    const courses = [
      {
        id: "1",
        title: "Introduction to Machine Learning",
        shortIntro:
          "Learn the fundamentals of machine learning algorithms and techniques.",
        category: "Computer Science",
        subCategory: "Machine Learning",
        courseType: "Video Course",
        language: "English",
        site: "Coursera",
        instructors: "Andrew Ng",
        rating: 4.8,
        duration: "8 weeks",
        enrollments: 2500000,
        price: 0,
        lastUpdated: "2023-01-15",
      },
      {
        id: "2",
        title: "JavaScript for Beginners",
        shortIntro: "Start your journey into web development with JavaScript.",
        category: "Programming",
        subCategory: "Web Development",
        courseType: "Interactive Course",
        language: "English",
        site: "Udemy",
        instructors: "John Smith",
        rating: 4.5,
        duration: "10 hours",
        enrollments: 150000,
        price: 19.99,
        originalPrice: 99.99,
        lastUpdated: "2023-05-20",
      },
      {
        id: "5787",
        title: "Data Science: Visualization",
        shortIntro:
          "Learn powerful techniques for visualizing and communicating insights from data.",
        category: "Data Science",
        subCategory: "Data Visualization",
        courseType: "Video Course",
        language: "English",
        site: "edX",
        instructors: "David Kim",
        rating: 4.6,
        duration: "6 weeks",
        enrollments: 85000,
        price: 0,
        lastUpdated: "2023-07-12",
      },
      {
        id: "5880",
        title: "Design Thinking: Insights to Inspiration",
        shortIntro:
          "Learn how to approach problems creatively using design thinking methodology.",
        category: "Business",
        subCategory: "Innovation",
        courseType: "Video Course",
        language: "English",
        site: "Coursera",
        instructors: "Jeanne M. Liedtka",
        rating: 4.7,
        duration: "Approx. 13 hours",
        enrollments: 75000,
        price: 0,
        lastUpdated: "2023-08-10",
      },
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
      },
    ];

    // Return filtered courses
    res.json(courses);
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({ message: "Failed to fetch courses" });
  }
});

// Get course count
router.get("/count", async (req, res) => {
  try {
    // Extract filter parameters
    const category = req.query.category;
    const subCategory = req.query.subCategory;
    const courseType = req.query.courseType;
    const language = req.query.language;
    const search = req.query.search;

    // Mock count - in production, this would be a database count
    res.json({ count: 42 });
  } catch (error) {
    console.error("Error fetching course count:", error);
    res.status(500).json({ message: "Failed to fetch course count" });
  }
});

// Get categories
router.get("/categories", async (req, res) => {
  try {
    // Mock data - in production, this would be from your database
    const categories = [
      "Computer Science",
      "Programming",
      "Data Science",
      "Business",
      "Mathematics",
      "Language Learning",
    ];
    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Failed to fetch categories" });
  }
});

// Get subcategories
router.get("/subcategories", async (req, res) => {
  try {
    const category = req.query.category;

    // Mock data - in production, this would be filtered from your database
    const subcategories = [
      "Machine Learning",
      "Web Development",
      "Mobile Development",
      "Database Design",
      "Algorithms",
    ];
    res.json(subcategories);
  } catch (error) {
    console.error("Error fetching subcategories:", error);
    res.status(500).json({ message: "Failed to fetch subcategories" });
  }
});

// Get course types
router.get("/course-types", async (req, res) => {
  try {
    // Mock data - in production, this would be from your database
    const courseTypes = [
      "Video Course",
      "Interactive Course",
      "Specialization",
      "Certification",
      "Degree Program",
    ];
    res.json(courseTypes);
  } catch (error) {
    console.error("Error fetching course types:", error);
    res.status(500).json({ message: "Failed to fetch course types" });
  }
});

// Get languages
router.get("/languages", async (req, res) => {
  try {
    // Mock data - in production, this would be from your database
    const languages = [
      "English",
      "Spanish",
      "French",
      "German",
      "Mandarin",
      "Japanese",
    ];
    res.json(languages);
  } catch (error) {
    console.error("Error fetching languages:", error);
    res.status(500).json({ message: "Failed to fetch languages" });
  }
});

// Get a specific course by ID
router.get("/:id", async (req, res) => {
  try {
    const rawCourseId = req.params.id;
    console.log(`[Server] GET /api/courses/${rawCourseId} - Request received`);
    console.log(
      `[Server] Raw course ID type: ${typeof rawCourseId}, value: ${rawCourseId}`
    );

    // Normalize the course ID - handle multiple formats
    const courseId = String(rawCourseId).trim();
    console.log(`[Server] Normalized course ID: ${courseId}`);

    // Mock data - in production, this would query your database by ID
    // Here, we have hardcoded sample data for courses
    // Using string keys to match URL parameters which are always strings
    const courses = {
      1: {
        id: "1",
        title: "Introduction to Machine Learning",
        shortIntro:
          "Learn the fundamentals of machine learning algorithms and techniques.",
        description:
          "This course provides a broad introduction to machine learning, data mining, and statistical pattern recognition. Topics include: (i) Supervised learning (parametric/non-parametric algorithms, support vector machines, kernels, neural networks). (ii) Unsupervised learning (clustering, dimensionality reduction, recommender systems, deep learning). (iii) Best practices in machine learning (bias/variance theory; innovation process in machine learning and AI).",
        category: "Computer Science",
        subCategory: "Machine Learning",
        courseType: "Video Course",
        language: "English",
        site: "Coursera",
        instructors: "Andrew Ng",
        rating: 4.8,
        duration: "8 weeks",
        enrollments: 2500000,
        price: 0,
        lastUpdated: "2023-01-15",
        url: "https://www.coursera.org/learn/machine-learning",
        level: "Intermediate",
        skills: [
          "Machine Learning",
          "Python",
          "Neural Networks",
          "Data Analysis",
          "Algorithms",
        ],
        prerequisites: "Basic programming experience and knowledge of algebra",
        syllabus:
          "Week 1: Introduction\nWeek 2: Linear Regression\nWeek 3: Classification\nWeek 4: Neural Networks\nWeek 5: Regularization\nWeek 6: Support Vector Machines\nWeek 7: Clustering\nWeek 8: Dimensionality Reduction",
        modules: [
          {
            title: "Introduction to Machine Learning",
            duration: "2 hours",
            lessons: [
              { title: "What is Machine Learning?", duration: "20 min" },
              {
                title: "Supervised vs Unsupervised Learning",
                duration: "25 min",
              },
              { title: "Model Evaluation", duration: "35 min" },
            ],
          },
          {
            title: "Linear Regression",
            duration: "3 hours",
            lessons: [
              { title: "Simple Linear Regression", duration: "40 min" },
              { title: "Multiple Linear Regression", duration: "45 min" },
              { title: "Gradient Descent", duration: "55 min" },
            ],
          },
        ],
      },
      2: {
        id: "2",
        title: "JavaScript for Beginners",
        shortIntro: "Start your journey into web development with JavaScript.",
        description:
          "This comprehensive course teaches you JavaScript from scratch. You'll learn all the fundamentals of JavaScript programming, how to work with the DOM, create interactive web pages, handle events, and build modern web applications. By the end of this course, you'll have the skills to create your own web applications using JavaScript.",
        category: "Programming",
        subCategory: "Web Development",
        courseType: "Interactive Course",
        language: "English",
        site: "Udemy",
        instructors: "John Smith",
        rating: 4.5,
        duration: "10 hours",
        enrollments: 150000,
        price: 19.99,
        originalPrice: 99.99,
        lastUpdated: "2023-05-20",
        url: "https://www.udemy.com/course/javascript-beginners/",
        level: "Beginner",
        skills: [
          "JavaScript",
          "HTML",
          "CSS",
          "Web Development",
          "DOM Manipulation",
        ],
        prerequisites:
          "Basic knowledge of HTML and CSS is helpful but not required",
        modules: [
          {
            title: "JavaScript Basics",
            duration: "3 hours",
            lessons: [
              { title: "Variables and Data Types", duration: "30 min" },
              { title: "Operators and Expressions", duration: "35 min" },
              { title: "Control Flow", duration: "45 min" },
              { title: "Functions", duration: "50 min" },
            ],
          },
          {
            title: "Working with the DOM",
            duration: "4 hours",
            lessons: [
              { title: "DOM Selection", duration: "45 min" },
              { title: "Manipulating DOM Elements", duration: "55 min" },
              { title: "Event Handling", duration: "60 min" },
              { title: "Forms and Validation", duration: "70 min" },
            ],
          },
        ],
      },
      5787: {
        id: "5787",
        title: "Data Science: Visualization",
        shortIntro:
          "Learn powerful techniques for visualizing and communicating insights from data.",
        description:
          "Data visualization is an essential component of any data science project. This course will teach you how to create compelling visualizations that effectively communicate your findings to any audience. You'll learn how to choose the right visualization type for your data, how to design clear and informative graphics, and how to build interactive dashboards using modern tools.",
        category: "Data Science",
        subCategory: "Data Visualization",
        courseType: "Video Course",
        language: "English",
        site: "edX",
        instructors: "David Kim",
        rating: 4.6,
        duration: "6 weeks",
        enrollments: 85000,
        price: 0,
        lastUpdated: "2023-07-12",
        url: "https://www.edx.org/learn/data-science-visualization",
        level: "Intermediate",
        skills: ["Data Visualization", "Python", "R", "Tableau", "D3.js"],
        prerequisites: "Basic knowledge of statistics and programming",
        modules: [
          {
            title: "Introduction to Data Visualization",
            duration: "2 hours",
            lessons: [
              { title: "Why Visualization Matters", duration: "30 min" },
              {
                title: "Principles of Effective Visualization",
                duration: "45 min",
              },
              { title: "Tools Overview", duration: "45 min" },
            ],
          },
          {
            title: "Visualization in Python",
            duration: "3 hours",
            lessons: [
              { title: "Matplotlib Fundamentals", duration: "60 min" },
              {
                title: "Seaborn for Statistical Visualization",
                duration: "60 min",
              },
              { title: "Interactive Visuals with Plotly", duration: "60 min" },
            ],
          },
        ],
      },
      5880: {
        id: "5880",
        title: "Design Thinking: Insights to Inspiration",
        shortIntro:
          "Learn how to approach problems creatively using design thinking methodology.",
        description:
          "Design thinking is a powerful approach to innovation that emphasizes understanding user needs, challenging assumptions, and redefining problems to identify alternative strategies and solutions. This course will teach you the fundamentals of design thinking and how to apply it to business challenges.",
        category: "Business",
        subCategory: "Innovation",
        courseType: "Video Course",
        language: "English",
        site: "Coursera",
        instructors: "Jeanne M. Liedtka",
        rating: 4.7,
        duration: "Approx. 13 hours to complete",
        enrollments: 75000,
        price: 0,
        lastUpdated: "2023-08-10",
        url: "https://www.coursera.org/learn/design-thinking-innovation",
        level: "Intermediate",
        skills: [
          "Design Thinking",
          "Innovation",
          "Problem Solving",
          "User Research",
        ],
        prerequisites: "No prerequisites required",
        modules: [
          {
            title: "Introduction to Design Thinking",
            duration: "3 hours",
            lessons: [
              { title: "What is Design Thinking?", duration: "30 min" },
              { title: "The Design Thinking Process", duration: "45 min" },
              { title: "Empathy and User-Centered Design", duration: "40 min" },
            ],
          },
          {
            title: "Problem Framing and Ideation",
            duration: "4 hours",
            lessons: [
              { title: "Defining the Problem", duration: "50 min" },
              { title: "Brainstorming Techniques", duration: "60 min" },
              { title: "Prototyping Solutions", duration: "70 min" },
            ],
          },
        ],
      },
      6001: {
        id: "6001",
        title: "Artificial Intelligence Ethics",
        shortIntro:
          "Explore the ethical implications of AI systems and learn frameworks for responsible AI development.",
        description:
          "As AI systems become more prevalent in society, ensuring their ethical development and use becomes increasingly important. This course covers key ethical concepts related to AI, including fairness, accountability, transparency, and privacy. You'll examine real-world case studies and learn frameworks for making ethical decisions in AI development.",
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
        url: "https://ocw.mit.edu/courses/ai-ethics",
        level: "Advanced",
        skills: [
          "AI Ethics",
          "Critical Thinking",
          "Policy Analysis",
          "Responsible AI",
        ],
        prerequisites:
          "Basic understanding of artificial intelligence concepts",
        modules: [
          {
            title: "Ethical Foundations",
            duration: "2 hours",
            lessons: [
              { title: "Introduction to Ethics in AI", duration: "40 min" },
              { title: "Key Ethical Principles", duration: "40 min" },
              { title: "Ethical Frameworks", duration: "40 min" },
            ],
          },
          {
            title: "AI Fairness",
            duration: "2 hours",
            lessons: [
              { title: "Bias and Discrimination in AI", duration: "40 min" },
              { title: "Measuring Fairness", duration: "40 min" },
              { title: "Mitigating Bias", duration: "40 min" },
            ],
          },
        ],
      },
      7123: {
        id: "7123",
        title: "Digital Marketing Fundamentals",
        shortIntro: "Master the core concepts and tools of digital marketing.",
        description:
          "This comprehensive course covers all aspects of digital marketing in today's fast-paced digital landscape. You'll learn how to create effective marketing strategies across multiple channels, how to optimize content for search engines, how to leverage social media platforms, and how to measure your results with analytics tools.",
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
        url: "https://www.udemy.com/course/digital-marketing-fundamentals",
        level: "Beginner",
        skills: [
          "Digital Marketing",
          "SEO",
          "Social Media Marketing",
          "Content Strategy",
          "Analytics",
        ],
        prerequisites: "No prior experience required",
        modules: [
          {
            title: "Digital Marketing Strategy",
            duration: "3 hours",
            lessons: [
              {
                title: "Understanding the Digital Landscape",
                duration: "60 min",
              },
              { title: "Setting Marketing Goals", duration: "60 min" },
              { title: "Building a Marketing Plan", duration: "60 min" },
            ],
          },
          {
            title: "Search Engine Optimization",
            duration: "4 hours",
            lessons: [
              { title: "On-Page SEO", duration: "80 min" },
              { title: "Off-Page SEO", duration: "80 min" },
              { title: "Technical SEO", duration: "80 min" },
            ],
          },
        ],
      },
    };

    console.log(
      `[Server] Available course IDs: ${Object.keys(courses).join(", ")}`
    );

    // Look up the course by ID - try multiple formats for more robustness
    let course = null;

    // Try direct lookup first
    if (courses[courseId]) {
      course = courses[courseId];
      console.log(`[Server] Found course with direct ID lookup: ${courseId}`);
    }
    // If not found, try with the normalized ID
    else if (courses[courseId.toString()]) {
      course = courses[courseId.toString()];
      console.log(
        `[Server] Found course with string ID lookup: ${courseId.toString()}`
      );
    }
    // If still not found, try with a number conversion (for numeric IDs)
    else if (!isNaN(Number(courseId)) && courses[Number(courseId)]) {
      course = courses[Number(courseId)];
      console.log(
        `[Server] Found course with numeric ID lookup: ${Number(courseId)}`
      );
    }
    // If still not found, try case-insensitive search against course titles
    else {
      // Try to find by title match as last resort
      const lowercaseQuery = courseId.toLowerCase();
      const matchedCourse = Object.values(courses).find((c) =>
        c.title.toLowerCase().includes(lowercaseQuery)
      );

      if (matchedCourse) {
        course = matchedCourse;
        console.log(
          `[Server] Found course by title match: ${matchedCourse.title}`
        );
      }
    }

    if (!course) {
      console.log(`[Server] Course not found for ID: ${courseId}`);
      return res.status(404).json({
        message: "Course not found",
        requestedId: courseId,
        availableIds: Object.keys(courses),
      });
    }

    console.log(
      `[Server] Returning course: ${course.title} (ID: ${course.id})`
    );
    res.json(course);
  } catch (error) {
    console.error("[Server] Error fetching course:", error);
    res.status(500).json({
      message: "Failed to fetch course",
      error: error.message,
      requestedId: req.params.id,
    });
  }
});

// Get reviews for a specific course
router.get("/:id/reviews", async (req, res) => {
  try {
    const courseId = req.params.id;

    // Mock data for reviews - in production, this would query your database
    const reviews = [
      {
        id: "101",
        courseId: "1",
        content:
          "This is an excellent course! The concepts are explained very clearly, and the exercises really help reinforce the learning.",
        rating: 5,
        createdAt: "2023-04-15T10:30:00Z",
        user: {
          id: "u1",
          name: "Jane Smith",
          avatar: null,
        },
      },
      {
        id: "102",
        courseId: "1",
        content:
          "Great course overall, though some of the assignments were quite challenging. The instructor explains everything thoroughly.",
        rating: 4,
        createdAt: "2023-03-22T15:45:00Z",
        user: {
          id: "u2",
          name: "Michael Johnson",
          avatar: null,
        },
      },
      {
        id: "103",
        courseId: "2",
        content:
          "A fantastic introduction to JavaScript! The teacher explains everything in a way that's easy to understand.",
        rating: 5,
        createdAt: "2023-06-10T09:15:00Z",
        user: {
          id: "u3",
          name: "Sarah Wilson",
          avatar: null,
        },
      },
    ];

    // Filter reviews for the specific course
    const courseReviews = reviews.filter(
      (review) => review.courseId === courseId
    );

    res.json(courseReviews);
  } catch (error) {
    console.error("Error fetching course reviews:", error);
    res.status(500).json({ message: "Failed to fetch course reviews" });
  }
});

// Add a review to a course
router.post("/:id/reviews", authenticate, async (req, res) => {
  try {
    const courseId = req.params.id;
    const { content, rating } = req.body;

    if (!content) {
      return res.status(400).json({ message: "Review content is required" });
    }

    // For now, just return a mock review - in production, this would be stored in the database
    const newReview = {
      id: Date.now().toString(),
      courseId,
      content,
      rating: rating || null,
      createdAt: new Date().toISOString(),
      user: {
        id: req.user.id,
        name: req.user.displayName || req.user.name || "User",
        avatar: req.user.avatar,
      },
    };

    res.status(201).json(newReview);
  } catch (error) {
    console.error("Error adding course review:", error);
    res.status(500).json({ message: "Failed to add review" });
  }
});

export default router;
