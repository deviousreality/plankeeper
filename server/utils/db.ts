/**
 * Database utility module for PlantKeeper application
 *
 * This module provides database connection, initialization, and utility functions
 * for interacting with the SQLite database. It uses better-sqlite3 for efficient
 * and synchronous database operations.
 */
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

/**
 * Database table types
 */
export type User = {
  id: number;
  username: string;
  password: string;
  email: string | null;
  created_at: string;
  updated_at: string;
};

export type Plant = {
  id: number;
  user_id: number;
  name: string;
  species: string | null;
  family: string | null;
  genius: string | null;
  acquired_date: string | null;
  image_url: string | null;
  notes: string | null;
  is_favorite: number; // 0 = false, 1 = true (SQLite doesn't have true boolean)
  created_at: string;
  updated_at: string;
  can_sell: number;
  is_personal: number;
  common_name: string | null;
  flower_color: string | null;
  variety: string | null;
  light_pref: string | null;
  water_pref: string | null;
  soil_type: string | null;
};

export type PlantSpecies = {
  id: number;
  name: string;
};

export type PlantGenius = {
  id: number;
  name: string;
  species_id: number | null;
};

export type PlantFamily = {
  id: number;
  name: string;
  genius_id: number | null;
  species_id: number | null;
};

export type MarketPrice = {
  id: number;
  plant_id: number;
  date_checked: string;
  price: number;
};

export type PlantPropagation = {
  id: number;
  plant_id: number;
  prop_type: number | null;
  seed_source: string | null;
  cutting_source: string | null;
  prop_date: string | null;
  initial_count: number | null;
  current_count: number | null;
  transplant_date: string | null;
  notes: string | null;
  zero_cout_notes: string | null;
};

export type PlantInventory = {
  id: number;
  plant_id: number;
  quantity: number | null;
  plant_age: number | null;
  plant_size: number | null;
  last_watered_date: string | null;
  last_fertilized_date: string | null;
  location: string | null;
  notes: string | null;
  acquisition_date: string | null;
  status: string | null;
  date_death: string | null;
  cause_of_death: string | null;
  death_notes: string | null;
  death_location: string | null;
};

export type CareSchedule = {
  id: number;
  plant_id: number;
  watering_interval: number | null;
  fertilizing_interval: number | null;
  last_watered: string | null;
  last_fertilized: string | null;
  light_needs: string | null;
  next_task_date: string | null;
};

export type CareLog = {
  id: number;
  plant_id: number;
  action_type: string;
  action_date: string;
  notes: string | null;
};

export type CareTip = {
  id: number;
  species: string;
  tip: string;
  source: string | null;
  created_at: string;
};

// Configuration
const DATA_DIR = path.resolve(process.cwd(), "data");
const DB_FILENAME = "plant-keeper.db";

