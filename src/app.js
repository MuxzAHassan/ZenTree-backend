import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import { swaggerSetup } from "./docs/swagger.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

swaggerSetup(app);

export default app;
