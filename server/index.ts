import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { db } from "./storage";
import { insertSampleProducts } from "./Sample-Products";
import dotenv from "dotenv";
import fileUpload from "express-fileupload";
import fs from "fs";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import path from "path";
import { fileURLToPath } from "url";

// Resolve __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Load .env
dotenv.config({ path: path.resolve(__dirname, "../.env") });
console.log("✅ Environment loaded");
console.log("🌐 DATABASE_URL:", process.env.DATABASE_URL ? "OK" : "Missing");

// ✅ Ensure uploads folder exists
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

// ✅ Request Logger
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
    await migrate(db, { migrationsFolder: "migrations" });
    console.log("✅ Drizzle migrations ran successfully");
  } catch (err) {
    console.error("❌ Migration error:", err);
  }

  // ✅ Register backend routes
  const server = await registerRoutes(app);

  // ✅ Global error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    console.error("❌", message);
  });

  // ✅ Serve frontend in production
  if (process.env.NODE_ENV === "production") {
    const distPath = path.join(__dirname, "../dist/public");
    app.use(express.static(distPath));

    // SPA fallback for React
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });

    console.log("🟢 Serving static frontend in production...");
  }

  const port = process.env.PORT || 5000;
  server.listen({ port: Number(port), host: "0.0.0.0" }, () => {
    console.log(`🟢 Server running at http://localhost:${port}`);
  });

  // ✅ Optional seed products in dev
  if (process.env.NODE_ENV !== "production") {
    insertSampleProducts().catch(console.error);
  }
})();
