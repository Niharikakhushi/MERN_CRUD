import { Router } from "express";
import Experience from "../models/Experience.js";
import Booking from "../models/Booking.js";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";
import { sendError } from "../utils/errorResponse.js";

const router = Router();

const isHostOrAdmin = (user) =>
  user?.role === "host" || user?.role === "admin";

const isOwnerOrAdmin = (experience, user) =>
  experience.createdBy.toString() === user.userId || user.role === "admin";

const validateExperienceInput = ({ title, location, price, startTime }) => {
  if (!title) {
    return "Title is required";
  }
  if (!location) {
    return "Location is required";
  }
  if (price === undefined || price === null) {
    return "Price is required";
  }
  if (!Number.isInteger(price)) {
    return "Price must be an integer";
  }
  if (!startTime) {
    return "Start time is required";
  }
  const date = new Date(startTime);
  if (Number.isNaN(date.getTime())) {
    return "Start time must be a valid datetime";
  }
  return null;
};

const parseRangeDate = (value) => {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
};

/**
 * @swagger
 * tags:
 *   name: Experiences
 *   description: Experience management
 */
/**
 * @swagger
 * /experiences:
 *   get:
 *     summary: List published experiences
 *     tags: [Experiences]
 *     parameters:
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: Experiences fetched
 */
router.get("/", async (req, res) => {
  try {
    const { location, from, to, page = "1", limit = "10", sort = "asc" } =
      req.query;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    if (!Number.isInteger(pageNumber) || pageNumber < 1) {
      return sendError(res, 400, "VALIDATION_ERROR", "Page must be >= 1");
    }
    if (!Number.isInteger(limitNumber) || limitNumber < 1) {
      return sendError(res, 400, "VALIDATION_ERROR", "Limit must be >= 1");
    }

    const filter = { status: "published" };
    if (location) {
      filter.location = new RegExp(`${location}`.trim(), "i");
    }

    const fromDate = parseRangeDate(from);
    const toDate = parseRangeDate(to);
    if (from && !fromDate) {
      return sendError(res, 400, "VALIDATION_ERROR", "Invalid from datetime");
    }
    if (to && !toDate) {
      return sendError(res, 400, "VALIDATION_ERROR", "Invalid to datetime");
    }
    if (fromDate || toDate) {
      filter.startTime = {};
      if (fromDate) {
        filter.startTime.$gte = fromDate;
      }
      if (toDate) {
        filter.startTime.$lte = toDate;
      }
    }

    const sortDirection = sort === "desc" ? -1 : 1;
    const skip = (pageNumber - 1) * limitNumber;

    const [experiences, total] = await Promise.all([
      Experience.find(filter)
        .sort({ startTime: sortDirection })
        .skip(skip)
        .limit(limitNumber),
      Experience.countDocuments(filter),
    ]);

    res.status(200).json({
      message: "Experiences fetched",
      experiences,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
      },
    });
  } catch (error) {
    return sendError(
      res,
      500,
      "EXPERIENCES_FETCH_FAILED",
      "Error fetching experiences",
      [error.message]
    );
  }
});

/**
 * @swagger
 * /experiences:
 *   post:
 *     summary: Create an experience
 *     tags: [Experiences]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, location, price, start_time]
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               location:
 *                 type: string
 *               price:
 *                 type: integer
 *               start_time:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Experience created
 *       403:
 *         description: Access denied
 */
router.post("/", requireAuth, async (req, res) => {
  try {
    if (!isHostOrAdmin(req.user)) {
      return sendError(res, 403, "EXPERIENCE_FORBIDDEN", "Access denied");
    }

    const { title, description, location, price } = req.body;
    const parsedPrice = typeof price === "string" ? Number(price) : price;
    const startTime = req.body.start_time || req.body.startTime;

    const validationError = validateExperienceInput({
      title,
      location,
      price: parsedPrice,
      startTime,
    });
    if (validationError) {
      return sendError(res, 400, "VALIDATION_ERROR", validationError);
    }

    const experience = await Experience.create({
      title: title.trim(),
      description: description?.trim() || "",
      location: location.trim(),
      price: parsedPrice,
      startTime: new Date(startTime),
      createdBy: req.user.userId,
      status: "draft",
    });

    res.status(201).json({ message: "Experience created", experience });
  } catch (error) {
    return sendError(
      res,
      500,
      "EXPERIENCE_CREATE_FAILED",
      "Error creating experience",
      [error.message]
    );
  }
});

