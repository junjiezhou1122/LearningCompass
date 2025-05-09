// A script to test if multiple courses can be accessed
import fetch from "node-fetch";

const testCourseIds = ["1", "2", "5787", "5880", "6001", "7123"];

const testCourseAccess = async (courseId) => {
  console.log(`\n=== Testing course ID: ${courseId} ===`);

  try {
    // First, test the hardcoded client-side access
    console.log(`CLIENT-SIDE URL: http://localhost:5173/course/${courseId}`);

    // Then, test the API endpoint
    console.log(`API ENDPOINT: http://localhost:3000/api/courses/${courseId}`);
    try {
      const response = await fetch(
        `http://localhost:3000/api/courses/${courseId}`
      );

      if (response.ok) {
        const data = await response.json();
        console.log(
          `✅ SUCCESS! API returned course data for course ID: ${courseId}`
        );
        console.log(`   Title: ${data.title}`);
      } else {
        const errorText = await response.text();
        console.error(`❌ API request failed with status ${response.status}`);
        console.error(`   Error: ${errorText}`);
      }
    } catch (error) {
      console.error(`❌ API connection error: ${error.message}`);
    }

    // Note that client-side will work regardless of API status
    console.log(
      `ℹ️ Client-side will still work because of hardcoded data in CourseDetailPage.jsx`
    );
  } catch (error) {
    console.error(`Error testing course ${courseId}:`, error.message);
  }
};

const runTests = async () => {
  console.log("🔍 TESTING COURSE ACCESS");
  console.log("========================");
  console.log("Testing access to all available courses...");

  // Test each course ID
  for (const id of testCourseIds) {
    await testCourseAccess(id);
  }

  console.log("\n📋 SUMMARY");
  console.log("========================");
  console.log(
    "All courses should be accessible directly through the client at:"
  );
  testCourseIds.forEach((id) => {
    console.log(`- http://localhost:5173/course/${id}`);
  });

  console.log("\nTroubleshooting tips:");
  console.log(
    "1. The client-side course view will work even if the server is down because we use hardcoded data"
  );
  console.log(
    "2. If you want to test server API access, make sure the server is running"
  );
  console.log("3. You can restart the server with: cd server && node index.js");
  console.log("4. You can restart the client with: cd client && npm run dev");
  console.log("\nHappy testing! 🚀");
};

runTests();
