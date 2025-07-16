import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DATABASE_URL = "postgresql://werewolveshx_user:XYSXU8irIWITF1Fv0wmCuMuXeoHbzoIw@dpg-d1qg0mre5dus73e7hv6g-a.frankfurt-postgres.render.com/werewolveshx";

async function createTables() {
  const client = new pg.Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected successfully!');

    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '..', 'db', 'migrations', '01_create_games_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('Executing migration...');
    await client.query(migrationSQL);
    console.log('Migration executed successfully!');

    // Verify tables exist
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Created tables:', tables.rows.map(row => row.table_name));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

createTables(); 