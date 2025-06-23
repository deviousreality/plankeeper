// server/utils/db.ts
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

// Ensure the data directory exists
const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Database connection
const dbPath = path.join(dataDir, 'plant-keeper.db');
const db = new Database(dbPath);

// Initialize database schema
const initDb = () => {
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
      .some(col => col.name === 'is_favorite');
    
    if (!columnExists) {
      db.exec(`ALTER TABLE plants ADD COLUMN is_favorite BOOLEAN DEFAULT 0`);
      console.log('Added is_favorite column to plants table');
    }
  } catch (error) {
    console.error('Error checking/adding is_favorite column:', error);
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

  console.log("Database initialized successfully");
};

// Initialize the database
try {
  initDb();
} catch (error) {
  console.error("Error initializing database:", error);
}

export { db, initDb };
