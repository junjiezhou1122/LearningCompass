import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

// Middleware to authenticate requests
export function authenticate(req, res, next) {
  console.log("Authenticate middleware called");

  // Get token from Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.log("Authentication failed: No authorization header");
    return res.status(401).json({ error: "No token provided" });
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    console.log("Authentication failed: Invalid authorization format");
    return res
      .status(401)
      .json({ error: "Invalid authorization format. Use 'Bearer <token>'" });
  }

  const token = parts[1];
  if (!token || token === "null" || token === "undefined") {
    console.log("Authentication failed: Invalid token value");
    return res.status(401).json({ error: "Invalid token value" });
  }

  console.log("Token received:", token.substring(0, 10) + "...");

  try {
    // Verify the token
    const user = jwt.verify(token, JWT_SECRET);

    // Validate that user object has the necessary fields
    if (!user || !user.id) {
      console.error("Token verified but missing required user data");
      return res.status(401).json({ error: "Invalid token payload" });
    }

    console.log("Token verified successfully for user:", user.id);
    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication error:", error.name, error.message);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token signature" });
    }

    return res.status(401).json({ error: "Invalid token" });
  }
}

// Generate JWT token
export function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: "30d" }
  );
}
