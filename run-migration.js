// Quick migration script for Railway deployment
import pg from 'pg';
const { Pool } = pg;

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔄 Running migration to add phase tracking fields...');
    
    await pool.query(`
      ALTER TABLE games 
      ADD COLUMN IF NOT EXISTS night_count INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS day_count INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS last_phase_change TIMESTAMP DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS phase_end_time TIMESTAMP;
    `);
    
    console.log('✅ Migration completed successfully!');
    
    // Verify columns were added
    const result = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'games' 
      AND column_name IN ('night_count', 'day_count', 'last_phase_change', 'phase_end_time')
      ORDER BY column_name;
    `);
    
    console.log('✅ Verified columns:', result.rows.map(r => r.column_name));
    console.log('🎉 Database is ready for the new game engine!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();

