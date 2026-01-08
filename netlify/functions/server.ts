import serverless from "serverless-http";
import express from "express";
import { WebSocketServer } from "ws";
import { handleWebSocket } from "../../server/services/gameLogic";

const app = express();

app.use(express.json());

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// WebSocket upgrade handling for Netlify
export const handler = async (event: any, context: any) => {
  // For WebSocket connections
  if (event.headers.upgrade === "websocket") {
    return {
      statusCode: 426,
      body: JSON.stringify({
        message: "WebSocket connections not supported on Netlify. Please use a dedicated WebSocket service.",
      }),
    };
  }

  // For regular HTTP requests
  const serverlessHandler = serverless(app);
  return serverlessHandler(event, context);
};
