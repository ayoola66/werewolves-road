import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? {
          rejectUnauthorized: false,
        }
      : undefined,
});

async function setupDatabase() {
  const client = await pool.connect();

  try {
    console.log("Connected to database");

    // Check current schema
    const schemaResult = await client.query("SELECT current_schema()");
    console.log("Current schema:", schemaResult.rows[0].current_schema);

    // List all schemas
    const schemasResult = await client.query(
      "SELECT schema_name FROM information_schema.schemata"
    );
    console.log(
      "Available schemas:",
      schemasResult.rows.map((r) => r.schema_name)
    );

    // Set search path to public
    await client.query("SET search_path TO public");

    // Drop existing tables if they exist
    await client.query(`
      DROP TABLE IF EXISTS night_actions CASCADE;
      DROP TABLE IF EXISTS votes CASCADE;
      DROP TABLE IF EXISTS chat_messages CASCADE;
      DROP TABLE IF EXISTS players CASCADE;
      DROP TABLE IF EXISTS games CASCADE;
    `);

    // Create games table
    await client.query(`
      CREATE TABLE games (
        id SERIAL PRIMARY KEY,
        game_code TEXT NOT NULL UNIQUE,
        host_id TEXT NOT NULL,
        settings JSONB NOT NULL,
        status TEXT DEFAULT 'lobby',
        current_phase TEXT DEFAULT 'lobby',
        phase_timer TEXT,
        night_count TEXT DEFAULT '0',
        day_count TEXT DEFAULT '0',
        last_phase_change TIMESTAMP DEFAULT NOW(),
        required_actions JSONB DEFAULT '[]',
        completed_actions JSONB DEFAULT '[]',
        phase_end_time TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("Created games table");

    // Create players table
    await client.query(`
      CREATE TABLE players (
        id SERIAL PRIMARY KEY,
        game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
        player_id TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT,
        is_alive BOOLEAN DEFAULT true,
        is_host BOOLEAN DEFAULT false,
        is_sheriff BOOLEAN DEFAULT false,
        has_shield BOOLEAN,
        action_used BOOLEAN,
        joined_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("Created players table");

    // Create chat_messages table
    await client.query(`
      CREATE TABLE chat_messages (
        id SERIAL PRIMARY KEY,
        game_id TEXT NOT NULL,
        player_id TEXT NOT NULL,
        message TEXT NOT NULL,
        is_system BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("Created chat_messages table");

    // Create votes table
    await client.query(`
      CREATE TABLE votes (
        id SERIAL PRIMARY KEY,
        game_id TEXT NOT NULL,
        voter_id TEXT NOT NULL,
        target_id TEXT NOT NULL,
        phase TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Created votes table");

    // Create night_actions table
    await client.query(`
      CREATE TABLE night_actions (
        id SERIAL PRIMARY KEY,
        game_id TEXT NOT NULL,
        player_id TEXT NOT NULL,
        target_id TEXT,
        action_type TEXT NOT NULL,
        data JSONB,
        phase TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Created night_actions table");

    // Verify tables were created
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    console.log(
      "Tables in public schema:",
      tablesResult.rows.map((r) => r.table_name)
    );
  } catch (error) {
    console.error("Error setting up database:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

setupDatabase();
