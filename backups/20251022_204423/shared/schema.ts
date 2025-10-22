import {
  pgTable,
  serial,
  text,
  timestamp,
  boolean,
  json,
  integer,
} from "drizzle-orm/pg-core";
import { type InferModel } from "drizzle-orm";
import { z } from "zod";

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  gameCode: text("game_code").notNull(),
  hostId: text("host_id").notNull(),
  status: text("status").default("waiting").notNull(),
  settings: json("settings").notNull(),
  currentPhase: text("current_phase").default("waiting").notNull(),
  phaseTimer: integer("phase_timer").default(0),
  nightCount: integer("night_count").default(0),
  dayCount: integer("day_count").default(0),
  lastPhaseChange: timestamp("last_phase_change").defaultNow(),
  phaseEndTime: timestamp("phase_end_time"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  gameId: text("game_id").notNull(),
  playerId: text("player_id").notNull(),
  name: text("name").notNull(),
  role: text("role"),
  team: text("team"),
  isAlive: boolean("is_alive").default(true),
  isHost: boolean("is_host").default(false),
  isSheriff: boolean("is_sheriff").default(false),
  hasShield: boolean("has_shield"),
  actionUsed: boolean("action_used"),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  gameId: text("game_id").notNull(),
  playerId: text("player_id"),
  playerName: text("player_name").notNull(),
  message: text("message").notNull(),
  type: text("type").default("player"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const votes = pgTable("votes", {
  id: serial("id").primaryKey(),
  gameId: text("game_id").notNull(),
  voterId: text("voter_id").notNull(),
  targetId: text("target_id").notNull(),
  phase: text("phase").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const nightActions = pgTable("night_actions", {
  id: serial("id").primaryKey(),
  gameId: text("game_id").notNull(),
  playerId: text("player_id").notNull(),
  targetId: text("target_id"),
  actionType: text("action_type").notNull(),
  data: json("data"),
  phase: text("phase").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Game = InferModel<typeof games>;
export type Player = InferModel<typeof players>;
export type ChatMessage = InferModel<typeof chatMessages>;
export type Vote = InferModel<typeof votes>;
export type NightAction = InferModel<typeof nightActions>;

export type InsertGame = InferModel<typeof games, "insert">;
export type InsertPlayer = InferModel<typeof players, "insert">;
export type InsertChatMessage = InferModel<typeof chatMessages, "insert">;
export type InsertVote = InferModel<typeof votes, "insert">;
export type InsertNightAction = InferModel<typeof nightActions, "insert">;

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
    channel: z.enum(["public", "werewolf"]).default("public"),
    isScrambled: z.boolean().default(true),
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
  z.object({
    type: z.literal("player_update"),
    gameCode: z.string(),
    players: z.array(z.object({
      playerId: z.string(),
      name: z.string(),
      isHost: z.boolean(),
      isConnected: z.boolean()
    }))
  }),
  z.object({
    type: z.literal("role_assigned"),
    gameCode: z.string(),
    role: z.string(),
    teamInfo: z.object({
      werewolves: z.array(z.string()).optional(),
      minion: z.boolean().optional()
    }),
    timer: z.number()
  }),
  z.object({
    type: z.literal("phase_change"),
    gameCode: z.string(),
    phase: z.enum(["day", "night"]),
    timer: z.number(),
    events: z.array(z.object({
      type: z.string(),
      message: z.string()
    }))
  })
]);

export type WSMessage = z.infer<typeof wsMessageSchema>;