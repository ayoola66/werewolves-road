import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  gameCode: text("game_code").notNull().unique(),
  hostId: text("host_id").notNull(),
  status: text("status").notNull().default("waiting"), // waiting, playing, finished
  settings: jsonb("settings").notNull(),
  currentPhase: text("current_phase").notNull().default("waiting"), // waiting, night, day, voting, game_over
  phaseTimer: integer("phase_timer").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").references(() => games.id).notNull(),
  playerId: text("player_id").notNull(),
  name: text("name").notNull(),
  role: text("role"),
  isAlive: boolean("is_alive").default(true).notNull(),
  isHost: boolean("is_host").default(false).notNull(),
  isSheriff: boolean("is_sheriff").default(false).notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const gameActions = pgTable("game_actions", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").references(() => games.id).notNull(),
  playerId: text("player_id").notNull(),
  actionType: text("action_type").notNull(), // vote, night_action, chat
  targetId: text("target_id"),
  data: jsonb("data"),
  phase: text("phase").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").references(() => games.id).notNull(),
  playerId: text("player_id"),
  playerName: text("player_name").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull().default("player"), // player, system, death, elimination
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Zod schemas
export const insertGameSchema = createInsertSchema(games).omit({
  id: true,
  createdAt: true,
});

export const insertPlayerSchema = createInsertSchema(players).omit({
  id: true,
  joinedAt: true,
});

export const insertGameActionSchema = createInsertSchema(gameActions).omit({
  id: true,
  createdAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertGame = z.infer<typeof insertGameSchema>;
export type Game = typeof games.$inferSelect;
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Player = typeof players.$inferSelect;
export type InsertGameAction = z.infer<typeof insertGameActionSchema>;
export type GameAction = typeof gameActions.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

// Game settings schema
export const gameSettingsSchema = z.object({
  werewolves: z.number().min(1),
  seer: z.boolean().default(true),
  doctor: z.boolean().default(true),
  shield: z.boolean().default(true),
  minion: z.boolean().default(false),
  jester: z.boolean().default(false),
  hunter: z.boolean().default(false),
  witch: z.boolean().default(false),
  bodyguard: z.boolean().default(false),
  sheriff: z.boolean().default(false),
  seerInvestigations: z.number().min(1).max(20).optional(),
});

export type GameSettings = z.infer<typeof gameSettingsSchema>;

// WebSocket message types
export const wsMessageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("join_game"),
    gameCode: z.string(),
    playerName: z.string(),
  }),
  z.object({
    type: z.literal("create_game"),
    playerName: z.string(),
    settings: gameSettingsSchema,
  }),
  z.object({
    type: z.literal("start_game"),
    gameCode: z.string(),
  }),
  z.object({
    type: z.literal("chat_message"),
    gameCode: z.string(),
    message: z.string(),
  }),
  z.object({
    type: z.literal("vote"),
    gameCode: z.string(),
    targetId: z.string(),
  }),
  z.object({
    type: z.literal("night_action"),
    gameCode: z.string(),
    targetId: z.string().optional(),
    actionData: z.any().optional(),
  }),
  z.object({
    type: z.literal("leave_game"),
    gameCode: z.string(),
  }),
]);

export type WSMessage = z.infer<typeof wsMessageSchema>;
