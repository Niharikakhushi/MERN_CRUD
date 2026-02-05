import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import connectdb from "./db.js";
import userRouter from "./Router/UserController.js";
import taskRouter from "./Router/taskRoutes.js";
import swaggerSpec from "./swagger.js";

dotenv.config();

const app = express();
connectdb();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/v1", userRouter);
app.use("/api/v1/tasks", taskRouter);
app.use("/api/v1/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});