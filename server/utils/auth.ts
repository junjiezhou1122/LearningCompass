import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "@shared/schema";

// JWT secret key
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

// JWT expiration (24 hours)
const JWT_EXPIRES_IN = "24h";

/**
 * Generate a JWT token for a user
 */
export function generateToken(user: User): string {
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
    // Include additional user information in the token payload
    phoneNumber: user.phoneNumber || null,
    firstName: user.firstName || null,
    lastName: user.lastName || null,
    photoURL: user.photoURL || null,
    authProvider: user.authProvider || null,
    providerId: user.providerId || null,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

/**
 * Middleware to authenticate JWT tokens
 */
export function authenticateJWT(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "Authorization header missing" });
  }

  const parts = authHeader.split(" ");

  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({ message: "Invalid authorization format" });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    (req as any).user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
