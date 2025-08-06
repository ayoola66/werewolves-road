import express, { type Request, Response } from "express";
import { WebSocketServer } from "ws";
import { Server } from "http";
import { handleWebSocket } from "./services/gameLogic";

export async function registerRoutes(app: express.Express): Promise<Server> {
  // Health check endpoint
  app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({ status: "healthy" });
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
