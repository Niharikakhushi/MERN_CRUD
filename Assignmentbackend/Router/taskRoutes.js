import { Router } from "express";
import Task from "../models/Task.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { sendError } from "../utils/errorResponse.js";

const router = Router();

const isOwnerOrAdmin = (task, user) =>
  task.owner.toString() === user.userId || user.role === "admin";

const validateTaskInput = ({ title, status }) => {
  if (!title) {
    return "Title is required";
  }
  if (status && !["todo", "in_progress", "done"].includes(status)) {
    return "Status must be todo, in_progress, or done";
  }
  return null;
};

/**
 * @swagger
 * tags:
 *   name: Tasks
 *   description: Task CRUD
 */
/**
 * @swagger
 * /tasks:
 *   post:
 *     summary: Create a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [todo, in_progress, done]
 *     responses:
 *       201:
 *         description: Task created
 */
router.post("/", requireAuth, async (req, res) => {
  try {
    const { title, description, status } = req.body;
    const validationError = validateTaskInput({ title, status });
    if (validationError) {
      return sendError(res, 400, "VALIDATION_ERROR", validationError);
    }

    const task = await Task.create({
      title: title.trim(),
      description: description?.trim() || "",
      status: status || "todo",
      owner: req.user.userId,
    });

    res.status(201).json({ message: "Task created", task });
  } catch (error) {
    return sendError(res, 500, "TASK_CREATE_FAILED", "Error creating task", [
      error.message,
    ]);
  }
});

/**
 * @swagger
 * /tasks:
 *   get:
 *     summary: List tasks (admin can query all=true)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: all
 *         schema:
 *           type: string
 *         description: Set true to fetch all tasks as admin
 *     responses:
 *       200:
 *         description: Tasks fetched
 */
router.get("/", requireAuth, async (req, res) => {
  try {
    const { all } = req.query;
    const filter =
      req.user.role === "admin" && all === "true"
        ? {}
        : { owner: req.user.userId };
    const tasks = await Task.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ message: "Tasks fetched", tasks });
  } catch (error) {
    return sendError(res, 500, "TASKS_FETCH_FAILED", "Error fetching tasks", [
      error.message,
    ]);
  }
});

/**
 * @swagger
 * /tasks/{id}:
 *   get:
 *     summary: Get task by id
 *     tags: [Tasks]
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
 *         description: Task fetched
 *       404:
 *         description: Task not found
 */
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return sendError(res, 404, "TASK_NOT_FOUND", "Task not found");
    }
    if (!isOwnerOrAdmin(task, req.user)) {
      return sendError(res, 403, "TASK_FORBIDDEN", "Access denied");
    }
    res.status(200).json({ message: "Task fetched", task });
  } catch (error) {
    return sendError(res, 500, "TASK_FETCH_FAILED", "Error fetching task", [
      error.message,
    ]);
  }
});

/**
 * @swagger
 * /tasks/{id}:
 *   put:
 *     summary: Update task
 *     tags: [Tasks]
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
 *             required: [title]
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [todo, in_progress, done]
 *     responses:
 *       200:
 *         description: Task updated
 */
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const { title, description, status } = req.body;
    const validationError = validateTaskInput({ title, status });
    if (validationError) {
      return sendError(res, 400, "VALIDATION_ERROR", validationError);
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return sendError(res, 404, "TASK_NOT_FOUND", "Task not found");
    }
    if (!isOwnerOrAdmin(task, req.user)) {
      return sendError(res, 403, "TASK_FORBIDDEN", "Access denied");
    }

    task.title = title.trim();
    task.description = description?.trim() || "";
    task.status = status || task.status;
    await task.save();

    res.status(200).json({ message: "Task updated", task });
  } catch (error) {
    return sendError(res, 500, "TASK_UPDATE_FAILED", "Error updating task", [
      error.message,
    ]);
  }
});

/**
 * @swagger
 * /tasks/{id}:
 *   delete:
 *     summary: Delete task
 *     tags: [Tasks]
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
 *         description: Task deleted
 */
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return sendError(res, 404, "TASK_NOT_FOUND", "Task not found");
    }
    if (!isOwnerOrAdmin(task, req.user)) {
      return sendError(res, 403, "TASK_FORBIDDEN", "Access denied");
    }

    await task.deleteOne();
    res.status(200).json({ message: "Task deleted" });
  } catch (error) {
    return sendError(res, 500, "TASK_DELETE_FAILED", "Error deleting task", [
      error.message,
    ]);
  }
});

export default router;
