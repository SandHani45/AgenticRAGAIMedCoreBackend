import express, { type Request, Response, NextFunction } from "express";
import { registerApiRoutes } from "./api";
import cors from "cors";
import { connectMongoDB } from "./mongodb";

import passport from "./passport/jwtStrategy";


const app = express();
app.use(passport.initialize());
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
}));
app.options("*", cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(passport.initialize());

// API logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;
  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
    }
  });
  next();
});


// Connect to MongoDB first, then start server
connectMongoDB()
  .then(() => {
    console.log("Database connected successfully.");
    (async () => {
      const server = await registerApiRoutes(app);

      app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";
        res.status(status).json({ message });
        throw err;
      });

    

      const port = parseInt(process.env.PORT || '5000', 10);
      server.listen({
        port,
        host: "127.0.0.1",
      }, () => {
        const addressInfo = server.address();
        const host = typeof addressInfo === "object" && addressInfo ? addressInfo.address : "unknown";
        console.log(`serving on host ${host} and port ${port}`);
      });
    })();
  })
  .catch((error) => {
    console.error("Failed to connect to the database:", error);
    process.exit(1);
  });