/**
 * @swagger
 * /experiences/{id}/publish:
 *   patch:
 *     summary: Publish an experience
 *     tags: [Experiences]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Experience published
 *       403:
 *         description: Access denied
 *       404:
 *         description: Experience not found
 */
router.patch("/:id/publish", requireAuth, async (req, res) => {
  try {
    const experience = await Experience.findById(req.params.id);
    if (!experience) {
      return sendError(
        res,
        404,
        "EXPERIENCE_NOT_FOUND",
        "Experience not found"
      );
    }
    if (!isOwnerOrAdmin(experience, req.user)) {
      return sendError(res, 403, "EXPERIENCE_FORBIDDEN", "Access denied");
    }

    experience.status = "published";
    await experience.save();

    res.status(200).json({ message: "Experience published", experience });
  } catch (error) {
    return sendError(
      res,
      500,
      "EXPERIENCE_PUBLISH_FAILED",
      "Error publishing experience",
      [error.message]
    );
  }
});

/**
 * @swagger
 * /experiences/{id}/block:
 *   patch:
 *     summary: Block an experience (admin only)
 *     tags: [Experiences]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Experience blocked
 *       403:
 *         description: Access denied
 *       404:
 *         description: Experience not found
 */
router.patch("/:id/block", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const experience = await Experience.findById(req.params.id);
    if (!experience) {
      return sendError(
        res,
        404,
        "EXPERIENCE_NOT_FOUND",
        "Experience not found"
      );
    }

    experience.status = "blocked";
    await experience.save();

    res.status(200).json({ message: "Experience blocked", experience });
  } catch (error) {
    return sendError(
      res,
      500,
      "EXPERIENCE_BLOCK_FAILED",
      "Error blocking experience",
      [error.message]
    );
  }
});

/**
 * @swagger
 * /experiences/{id}/book:
 *   post:
 *     summary: Book an experience
 *     tags: [Experiences]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [seats]
 *             properties:
 *               seats:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Booking created
 *       403:
 *         description: Access denied
 *       404:
 *         description: Experience not found
 */
router.post("/:id/book", requireAuth, async (req, res) => {
  try {
    if (req.user?.role === "host") {
      return sendError(res, 403, "BOOKING_FORBIDDEN", "Hosts cannot book");
    }

    const seatsRaw = req.body.seats;
    const seats = typeof seatsRaw === "string" ? Number(seatsRaw) : seatsRaw;
    if (!Number.isInteger(seats) || seats < 1) {
      return sendError(res, 400, "VALIDATION_ERROR", "Seats must be >= 1");
    }

    const experience = await Experience.findById(req.params.id);
    if (!experience) {
      return sendError(
        res,
        404,
        "EXPERIENCE_NOT_FOUND",
        "Experience not found"
      );
    }
    if (experience.status !== "published") {
      return sendError(
        res,
        400,
        "BOOKING_NOT_ALLOWED",
        "Experience is not published"
      );
    }

    const existingBooking = await Booking.findOne({
      experienceId: experience._id,
      userId: req.user.userId,
      status: "confirmed",
    });
    if (existingBooking) {
      return sendError(
        res,
        409,
        "BOOKING_EXISTS",
        "Booking already exists"
      );
    }

    const booking = await Booking.create({
      experienceId: experience._id,
      userId: req.user.userId,
      seats,
      status: "confirmed",
    });

    res.status(201).json({ message: "Booking created", booking });
  } catch (error) {
    return sendError(
      res,
      500,
      "BOOKING_CREATE_FAILED",
      "Error creating booking",
      [error.message]
    );
  }
});

export default router;

