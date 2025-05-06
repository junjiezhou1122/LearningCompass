
import { execSync } from "child_process";
try {
  console.log("Pushing schema changes...");
  // Try with different flags
  execSync("npx drizzle-kit push --accept-data-loss", {
    stdio: "inherit",
  });
  console.log("Schema successfully pushed!");
} catch (error) {
  console.error("Error pushing schema:", error);
  process.exit(1);
}

