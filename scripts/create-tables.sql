-- Master SQL file to create all tables

CREATE TABLE "games" (
	"id" serial PRIMARY KEY NOT NULL,
	"game_code" text NOT NULL,
	"host_id" text NOT NULL,
	"status" text DEFAULT 'waiting' NOT NULL,
	"settings" json NOT NULL,
	"current_phase" text DEFAULT 'waiting' NOT NULL,
	"phase_timer" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "players" (
	"id" serial PRIMARY KEY NOT NULL,
	"game_id" text NOT NULL,
	"player_id" text NOT NULL,
	"name" text NOT NULL,
	"role" text,
	"is_alive" boolean DEFAULT true,
	"is_host" boolean DEFAULT false,
	"is_sheriff" boolean DEFAULT false,
	"has_shield" boolean,
	"action_used" boolean,
	"joined_at" timestamp DEFAULT now()
);

CREATE TABLE "chat_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"game_id" text NOT NULL,
	"player_id" text,
	"player_name" text NOT NULL,
	"message" text NOT NULL,
	"type" text DEFAULT 'player',
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE "votes" (
	"id" serial PRIMARY KEY NOT NULL,
	"game_id" text NOT NULL,
	"voter_id" text NOT NULL,
	"target_id" text NOT NULL,
	"phase" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE "night_actions" (
	"id" serial PRIMARY KEY NOT NULL,
	"game_id" text NOT NULL,
	"player_id" text NOT NULL,
	"target_id" text,
	"action_type" text NOT NULL,
	"data" json,
	"phase" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
