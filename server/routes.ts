import express, { type Request, Response } from "express";
import { WebSocketServer } from "ws";
import { Server } from "http";
import { handleWebSocket } from "./services/gameLogic";
import { db } from "./db";
import { games } from "../shared/schema";

export async function registerRoutes(app: express.Express): Promise<Server> {
  // Health check endpoint
  app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({ status: "healthy" });
  });

  // API Routes
  app.post("/api/games", async (req: Request, res: Response) => {
    try {
      const { hostId, settings } = req.body;
      const gameCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const [game] = await db.insert(games).values({
        gameCode,
        hostId,
        settings,
        status: "waiting",
        currentPhase: "waiting",
        phaseTimer: 0,
      }).returning();

      res.json(game);
    } catch (error) {
      console.error("Error creating game:", error);
      res.status(500).json({ error: "Failed to create game" });
    }
  });

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;
  const host = process.env.HOST || "0.0.0.0";

  const server = app.listen(port, host, () => {
    console.log(`Server listening on ${host}:${port}`);
  });

  const wss = new WebSocketServer({ server });
  wss.on("connection", handleWebSocket);

  return server;
}