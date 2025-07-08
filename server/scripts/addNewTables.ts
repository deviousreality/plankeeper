/**
 * Database migration script for PlantKeeper application
 *
 * This script adds new tables and columns to the existing database schema:
 * - market_price: For tracking plant market prices
 * - plant_species: For standardizing plant species data
 * - plant_genius: For tracking plant genus (taxonomic classification)
 * - plant_family: For tracking plant family classification
 * - plant_propagation: For tracking plant propagation efforts
 * - plant_inventory: For detailed plant inventory management
 * - Updates plants table with new columns
 * - Fixes foreign key issues and removes duplicate tables
 */
import {db} from "../utils/db";

console.log("Starting database migration...");

// Enable foreign key constraints
db.pragma("foreign_keys = ON");

try {
  // Start a transaction for all schema changes
  const migration = db.transaction(() => {
    console.log("Step 1: Cleaning up duplicate tables...");

    // Check for and remove duplicate tables
    const duplicateTables = ["species", "genius", "family", "market_prices", "propagation", "inventory"];

    for (const tableName of duplicateTables) {
      try {
        // Check if table exists
        const tableExists = db
          .prepare(
            `
          SELECT name FROM sqlite_master WHERE type='table' AND name=?
        `
          )
          .get(tableName);

        if (tableExists) {
          console.log(`Found duplicate table: ${tableName}`);
          // Backup data if it exists
          const data = db.prepare(`SELECT * FROM ${tableName}`).all();
          if (data.length > 0) {
            console.log(`Warning: ${tableName} contains ${data.length} records that will be lost`);
          }

          // Drop the duplicate table
          db.exec(`DROP TABLE ${tableName}`);
          console.log(`Dropped duplicate table: ${tableName}`);
        }
      } catch (error) {
        console.log(`No duplicate table ${tableName} found or already removed`);
      }
    }

    console.log("Step 2: Updating plants table with new columns...");

    // Check if columns exist before adding them
    const plantsColumns = db.prepare(`PRAGMA table_info(plants)`).all() as {name: string}[];
    const existingColumns = new Set(plantsColumns.map((col) => col.name));

    // Add each new column if it doesn't exist
    const newColumns = [
      {name: "can_sell", type: "BOOLEAN DEFAULT 0"},
      {name: "is_personal", type: "BOOLEAN DEFAULT 1"},
      {name: "common_name", type: "TEXT"},
      {name: "flower_color", type: "TEXT"},
      {name: "variety", type: "TEXT"},
      {name: "light_pref", type: "TEXT"},
      {name: "water_pref", type: "TEXT"},
      {name: "soil_type", type: "TEXT"},
    ];

    for (const column of newColumns) {
      if (!existingColumns.has(column.name)) {
        db.exec(`ALTER TABLE plants ADD COLUMN ${column.name} ${column.type}`);
        console.log(`Added ${column.name} column to plants table`);
      }
    }

    // Create plant_species table
    console.log("Step 3: Creating plant_species table...");
    db.exec(`
      CREATE TABLE IF NOT EXISTS plant_species (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL
      )
    `);

    // Create plant_genius (genus) table
    console.log("Step 4: Creating plant_genius table...");
    db.exec(`
      CREATE TABLE IF NOT EXISTS plant_genius (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        species_id INTEGER,
        FOREIGN KEY (species_id) REFERENCES plant_species(id)
      )
    `);

    // Create plant_family table (fixed hierarchy)
    console.log("Step 5: Creating plant_family table with correct hierarchy...");

    // First check if plant_family exists and has wrong structure
    const familyExists = db
      .prepare(
        `
      SELECT name FROM sqlite_master WHERE type='table' AND name='plant_family'
    `
      )
      .get();

    if (familyExists) {
      // Check current structure
      const familyInfo = db.prepare(`PRAGMA table_info(plant_family)`).all() as {name: string}[];
      const hasSpeciesId = familyInfo.some((col) => col.name === "species_id");

      if (hasSpeciesId) {
        console.log("Fixing plant_family table structure...");

        // Backup existing data
        const familyData = db.prepare(`SELECT * FROM plant_family`).all() as {name: string; genius_id: number}[];

        // Drop and recreate with correct structure
        db.exec(`DROP TABLE plant_family`);

        db.exec(`
          CREATE TABLE plant_family (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            genius_id INTEGER,
            FOREIGN KEY (genius_id) REFERENCES plant_genius(id)
          )
        `);

        // Restore data (excluding species_id)
        if (familyData.length > 0) {
          const insertFamily = db.prepare(`
            INSERT INTO plant_family (name, genius_id) VALUES (?, ?)
          `);

          for (const row of familyData) {
            insertFamily.run(row.name, row.genius_id);
          }

          console.log(`Restored ${familyData.length} family records with corrected structure`);
        }
      } else {
        console.log("plant_family table already has correct structure");
      }
    } else {
      // Create new table with correct structure
      db.exec(`
        CREATE TABLE plant_family (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          genius_id INTEGER,
          FOREIGN KEY (genius_id) REFERENCES plant_genius(id)
        )
      `);
    }

    // Create market_price table
    console.log("Step 6: Creating market_price table...");
    db.exec(`
      CREATE TABLE IF NOT EXISTS market_price (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plant_id INTEGER NOT NULL,
        date_checked DATE NOT NULL,
        price DECIMAL(5,2) NOT NULL,
        FOREIGN KEY (plant_id) REFERENCES plants(id)
      )
    `);

    // Create plant_propagation table
    console.log("Step 7: Creating plant_propagation table...");
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

    // Create plant_inventory table
    console.log("Step 8: Creating plant_inventory table...");
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

    console.log("Step 9: Verifying foreign key constraints...");

    // Check for foreign key violations
    const foreignKeys = db.prepare(`PRAGMA foreign_key_check`).all();
    if (foreignKeys.length > 0) {
      console.log("Foreign key constraint violations found:");
      console.log(foreignKeys);
      throw new Error("Foreign key constraints are violated");
    }

    console.log("All foreign key constraints are valid!");
  });

  // Execute the transaction
  migration();

  console.log("Database migration completed successfully!");
} catch (error) {
  console.error(`Migration failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
