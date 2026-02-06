import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import swaggerUi from "swagger-ui-express";
import connectdb from "./db.js";
import userRouter from "./Router/UserController.js";
import taskRouter from "./Router/taskRoutes.js";
import experienceRouter from "./Router/experienceRoutes.js";
import requestLogger from "./middleware/requestLogger.js";
import swaggerSpec from "./swagger.js";
import { sendError } from "./utils/errorResponse.js";

dotenv.config();

const app = express();
const jsonParser = express.json();
connectdb();
app.use(cors());
app.use((req, res, next) => {
  if (req.method === "GET" || req.method === "HEAD") {
    return next();
  }
  return jsonParser(req, res, next);
});
app.use(requestLogger);

const PORT = process.env.PORT || 3000;

app.get("/health", (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  if (!isConnected) {
    return res.status(500).json({ status: "degraded", db: "disconnected" });
  }
  res.status(200).json({ status: "ok", db: "connected" });
});

app.use("/api/v1", userRouter);
app.use("/api/v1/tasks", taskRouter);
app.use("/api/v1/experiences", experienceRouter);
app.use("/api/v1/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use((err, req, res, next) => {
  if (err?.type === "entity.parse.failed" || err instanceof SyntaxError) {
    return sendError(res, 400, "INVALID_JSON", "Malformed JSON body");
  }
  return next(err);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});