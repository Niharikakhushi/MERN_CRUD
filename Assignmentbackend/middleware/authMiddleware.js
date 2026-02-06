import jwt from "jsonwebtoken";
import { sendError } from "../utils/errorResponse.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-this";

export const requireAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return sendError(res, 401, "AUTH_MISSING", "No token provided");
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return sendError(res, 401, "AUTH_INVALID", "Invalid token format");
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return sendError(res, 401, "AUTH_UNAUTHORIZED", "Unauthorized", [
      error.message,
    ]);
  }
};

export const requireRole = (roles) => (req, res, next) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return sendError(res, 403, "AUTH_FORBIDDEN", "Access denied");
  }
  next();
};

export default requireAuth;
