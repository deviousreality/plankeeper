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
 */
import { db } from '../utils/db';
import path from 'path';

console.log('Starting database migration...');

try {
  // Start a transaction for all schema changes
  const migration = db.transaction(() => {
    // Add new columns to plants table
    console.log('Updating plants table with new columns...');
    
    // Check if columns exist before adding them
    const plantsColumns = db.prepare(`PRAGMA table_info(plants)`).all() as { name: string }[];
    const existingColumns = new Set(plantsColumns.map(col => col.name));
    
    // Add each new column if it doesn't exist
    const newColumns = [
      { name: 'can_sell', type: 'BOOLEAN DEFAULT 0' },
      { name: 'is_personal', type: 'BOOLEAN DEFAULT 1' },
      { name: 'common_name', type: 'TEXT' },
      { name: 'flower_color', type: 'TEXT' },
      { name: 'variety', type: 'TEXT' },
      { name: 'light_pref', type: 'TEXT' },
      { name: 'water_pref', type: 'TEXT' },
      { name: 'soil_type', type: 'TEXT' }
    ];
    
    for (const column of newColumns) {
      if (!existingColumns.has(column.name)) {
        db.exec(`ALTER TABLE plants ADD COLUMN ${column.name} ${column.type}`);
        console.log(`Added ${column.name} column to plants table`);
      }
    }
    
    // Create plant_species table
    console.log('Creating plant_species table...');
    db.exec(`
      CREATE TABLE IF NOT EXISTS plant_species (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL
      )
    `);
    
    // Create plant_genius (genus) table
    console.log('Creating plant_genius table...');
    db.exec(`
      CREATE TABLE IF NOT EXISTS plant_genius (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        species_id INTEGER,
        FOREIGN KEY (species_id) REFERENCES plant_species(id)
      )
    `);
    
    // Create plant_family table
    console.log('Creating plant_family table...');
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
    
    // Create market_price table
    console.log('Creating market_price table...');
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
    console.log('Creating plant_propagation table...');
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
    console.log('Creating plant_inventory table...');
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
  });
  
  // Execute the transaction
  migration();
  
  console.log('Database migration completed successfully!');
} catch (error) {
  console.error(`Migration failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
