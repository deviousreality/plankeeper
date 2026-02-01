import Database from 'better-sqlite3';
import { db } from '../utils/db';
import { buildTables } from '../utils/db_build';
import { runMigrations } from '../utils/migrations';
import { seedPlantData } from '../utils/db_seed_development';

const buildDatabase = (db: Database.Database) => {
  /**
   * This will reset the database tables.
   */
  console.log('Starting database reset...');

  // Initialize database schema first
  buildTables(db);
  console.log('Database schema initialized');

  // Disable foreign key constraints for data reset
  db.pragma('foreign_keys = OFF');
  console.log('Foreign key constraints disabled for reset');
};

buildDatabase(db);
await runMigrations(db, 'up');
seedPlantData(db, 1); // Assuming admin user ID is 1
db.close();
console.log('Database reset complete.');
