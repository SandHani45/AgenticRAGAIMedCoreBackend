import type { Express } from "express";

import authRoutes from "./routes/authRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";
import sessionRoutes from "./routes/sessionRoutes";
import documentRoutes from "./routes/documentRoutes";
import userRoutes from "./routes/userRoutes";
import { createServer } from "http";
import agentRoutes from "./routes/agentRoutes";
export function registerApiRoutes(app: Express) {
  const httpServer = createServer(app);
  // Healthcheck endpoint
  app.get("/api/healthcheck", (req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
  });
  app.use("/api", authRoutes);
  app.use("/api", dashboardRoutes);
  app.use("/api", sessionRoutes);
  app.use("/api", documentRoutes);
  app.use("/api", userRoutes);
  app.use("/api", agentRoutes);
  // Return the Express app instance instead of creating a Vite server
  return httpServer;
}
