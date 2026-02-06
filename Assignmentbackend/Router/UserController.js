import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "../models/User.js";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";
import { sendError } from "../utils/errorResponse.js";

const router = Router();
const saltRounds = 10;
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-this";

const allowedSignupRoles = new Set(["user", "host"]);

const sanitizeEmail = (email = "") => email.toLowerCase().trim();

const resolveName = (name, email) => {
  const trimmed = name?.trim();
  if (trimmed) {
    return trimmed;
  }
  const normalized = sanitizeEmail(email);
  const prefix = normalized.split("@")[0];
  return prefix || "User";
};

const validateRegister = ({ email, password, role }) => {
  if (!email || !password) {
    return "Email and password are required";
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return "Invalid email format";
  }
  if (password.length < 6) {
    return "Password must be at least 6 characters";
  }
  if (role && !allowedSignupRoles.has(role)) {
    return "Role must be user or host";
  }
  return null;
};

const validateLogin = ({ email, password }) => {
  if (!email || !password) {
    return "Email and password are required";
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return "Invalid email format";
  }
  return null;
};

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints
 */
/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [user, host]
 *     responses:
 *       201:
 *         description: User created
 *       400:
 *         description: Validation error
 */
const handleSignup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const validationError = validateRegister({
      email,
      password,
      role,
    });
    if (validationError) {
      return sendError(res, 400, "VALIDATION_ERROR", validationError);
    }

    const normalizedEmail = sanitizeEmail(email);
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return sendError(res, 400, "USER_EXISTS", "User already exists");
    }

    const protectedPassword = await bcrypt.hash(password, saltRounds);
    const newUser = new User({
      name: resolveName(name, normalizedEmail),
      email: normalizedEmail,
      password: protectedPassword,
      role: role || "user",
    });

    const savedUser = await newUser.save();
    const token = jwt.sign(
      { userId: savedUser._id, email: savedUser.email, role: savedUser.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      token,
      user: {
        id: savedUser._id,
        role: savedUser.role,
      },
    });
  } catch (error) {
    return sendError(res, 500, "USER_CREATE_FAILED", "Error creating user", [
      error.message,
    ]);
  }
};

router.post("/auth/register", handleSignup);

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Signup a new user (user or host)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [user, host]
 *     responses:
 *       201:
 *         description: User created
 *       400:
 *         description: Validation error
 */
router.post("/auth/signup", handleSignup);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const validationError = validateLogin({ email, password });
    if (validationError) {
      return sendError(res, 400, "VALIDATION_ERROR", validationError);
    }

    const normalizedEmail = sanitizeEmail(email);
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return sendError(res, 401, "AUTH_INVALID", "Invalid credentials");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return sendError(res, 401, "AUTH_INVALID", "Invalid credentials");
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      token,
      user: {
        id: user._id,
        role: user.role,
      },
    });
  } catch (error) {
    return sendError(res, 500, "LOGIN_FAILED", "Error logging in", [
      error.message,
    ]);
  }
});

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management
 */
/**
 * @swagger
 * /users:
 *   get:
 *     summary: List users (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users fetched
 *       403:
 *         description: Access denied
 */
router.get("/users", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const users = await User.find({}, "-password");
    res.status(200).json({
      message: "Users fetched successfully",
      users,
    });
  } catch (error) {
    return sendError(res, 500, "USERS_FETCH_FAILED", "Error fetching users", [
      error.message,
    ]);
  }
});

export default router;
