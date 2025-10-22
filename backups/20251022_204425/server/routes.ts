import express, { type Request, Response } from "express";
import { WebSocketServer } from "ws";
import { Server, createServer } from "http";
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
      const { playerName, settings } = req.body;
      const gameCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const hostId = Math.random().toString(36).substring(2, 10);
      
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

  // Create HTTP server without starting it (index.ts will start it)
  const server = createServer(app);

  // Setup WebSocket server
  const wss = new WebSocketServer({ server });
  wss.on("connection", handleWebSocket);

  return server;
}