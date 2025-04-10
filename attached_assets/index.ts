import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, "../.env") });
console.log(
  "Environment variables loaded from:",
  path.join(__dirname, "../.env")
);
console.log("RAPID_API_KEY present:", !!process.env.RAPID_API_KEY);

// Check for critical environment variables
if (!process.env.RAPID_API_KEY) {
  console.error(
    "WARNING: RAPID_API_KEY is not set in environment variables. API calls will fail."
  );
  console.error(
    "Please make sure your .env file contains RAPID_API_KEY=your_api_key"
  );
} else {
  console.log("RAPID_API_KEY is set and ready to use");
}

if (!process.env.DATABASE_URL) {
  console.warn(
    "DATABASE_URL is not set. Using fallback mock data for all operations."
  );
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logger middleware
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

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("Server error:", err);
    res.status(status).json({ message });
  });

  // Serve static files in production
  if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "../client/dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "../client/dist/index.html"));
    });
  } else {
    // Setup Vite in development
    await setupVite(app, server);
  }

  // ALWAYS serve the app on port 5000 for Replit
  // this serves both the API and the client
  const port = Number(process.env.PORT) || 5000;

  // Try to detect if port is already in use
  const startServer = () => {
    server.listen(
      {
        port: port,
        host: "0.0.0.0",
      },
      () => {
        log(`Server running on http://localhost:${port}`);
      }
    );
  };

  server.on("error", (e: any) => {
    if (e.code === "EADDRINUSE") {
      console.error(
        `Port ${port} is already in use. Please close other servers or use a different port.`
      );
      process.exit(1);
    } else {
      console.error("Server error:", e);
    }
  });

  startServer();
})();
