import fetch from "node-fetch";

const baseUrl = "http://localhost:3000";

async function testCourseRoute(id) {
  console.log(`\n=== Testing course ID: ${id} (type: ${typeof id}) ===`);

  try {
    console.log(`Requesting: ${baseUrl}/api/courses/${id}`);
    const response = await fetch(`${baseUrl}/api/courses/${id}`);

    const status = response.status;
    console.log(`Status: ${status}`);

    const data = await response.json();
    console.log("Response:");
    console.log(JSON.stringify(data, null, 2));

    return { success: response.ok, data };
  } catch (error) {
    console.error("Error:", error.message);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  // Test with different ID formats
  await testCourseRoute("1"); // String ID
  await testCourseRoute(1); // Number ID
  await testCourseRoute("2"); // String ID
  await testCourseRoute(2); // Number ID
  await testCourseRoute("7684"); // Non-existent ID (string)
  await testCourseRoute(7684); // Non-existent ID (number)
}

runTests()
  .then(() => console.log("\nAll tests completed!"))
  .catch((err) => console.error("Test suite error:", err));
