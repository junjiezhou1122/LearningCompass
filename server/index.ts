import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import { db } from "./db";
import { courses } from "@shared/schema";
import { sql } from "drizzle-orm";
import { addNotesFeatures } from "./migrations/add_notes_features";
import { addAdvancedNotesFeatures } from "./migrations/add_advanced_notes_features";
import { addFileFieldsToResources } from "./migrations/add-file-fields-to-resources";
import cors from "cors";
import { createRequire } from "module";

// Create a require function to import CommonJS modules in ES Module environment
const require = createRequire(import.meta.url);
// Import auth routes using the created require function
const authRoutes = require("./routes/auth.js");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configure CORS with specific options to fix the error
app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        "http://localhost:5000",
        "http://localhost:3000",
        "https://localhost:5000",
        "https://localhost:3000",
      ];

      // Add the Replit domain to allowed origins
      if (process.env.REPLIT_DOMAIN) {
        allowedOrigins.push(`https://${process.env.REPLIT_DOMAIN}`);
      }

      // Check if domain appears to be a Replit domain
      if (
        origin &&
        (origin.includes(".replit.dev") || origin.includes(".repl.co"))
      ) {
        allowedOrigins.push(origin);
      }

      // Allow requests with no origin (like mobile apps, curl, or Postman)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.log("CORS issue with origin:", origin);
        // Allow all origins in development for easier debugging
        if (process.env.NODE_ENV === "development") {
          callback(null, true);
        } else {
          callback(null, true); // Change to false in production when needed
        }
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// Set up the auth routes
app.use("/api/auth", authRoutes);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Debug middleware to log incoming requests
app.use((req, res, next) => {
  if (req.path.includes("/api/auth")) {
    console.log(`Auth Request: ${req.method} ${req.path}`);
    console.log("Headers:", req.headers);
    if (req.body && Object.keys(req.body).length > 0) {
      console.log("Body:", JSON.stringify(req.body));
    }
  }
  next();
});

// Debug middleware to ensure proper content type
app.use((req, res, next) => {
  const originalJson = res.json;
  res.json = function (body) {
    res.setHeader("Content-Type", "application/json");
    return originalJson.call(this, body);
  };
  next();
});

(async () => {
  // We'll skip importing courses for now since you already have many courses in the database
  console.log("Starting server without course import");

  // Run database migrations
  try {
    await addNotesFeatures();
    await addAdvancedNotesFeatures();
    await addFileFieldsToResources();
    console.log("Database migrations completed successfully.");
  } catch (error) {
    console.error("Error running database migrations:", error);
  }

  // Register API routes
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Use the port provided by Replit or default to 3000
  const PORT = process.env.PORT || 3000;

  // Log the port we're trying to use
  console.log(`Attempting to start server on port: ${PORT} and host: 0.0.0.0`);

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
    log(`Server running on port ${PORT}`);
    log(`You can access the application at: http://0.0.0.0:${PORT}`);
    log(`API endpoints are available at: http://0.0.0.0:${PORT}/api/*`);
    log(`Auth endpoints are available at: http://0.0.0.0:${PORT}/api/auth/*`);
  });
})();
