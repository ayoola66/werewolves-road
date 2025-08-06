import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import * as Sentry from "@sentry/node";

const app = express();

// Initialize Sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || "development",
  tracesSampleRate: 1.0,
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (this: Response, bodyJson: any) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(this, [bodyJson]);
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

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  }

  // Error handling middleware
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    // Capture error in Sentry
    Sentry.captureException(err, {
      extra: {
        path: req.path,
        method: req.method,
        query: req.query,
      },
    });

    console.error("Error:", err);

    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    const details = app.get("env") === "development" ? err.stack : undefined;

    res.status(status).json({
      error: message,
      ...(details && { details }),
    });
  });

  // Serve static files in production
  if (app.get("env") === "production") {
    serveStatic(app);
  }

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  console.log(`Starting server on port ${port}...`);

  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`Server is running on port ${port}`);
    }
  );
})().catch((err) => {
  // Capture startup errors
  Sentry.captureException(err);
  console.error("Failed to start server:", err);
  process.exit(1);
});