// Ensure the data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, {recursive: true});
    console.log(`Created data directory at: ${DATA_DIR}`);
  } catch (error) {
    console.error(`Failed to create data directory: ${error instanceof Error ? error.message : String(error)}`);
    throw new Error("Failed to initialize database storage directory");
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
  throw new Error("Failed to connect to database");
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
      can_sell BOOLEAN DEFAULT 0,
      is_personal BOOLEAN DEFAULT 1,
      common_name TEXT,
      flower_color TEXT,
      variety TEXT,
      light_pref TEXT,
      water_pref TEXT,
      soil_type TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Add columns to plants table if they don't exist
  try {
    const plantsColumns = db.prepare(`PRAGMA table_info(plants)`).all() as {name: string}[];
    const existingColumns = new Set(plantsColumns.map((col) => col.name));

    // Add each new column if it doesn't exist
    const newColumns = [
      {name: "is_favorite", type: "BOOLEAN DEFAULT 0"},
      {name: "can_sell", type: "BOOLEAN DEFAULT 0"},
      {name: "is_personal", type: "BOOLEAN DEFAULT 1"},
      {name: "common_name", type: "TEXT"},
      {name: "flower_color", type: "TEXT"},
      {name: "variety", type: "TEXT"},
      {name: "light_pref", type: "TEXT"},
      {name: "water_pref", type: "TEXT"},
      {name: "soil_type", type: "TEXT"},
      {name: "family", type: "TEXT"},
      {name: "genius", type: "TEXT"},
    ];

    for (const column of newColumns) {
      if (!existingColumns.has(column.name)) {
        db.exec(`ALTER TABLE plants ADD COLUMN ${column.name} ${column.type}`);
        console.log(`Added ${column.name} column to plants table`);
      }
    }
  } catch (error) {
    console.error(`Error checking/adding plant columns: ${error instanceof Error ? error.message : String(error)}`);
    // Non-critical error, don't throw
  }

  // Plant Species table
  db.exec(`
    CREATE TABLE IF NOT EXISTS plant_species (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    )
  `);

  // Plant Genus table (corrected from "genius")
  db.exec(`
    CREATE TABLE IF NOT EXISTS plant_genius (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      species_id INTEGER,
      FOREIGN KEY (species_id) REFERENCES plant_species(id)
    )
  `);

  // Plant Family table
  db.exec(`
    CREATE TABLE IF NOT EXISTS plant_family (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      genius_id INTEGER,
      species_id INTEGER,
      FOREIGN KEY (genius_id) REFERENCES plant_genius(id),
      FOREIGN KEY (species_id) REFERENCES plant_species(id)
    )
  `);

  // Market Price table
  db.exec(`
    CREATE TABLE IF NOT EXISTS market_price (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plant_id INTEGER NOT NULL,
      date_checked DATE NOT NULL,
      price DECIMAL(5,2) NOT NULL,
      FOREIGN KEY (plant_id) REFERENCES plants(id)
    )
  `);

  // Plant Propagation table
  db.exec(`
    CREATE TABLE IF NOT EXISTS plant_propagation (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plant_id INTEGER NOT NULL,
      prop_type INTEGER,
      seed_source TEXT,
      cutting_source TEXT,
      prop_date DATE,
      initial_count INTEGER,
      current_count INTEGER,
      transplant_date DATE,
      notes TEXT,
      zero_cout_notes TEXT,
      FOREIGN KEY (plant_id) REFERENCES plants(id)
    )
  `);

  // Plant Inventory table
  db.exec(`
    CREATE TABLE IF NOT EXISTS plant_inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plant_id INTEGER NOT NULL,
      quantity INTEGER,
      plant_age INTEGER,
      plant_size DECIMAL(5,2),
      last_watered_date DATE,
      last_fertilized_date DATE,
      location TEXT,
      notes TEXT,
      acquisition_date DATE,
      status TEXT,
      date_death DATE,
      cause_of_death TEXT,
      death_notes TEXT,
      death_location TEXT,
      FOREIGN KEY (plant_id) REFERENCES plants(id)
    )
  `);

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

  // Note: Removed duplicate table creation
  // Using plant_species, plant_genius, plant_family, market_price, plant_propagation, and plant_inventory instead

  console.log("Database schema initialized successfully");
};

/**
 * Helper function to convert snake_case column names to camelCase for API responses
 * @param {Object} row - Database row with snake_case keys
 * @returns {Object} - Object with camelCase keys
 */
export const toCamelCase = <T extends Record<string, unknown>>(row: T): Record<string, unknown> => {
  const result: Record<string, unknown> = {};
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
    throw new Error("Failed to prepare SQL statement");
  }
};

/**
 * Create a transaction from multiple SQL statements
 * @param {(...args: any[]) => any} fn - Function containing multiple database operations
 * @returns {(...args: any[]) => any} - Transaction function that works atomically
 */
export const createTransaction = (fn: (...args: any[]) => any): ((...args: any[]) => any) => {
  return db.transaction(fn);
};

// Initialize the database
try {
  initDb();
} catch (error) {
  console.error(`Critical database initialization error: ${error instanceof Error ? error.message : String(error)}`);
  throw new Error("Failed to initialize database schema");
}

export {db, initDb};
