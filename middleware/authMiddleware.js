import jwt from "jsonwebtoken";
import UserModel from "../models/UserModel.js";

export const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      req.user = null; // No token → set user to null
      return next();
    }

    const token = authHeader.split(" ")[1]; // Extract token after "Bearer"

    // Verify token asynchronously
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        console.log("JWT Error:", err.message);

        if (err.name === "TokenExpiredError") {
          return res.status(401).json({ message: "Token expired" });
        }

        return res.status(401).json({ message: "Invalid token" });
      }

      try {
        // Fetch user from database
        const user = await UserModel.findById(decoded.userId).select("-password"); // Exclude password from response

        if (!user) {
          return res.status(401).json({ message: "User not found" });
        }

        req.user = user; // ✅ Valid user → attach to request
        next();
      } catch (dbError) {
        console.error("Database Error:", dbError);
        return res.status(500).json({ message: "Internal server error" });
      }
    });
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const isAuthenticated = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};
