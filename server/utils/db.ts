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
import type { Plant, PlantRow } from '~/types/database';

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
      species_id INTEGER,
      family_id INTEGER,
      genus_id INTEGER,
      acquired_date DATE,
      image_url TEXT,
      notes TEXT,
      is_favorite BOOLEAN DEFAULT 0,
      can_sell BOOLEAN DEFAULT 0,
      is_personal BOOLEAN DEFAULT 0,
      common_name TEXT,
      flower_color TEXT,
      variety TEXT,
      light_pref TEXT,
      water_pref TEXT,
      soil_type TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at DATE,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (species_id) REFERENCES plant_species(id),
      FOREIGN KEY (family_id) REFERENCES plant_family(id),
      FOREIGN KEY (genus_id) REFERENCES plant_genus(id)
    )
  `);

  // Add columns to plants table if they don't exist
  try {
    const plantsColumns = db.prepare(`PRAGMA table_info(plants)`).all() as { name: string }[];
    const existingColumns = new Set(plantsColumns.map((col) => col.name));

    // Add each new column if it doesn't exist
    const newColumns = [
      { name: 'is_favorite', type: 'BOOLEAN DEFAULT 0' },
      { name: 'can_sell', type: 'BOOLEAN DEFAULT 0' },
      { name: 'is_personal', type: 'BOOLEAN DEFAULT 0' },
      { name: 'common_name', type: 'TEXT' },
      { name: 'flower_color', type: 'TEXT' },
      { name: 'variety', type: 'TEXT' },
      { name: 'light_pref', type: 'TEXT' },
      { name: 'water_pref', type: 'TEXT' },
      { name: 'soil_type', type: 'TEXT' },
      { name: 'family_id', type: 'INTEGER' },
      { name: 'genus_id', type: 'INTEGER' },
      { name: 'species_id', type: 'INTEGER' },
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
      name TEXT NOT NULL UNIQUE,
      genus_id INTEGER NOT NULL,
      common_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (genus_id) REFERENCES plant_genus(id)
    )
  `);

  // Plant Genus table
  db.exec(`
    CREATE TABLE IF NOT EXISTS plant_genus (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      family_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (family_id) REFERENCES plant_family(id)
    )
  `);

  // Plant Family table
  db.exec(`
    CREATE TABLE IF NOT EXISTS plant_family (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
  // Using plant_species, plant_genus, plant_family, market_price, plant_propagation, and plant_inventory instead

  console.log('Database schema initialized successfully');
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
 * Helper function to convert SQLite Plant row to application Plant type
 * Converts integer booleans (0/1) to actual booleans and null to undefined
 * @param {PlantRow} row - Database row with integer booleans and potential nulls
 * @returns {Plant} - Plant object with proper boolean types and undefined instead of null
 */
export const plantRowToPlant = (row: PlantRow): Plant => {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    is_favorite: Boolean(row.is_favorite),
    created_at: row.created_at,
    updated_at: row.updated_at,
    can_sell: Boolean(row.can_sell),
    is_personal: Boolean(row.is_personal),
    species_id: row.species_id ?? undefined,
    family_id: row.family_id ?? undefined,
    genus_id: row.genus_id ?? undefined,
    acquired_date: row.acquired_date ?? undefined,
    image_url: row.image_url ?? undefined,
    notes: row.notes ?? undefined,
    common_name: row.common_name ?? undefined,
    flower_color: row.flower_color ?? undefined,
    variety: row.variety ?? undefined,
    light_pref: row.light_pref ?? undefined,
    water_pref: row.water_pref ?? undefined,
    soil_type: row.soil_type ?? undefined,
  };
};

/**
 * Helper function to convert application Plant type to database-ready data
 * Converts undefined to null for database storage (SQLite handles booleans natively)
 * @param {Partial<Plant>} plant - Plant object with boolean types and undefined values
 * @returns {Partial<PlantRow>} - Database-ready object with null values
 */
export const plantToPlantRow = (plant: Partial<Plant>): Partial<PlantRow> => {
  const result: any = { ...plant };

  // No boolean conversion needed - SQLite handles booleans natively

  // Convert undefined to null for database storage
  const optionalFields = [
    'species_id',
    'family_id',
    'genus_id',
    'acquired_date',
    'image_url',
    'notes',
    'common_name',
    'flower_color',
    'variety',
    'light_pref',
    'water_pref',
    'soil_type',
  ];

  optionalFields.forEach((field) => {
    if (result[field] === undefined) {
      result[field] = null;
    }
  });

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
export const createTransaction = (fn: (...args: any[]) => any): ((...args: any[]) => any) => {
  return db.transaction(fn);
};

/**
 * Utility function to convert null values to undefined in any object
 * @param {any} obj - Object that may contain null values
 * @returns {any} - Object with null values converted to undefined
 */
export const nullToUndefined = <T>(obj: T): T => {
  if (obj === null) return undefined as any;
  if (typeof obj !== 'object' || obj === undefined) return obj;

  if (Array.isArray(obj)) {
    return obj.map(nullToUndefined) as any;
  }

  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = nullToUndefined(value);
  }
  return result;
};

/**
 * Utility function to convert undefined values to null in any object (for database storage)
 * @param {any} obj - Object that may contain undefined values
 * @returns {any} - Object with undefined values converted to null
 */
export const undefinedToNull = <T>(obj: T): T => {
  if (obj === undefined) return null as any;
  if (typeof obj !== 'object' || obj === null) return obj;

  if (Array.isArray(obj)) {
    return obj.map(undefinedToNull) as any;
  }

  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    // Explicitly convert undefined to null
    result[key] = value === undefined ? null : undefinedToNull(value);
  }
  return result;
};

// Initialize the database
try {
  initDb();
} catch (error) {
  console.error(`Critical database initialization error: ${error instanceof Error ? error.message : String(error)}`);
  throw new Error('Failed to initialize database schema');
}

export { db, initDb };
