import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { db } from "./storage"; // ✔️ db should use Node pg driver (`pg`)
import { insertSampleProducts } from "./Sample-Products";
import dotenv from "dotenv";
import { setupVite, serveStatic } from "./vite"; // ✔️ Make sure to use serveStatic in production
import fileUpload from "express-fileupload";
import fs from "fs";
import { migrate } from "drizzle-orm/node-postgres/migrator";

import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// ✅ Load .env
dotenv.config({ path: path.resolve(__dirname, "../.env") });
console.log("✅ Environment loaded");
console.log("🌐 DATABASE_URL:", process.env.DATABASE_URL ? "OK" : "Missing");

// ✅ Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ✅ Create Express app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(
  fileUpload({
    limits: { fileSize: 5 * 1024 * 1024 },
    abortOnLimit: true,
  })
);
app.use("/uploads", express.static(uploadsDir));

// ✅ Logging middleware for API requests
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJson: any;
  const originalJson = res.json;

  res.json = function (bodyJson, ...args) {
    capturedJson = bodyJson;
    return originalJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJson) logLine += ` :: ${JSON.stringify(capturedJson)}`;
      if (logLine.length > 80) logLine = logLine.slice(0, 79) + "…";
      console.log(logLine);
    }
  });

  next();
});

// ✅ Async startup
(async () => {
  try {
    // ✅ Run migrations at start (important for Render)
    await migrate(db, { migrationsFolder: "migrations" });
    console.log("✅ Drizzle migrations ran successfully");
  } catch (err) {
    console.error("❌ Migration error:", err);
  }

  // ✅ Setup API routes
  const server = await registerRoutes(app);

  // ✅ Global error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    console.error("❌", message);
  });

  // ✅ Serve frontend
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    console.log("🟢 Serving static frontend in production...");
    serveStatic(app); // <- use public/dist in production
  }

  // ✅ Start server
  const port = process.env.PORT || 5000;
  server.listen(
    { port: Number(port), host: "0.0.0.0", reusePort: true },
    () => {
      console.log(`🟢 Server running at http://localhost:${port}`);
    }
  );

  // ✅ Optional: seed products (only for dev/local)
  if (process.env.NODE_ENV !== "production") {
    insertSampleProducts().catch(console.error);
  }
})();
