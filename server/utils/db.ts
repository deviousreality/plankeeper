/**
 * Database utility module for PlantKeeper application
 * 
 * This module provides database connection, initialization, and utility functions
 * for interacting with the SQLite database. It uses better-sqlite3 for efficient
 * and synchronous database operations.
 */
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

/**
 * Database table interfaces
 */
export interface User {
  id: number;
  username: string;
  password: string;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export interface Plant {
  id: number;
  user_id: number;
  name: string;
  species: string | null;
  acquired_date: string | null;
  image_url: string | null;
  notes: string | null;
  is_favorite: number; // 0 = false, 1 = true (SQLite doesn't have true boolean)
  created_at: string;
  updated_at: string;
}

export interface CareSchedule {
  id: number;
  plant_id: number;
  watering_interval: number | null;
  fertilizing_interval: number | null;
  last_watered: string | null;
  last_fertilized: string | null;
  light_needs: string | null;
  next_task_date: string | null;
}

export interface CareLog {
  id: number;
  plant_id: number;
  action_type: string;
  action_date: string;
  notes: string | null;
}

export interface CareTip {
  id: number;
  species: string;
  tip: string;
  source: string | null;
  created_at: string;
}

// Configuration
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILENAME = 'plant-keeper.db';

// Ensure the data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log(`Created data directory at: ${DATA_DIR}`);
  } catch (error) {
    console.error(`Failed to create data directory: ${error instanceof Error ? error.message : String(error)}`);
    throw new Error('Failed to initialize database storage directory');
  }
}

// Database connection
const dbPath = path.join(DATA_DIR, DB_FILENAME);
let db: Database.Database;

try {
  db = new Database(dbPath);
  console.log(`Connected to database at: ${dbPath}`);
} catch (error) {
  console.error(`Database connection error: ${error instanceof Error ? error.message : String(error)}`);
  throw new Error('Failed to connect to database');
}

/**
 * Initializes the database schema by creating tables if they don't exist
 * 
 * Creates the following tables:
 * - users: For user authentication and profile
 * - plants: For plant information storage
 * - care_schedules: For plant care scheduling
 * - care_logs: For tracking care activities
 * - care_tips: For storing species-specific care tips
 */
const initDb = (): void => {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Plants table
  db.exec(`
    CREATE TABLE IF NOT EXISTS plants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      species TEXT,
      acquired_date DATE,
      image_url TEXT,
      notes TEXT,
      is_favorite BOOLEAN DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Add the is_favorite column if it doesn't exist
  try {
    // Check if the column exists
    const columnExists = db.prepare(`PRAGMA table_info(plants)`).all()
      .some((col: any) => col.name === 'is_favorite');
    
    if (!columnExists) {
      db.exec(`ALTER TABLE plants ADD COLUMN is_favorite BOOLEAN DEFAULT 0`);
      console.log('Added is_favorite column to plants table');
    }
  } catch (error) {
    console.error(`Error checking/adding is_favorite column: ${error instanceof Error ? error.message : String(error)}`);
    // Non-critical error, don't throw
  }

  // Care schedule table
  db.exec(`
    CREATE TABLE IF NOT EXISTS care_schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plant_id INTEGER NOT NULL,
      watering_interval INTEGER,
      fertilizing_interval INTEGER,
      last_watered DATE,
      last_fertilized DATE,
      light_needs TEXT,
      next_task_date DATE,
      FOREIGN KEY (plant_id) REFERENCES plants(id)
    )
  `);

  // Care logs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS care_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plant_id INTEGER NOT NULL,
      action_type TEXT NOT NULL,
      action_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      notes TEXT,
      FOREIGN KEY (plant_id) REFERENCES plants(id)
    )
  `);

  // Care tips table
  db.exec(`
    CREATE TABLE IF NOT EXISTS care_tips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      species TEXT NOT NULL,
      tip TEXT NOT NULL,
      source TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log("Database schema initialized successfully");
};

/**
 * Helper function to convert snake_case column names to camelCase for API responses
 * @param {Object} row - Database row with snake_case keys
 * @returns {Object} - Object with camelCase keys
 */
export const toCamelCase = <T extends Record<string, any>>(row: T): Record<string, any> => {
  const result: Record<string, any> = {};
  for (const key in row) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = row[key];
  }
  return result;
};

/**
 * Helper function to safely prepare a SQL statement with error handling
 * @param {string} sql - SQL statement to prepare
 * @returns {Database.Statement} - Prepared statement
 */
export const safelyPrepare = (sql: string): Database.Statement => {
  try {
    return db.prepare(sql);
  } catch (error) {
    console.error(`SQL preparation error: ${error instanceof Error ? error.message : String(error)}`);
    console.error(`Failed SQL: ${sql}`);
    throw new Error('Failed to prepare SQL statement');
  }
};

/**
 * Create a transaction from multiple SQL statements
 * @param {(...args: any[]) => any} fn - Function containing multiple database operations
 * @returns {(...args: any[]) => any} - Transaction function that works atomically
 */
export const createTransaction = (fn: (...args: any[]) => any): (...args: any[]) => any => {
  return db.transaction(fn);
};

// Initialize the database
try {
  initDb();
} catch (error) {
  console.error(`Critical database initialization error: ${error instanceof Error ? error.message : String(error)}`);
  throw new Error('Failed to initialize database schema');
}

export { db, initDb };
