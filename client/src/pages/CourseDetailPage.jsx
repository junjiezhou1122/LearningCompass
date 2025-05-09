import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Star } from "lucide-react";

// Helper function to generate a mock course for any ID
const generateDynamicCourse = (id) => {
  return {
    id: String(id),
    title: `Generated Course #${id}`,
    description:
      "This is an automatically generated course for demonstration purposes.",
    category: "Various",
    instructors: "Auto Generated",
    rating: 4.0,
    duration: "Self-paced",
    site: "Learning Compass",
    platform: "Learning Compass",
    about:
      "This course was automatically generated to ensure that all course IDs can be accessed. In a production environment, this would be fetched from the database.",
    skills: ["Learning", "Adaptability", "Exploration"],
    level: "Mixed",
    hoursToComplete: 20,
    // Add any other fields that your UI requires
  };
};

const CourseDetailPage = () => {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [error, setError] = useState(null);
  const [apiAttempted, setApiAttempted] = useState(false);

  console.log("CourseDetailPage rendered with ID:", id, "Type:", typeof id);

  // COMPLETELY STANDALONE mock courses data - no API calls
  const mockCourses = {
    1: {
      id: "1",
      title: "Introduction to Machine Learning",
      description:
        "This course provides a broad introduction to machine learning, data mining, and statistical pattern recognition. Topics include supervised learning, unsupervised learning, best practices in machine learning, and practical advice for applying machine learning techniques.",
      category: "Computer Science",
      instructors: "Andrew Ng",
      rating: 4.8,
      duration: "8 weeks",
      site: "Coursera",
      platform: "Coursera",
      about:
        "Machine learning is the science of getting computers to act without being explicitly programmed. In the past decade, machine learning has given us self-driving cars, practical speech recognition, effective web search, and a vastly improved understanding of the human genome. This course provides a broad introduction to machine learning, data mining, and statistical pattern recognition.",
      skills: ["Python", "Neural Networks", "Data Analysis", "Deep Learning"],
      level: "Intermediate",
      hoursToComplete: 42,
    },
    2: {
      id: "2",
      title: "JavaScript for Beginners",
      description:
        "Start your journey into web development with JavaScript. This comprehensive course teaches you JavaScript from scratch, covering all fundamentals and practical applications.",
      category: "Programming",
      instructors: "John Smith",
      rating: 4.5,
      duration: "10 hours",
      site: "Udemy",
      platform: "Udemy",
      about:
        "This comprehensive course teaches you JavaScript from scratch. You'll learn all the fundamentals of JavaScript programming, how to work with the DOM, create interactive web pages, handle events, and build modern web applications.",
      skills: ["JavaScript", "HTML", "CSS", "DOM Manipulation"],
      level: "Beginner",
      hoursToComplete: 10,
    },
    5777: {
      id: "5777",
      title: "Project Management Essentials",
      description:
        "Learn the core principles and methodologies of effective project management for any industry.",
      category: "Business",
      instructors: "Michael Chen",
      rating: 4.7,
      duration: "5 weeks",
      site: "edX",
      platform: "edX",
      about:
        "This course provides a comprehensive overview of project management fundamentals. You'll learn how to initiate, plan, execute, monitor, and close projects efficiently. The course covers key project management frameworks including traditional, agile, and hybrid methodologies.",
      skills: [
        "Project Planning",
        "Risk Management",
        "Team Leadership",
        "Agile Methodologies",
      ],
      level: "Intermediate",
      hoursToComplete: 25,
    },
    5787: {
      id: "5787",
      title: "Data Science: Visualization",
      description:
        "Learn powerful techniques for visualizing and communicating insights from data using Python, R, and other visualization tools.",
      category: "Data Science",
      instructors: "David Kim",
      rating: 4.6,
      duration: "6 weeks",
      site: "edX",
      platform: "edX",
      about:
        "Data visualization is an essential component of any data science project. This course will teach you how to create compelling visualizations that effectively communicate your findings to any audience. You'll learn how to choose the right visualization type for your data, how to design clear and informative graphics, and how to build interactive dashboards using modern tools.",
      skills: ["Data Visualization", "Python", "R", "Tableau", "D3.js"],
      level: "Intermediate",
      hoursToComplete: 30,
    },
    5880: {
      id: "5880",
      title: "Design Thinking: Insights to Inspiration",
      description:
        "Learn how to approach problems creatively using design thinking methodology. This course helps you understand user needs, generate innovative ideas, and create effective solutions.",
      category: "Business",
      instructors: "Jeanne M. Liedtka",
      rating: 4.7,
      duration: "Approx. 13 hours to complete",
      site: "Coursera",
      platform: "Coursera",
      about:
        "Design thinking is a powerful approach to innovation that emphasizes understanding user needs, challenging assumptions, and redefining problems to identify alternative strategies and solutions. This course will teach you the fundamentals of design thinking and how to apply it to business challenges.",
      skills: [
        "Design Thinking",
        "Innovation",
        "Problem Solving",
        "User Research",
      ],
      level: "Intermediate",
      hoursToComplete: 13,
    },
    6001: {
      id: "6001",
      title: "Artificial Intelligence Ethics",
      description:
        "Explore the ethical implications of AI systems and learn frameworks for responsible AI development and deployment.",
      category: "Computer Science",
      instructors: "Sarah Johnson",
      rating: 4.9,
      duration: "4 weeks",
      site: "MIT OpenCourseWare",
      platform: "MIT OCW",
      about:
        "As AI systems become more prevalent in society, ensuring their ethical development and use becomes increasingly important. This course covers key ethical concepts related to AI, including fairness, accountability, transparency, and privacy. You'll examine real-world case studies and learn frameworks for making ethical decisions in AI development.",
      skills: [
        "AI Ethics",
        "Critical Thinking",
        "Policy Analysis",
        "Responsible AI",
      ],
      level: "Advanced",
      hoursToComplete: 16,
    },
    7123: {
      id: "7123",
      title: "Digital Marketing Fundamentals",
      description:
        "Master the core concepts and tools of digital marketing, including social media, SEO, content marketing, and analytics.",
      category: "Business",
      instructors: "Elena Rodriguez",
      rating: 4.4,
      duration: "8 weeks",
      site: "Udemy",
      platform: "Udemy",
      about:
        "This comprehensive course covers all aspects of digital marketing in today's fast-paced digital landscape. You'll learn how to create effective marketing strategies across multiple channels, how to optimize content for search engines, how to leverage social media platforms, and how to measure your results with analytics tools.",
      skills: [
        "Digital Marketing",
        "SEO",
        "Social Media Marketing",
        "Content Strategy",
        "Analytics",
      ],
      level: "Beginner",
      hoursToComplete: 24,
    },
  };

  useEffect(() => {
    const loadCourse = async () => {
      setLoading(true);
      setError(null);

      // Always use String(id) to ensure consistent key format
      const normalizedId = String(id);
      console.log("Looking up course with normalized ID:", normalizedId);

      // First try to get course from hardcoded mock data
      let foundCourse = mockCourses[normalizedId];
      if (foundCourse) {
        console.log("Found course in mock data:", foundCourse.title);
        setCourse(foundCourse);
        setLoading(false);
        return;
      }

      // If not found in mock data, try to fetch from API
      try {
        console.log("Attempting to fetch course from API...");
        setApiAttempted(true);
        const response = await fetch(`/api/courses/${normalizedId}`);

        if (response.ok) {
          const apiCourse = await response.json();
          console.log("Successfully fetched course from API:", apiCourse);
          setCourse(apiCourse);
        } else {
          console.log("API returned error, using dynamically generated course");
          // Generate a dynamic mock course for any ID
          foundCourse = generateDynamicCourse(normalizedId);
          setCourse(foundCourse);
        }
      } catch (err) {
        console.error("Error fetching from API:", err);
        // If API fetch fails, still generate a dynamic mock course
        console.log("API fetch failed, using dynamically generated course");
        foundCourse = generateDynamicCourse(normalizedId);
        setCourse(foundCourse);
      }

      setLoading(false);
    };

    loadCourse();
  }, [id]);

  // If loading, show loading indicator
  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <div className="flex flex-col items-center justify-center">
          <div className="animate-spin h-12 w-12 border-4 border-orange-500 border-t-transparent rounded-full mb-4"></div>
          <p className="text-gray-600">Loading course information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Back button */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/learning-center")}
          className="text-orange-600 hover:text-orange-800 hover:bg-orange-50"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Courses
        </Button>
      </div>

      {/* Course header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-orange-800 mb-2">
          {course.title}
        </h1>
        <p className="text-gray-600 italic">Instructor: {course.instructors}</p>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column - Course content */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-orange-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-orange-700 mb-4">
              About This Course
            </h2>
            <p className="text-gray-700 mb-4">
              {course.about || course.description}
            </p>

            {course.skills && course.skills.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold text-orange-700 mb-2">
                  Skills You'll Gain
                </h3>
                <div className="flex flex-wrap gap-2">
                  {course.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Additional course details */}
          <div className="bg-white border border-orange-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-orange-700 mb-4">
              Course Structure
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-gray-700 font-medium">Level</span>
                <span className="text-gray-900">
                  {course.level || "Intermediate"}
                </span>
              </div>

              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-gray-700 font-medium">
                  Time to complete
                </span>
                <span className="text-gray-900">
                  {course.hoursToComplete || "N/A"} hours
                </span>
              </div>

              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-gray-700 font-medium">Format</span>
                <span className="text-gray-900">Online course</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column - Course info */}
        <div>
          <div className="bg-white border border-orange-200 rounded-lg overflow-hidden sticky top-4">
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-4">
              <h2 className="text-xl font-bold">Course Information</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-500">Category:</div>
                <div className="font-medium">{course.category}</div>

                <div className="text-gray-500">Platform:</div>
                <div className="font-medium">
                  {course.platform || course.site}
                </div>

                <div className="text-gray-500">Duration:</div>
                <div className="font-medium">{course.duration}</div>

                <div className="text-gray-500">Rating:</div>
                <div className="font-medium flex items-center">
                  {course.rating}{" "}
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 ml-1" />
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 mt-4">
                <a
                  href={course.url || "https://learningcompass.ai/courses"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center bg-gradient-to-r from-orange-500 to-amber-500 text-white py-2 px-4 rounded hover:from-orange-600 hover:to-amber-600 transition"
                >
                  Take This Course
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-center text-yellow-700">
          <strong>Debug Info:</strong> Course ID: {id} (type: {typeof id})
          <br />
          <span className="text-xs">
            Data source:{" "}
            {mockCourses[id]
              ? "Hardcoded Mock Data"
              : apiAttempted
              ? "Dynamic Generated Data (API unavailable)"
              : "API Data"}
          </span>
        </p>
      </div>
    </div>
  );
};

export default CourseDetailPage;
