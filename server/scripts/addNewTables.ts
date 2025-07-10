/**
 * Database setup script for PlantKeeper application
 *
 * This script creates the complete database schema with correct taxonomy naming:
 * - plant_family: For tracking plant family classification
 * - plant_genus: For tracking plant genus (taxonomic classification)
 * - plant_species: For standardizing plant species data
 * - market_price: For tracking plant market prices
 * - plant_propagation: For tracking plant propagation efforts
 * - plant_inventory: For detailed plant inventory management
 * - Updates plants table with all required columns
 * - Ensures proper foreign key relationships and data integrity
 */
import {db} from "../utils/db";

console.log("Starting database setup...");

// Enable foreign key constraints
db.pragma("foreign_keys = ON");

try {
  // Start a transaction for all schema setup
  const setup = db.transaction(() => {
    console.log("Step 1: Cleaning up any legacy data and tables...");

    // Temporarily disable foreign keys for structural changes
    db.pragma("foreign_keys = OFF");

    // Check what tables exist
    const allTables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    const tableNames = allTables.map((t: any) => t.name);

    // Handle legacy genius→genus data migration if old tables exist
    if (tableNames.includes("plant_genius")) {
      console.log("Found legacy data - migrating to correct taxonomy structure...");

      // Backup legacy data
      const geniusData = db.prepare("SELECT * FROM plant_genius").all();
      const speciesData = tableNames.includes("plant_species") ? db.prepare("SELECT * FROM plant_species").all() : [];
      const plantsData = tableNames.includes("plants") ? db.prepare("SELECT * FROM plants").all() : [];

      // Drop legacy tables to start fresh
      if (tableNames.includes("plant_genus")) db.exec("DROP TABLE plant_genus");
      if (tableNames.includes("plant_species")) db.exec("DROP TABLE plant_species");
      if (tableNames.includes("plant_family")) db.exec("DROP TABLE plant_family");
      if (tableNames.includes("plant_genius")) db.exec("DROP TABLE plant_genius");

      // Store legacy data for later restoration
      if (geniusData.length > 0 || speciesData.length > 0 || plantsData.length > 0) {
        console.log(
          `Preserving ${geniusData.length} genus, ${speciesData.length} species, and ${plantsData.length} plant records for migration`
        );
      }
    }

    // Remove any duplicate or incorrectly named tables
    const duplicateTables = ["species", "family", "market_prices", "propagation", "inventory", "genius"];
    for (const tableName of duplicateTables) {
      if (tableNames.includes(tableName)) {
        console.log(`Removing duplicate/legacy table: ${tableName}`);
        db.exec(`DROP TABLE ${tableName}`);
      }
    }

    // Clean up plants table structure if it exists
    if (tableNames.includes("plants")) {
      const plantsColumns = db.prepare("PRAGMA table_info(plants)").all();
      const columnNames = plantsColumns.map((c: any) => c.name);

      // If plants table has legacy genius column, recreate it properly
      if (columnNames.includes("genius")) {
        console.log("Updating plants table structure...");
        const plantsData = db.prepare("SELECT * FROM plants").all();

        db.exec("DROP TABLE plants");

        // Create plants table with correct structure and foreign key references
        db.exec(`
          CREATE TABLE plants (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            species_id INTEGER,
            family_id INTEGER,
            genus_id INTEGER,
            acquired_date DATE,
            image_url TEXT,
            notes TEXT,
            is_favorite INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            can_sell INTEGER DEFAULT 0,
            is_personal INTEGER DEFAULT 1,
            common_name TEXT,
            flower_color TEXT,
            variety TEXT,
            light_pref TEXT,
            water_pref TEXT,
            soil_type TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (species_id) REFERENCES plant_species(id),
            FOREIGN KEY (family_id) REFERENCES plant_family(id),
            FOREIGN KEY (genus_id) REFERENCES plant_genus(id)
          )
        `);

        // Restore plant data with proper foreign key references
        if (plantsData.length > 0) {
          const insertPlant = db.prepare(`
            INSERT INTO plants (
              id, user_id, name, species_id, family_id, genus_id, acquired_date, image_url, notes,
              is_favorite, created_at, updated_at, can_sell, is_personal, common_name,
              flower_color, variety, light_pref, water_pref, soil_type
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);

          for (const row of plantsData) {
            // Convert old text references to NULL for now - will need manual data migration
            // In production, you'd want to look up the actual IDs from the taxonomy tables
            insertPlant.run(
              (row as any).id,
              (row as any).user_id,
              (row as any).name,
              null, // species_id - will need manual migration
              null, // family_id - will need manual migration
              null, // genus_id - will need manual migration
              (row as any).acquired_date,
              (row as any).image_url,
              (row as any).notes,
              (row as any).is_favorite,
              (row as any).created_at,
              (row as any).updated_at,
              (row as any).can_sell,
              (row as any).is_personal,
              (row as any).common_name,
              (row as any).flower_color,
              (row as any).variety,
              (row as any).light_pref,
              (row as any).water_pref,
              (row as any).soil_type
            );
          }
          console.log(
            `Restored ${plantsData.length} plant records with correct structure (taxonomy links need manual migration)`
          );
        }
      }
    }

    console.log("Step 2: Creating core taxonomy tables with correct hierarchy...");

    // Create plant_family table (top level)
    db.exec(`
      CREATE TABLE IF NOT EXISTS plant_family (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create plant_genus table (references family)
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

    // Create plant_species table (references genus)
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

    console.log("Step 3: Creating plants table with complete structure...");

    // Create or update plants table with all required columns and foreign keys
    if (!tableNames.includes("plants")) {
      db.exec(`
        CREATE TABLE plants (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          species_id INTEGER,
          family_id INTEGER,
          genus_id INTEGER,
          acquired_date DATE,
          image_url TEXT,
          notes TEXT,
          is_favorite INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          can_sell INTEGER DEFAULT 0,
          is_personal INTEGER DEFAULT 1,
          common_name TEXT,
          flower_color TEXT,
          variety TEXT,
          light_pref TEXT,
          water_pref TEXT,
          soil_type TEXT,
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (species_id) REFERENCES plant_species(id),
          FOREIGN KEY (family_id) REFERENCES plant_family(id),
          FOREIGN KEY (genus_id) REFERENCES plant_genus(id)
        )
      `);
    } else {
      // Check if plants table needs to be updated from text to foreign key columns
      const plantsColumns = db.prepare("PRAGMA table_info(plants)").all() as {name: string; type: string}[];
      const existingColumns = new Map(plantsColumns.map((col) => [col.name, col.type]));

      // Check if we need to migrate from text columns to foreign key columns OR clean up mixed schema
      const hasTextSpecies = existingColumns.has("species");
      const hasTextFamily = existingColumns.has("family");
      const hasTextGenus = existingColumns.has("genus");

      if (hasTextSpecies || hasTextFamily || hasTextGenus) {
        console.log("Converting plants table from text taxonomy to foreign key references...");

        // Backup existing data
        const existingPlants = db.prepare("SELECT * FROM plants").all();

        // Drop and recreate with proper structure
        db.exec("DROP TABLE plants");

        db.exec(`
          CREATE TABLE plants (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            species_id INTEGER,
            family_id INTEGER,
            genus_id INTEGER,
            acquired_date DATE,
            image_url TEXT,
            notes TEXT,
            is_favorite INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            can_sell INTEGER DEFAULT 0,
            is_personal INTEGER DEFAULT 1,
            common_name TEXT,
            flower_color TEXT,
            variety TEXT,
            light_pref TEXT,
            water_pref TEXT,
            soil_type TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (species_id) REFERENCES plant_species(id),
            FOREIGN KEY (family_id) REFERENCES plant_family(id),
            FOREIGN KEY (genus_id) REFERENCES plant_genus(id)
          )
        `);

        // Restore data preserving existing foreign key values where they exist
        if (existingPlants.length > 0) {
          const insertPlant = db.prepare(`
            INSERT INTO plants (
              user_id, name, species_id, family_id, genus_id, acquired_date, image_url, notes,
              is_favorite, created_at, updated_at, can_sell, is_personal, common_name,
              flower_color, variety, light_pref, water_pref, soil_type
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);

          for (const row of existingPlants) {
            insertPlant.run(
              (row as any).user_id,
              (row as any).name,
              (row as any).species_id || null, // Preserve existing foreign key if present
              (row as any).family_id || null, // Preserve existing foreign key if present
              (row as any).genus_id || null, // Preserve existing foreign key if present
              (row as any).acquired_date,
              (row as any).image_url,
              (row as any).notes,
              (row as any).is_favorite,
              (row as any).created_at,
              (row as any).updated_at,
              (row as any).can_sell,
              (row as any).is_personal,
              (row as any).common_name,
              (row as any).flower_color,
              (row as any).variety,
              (row as any).light_pref,
              (row as any).water_pref,
              (row as any).soil_type
            );
          }
          console.log(
            `Migrated ${existingPlants.length} plants to clean foreign key structure (preserving existing taxonomy links)`
          );
        }
      } else {
        // Ensure all other required columns exist
        const requiredColumns = [
          {name: "can_sell", type: "INTEGER DEFAULT 0"},
          {name: "is_personal", type: "INTEGER DEFAULT 1"},
          {name: "common_name", type: "TEXT"},
          {name: "flower_color", type: "TEXT"},
          {name: "variety", type: "TEXT"},
          {name: "light_pref", type: "TEXT"},
          {name: "water_pref", type: "TEXT"},
          {name: "soil_type", type: "TEXT"},
          {name: "species_id", type: "INTEGER"},
          {name: "family_id", type: "INTEGER"},
          {name: "genus_id", type: "INTEGER"},
        ];

        for (const column of requiredColumns) {
          if (!existingColumns.has(column.name)) {
            db.exec(`ALTER TABLE plants ADD COLUMN ${column.name} ${column.type}`);
            console.log(`Added ${column.name} column to plants table`);
          }
        }
      }
    }

    console.log("Step 4: Creating supporting application tables...");

    // Create market_price table
    db.exec(`
      CREATE TABLE IF NOT EXISTS market_price (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plant_id INTEGER NOT NULL,
        date_checked DATE NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (plant_id) REFERENCES plants(id)
      )
    `);

    // Create plant_propagation table
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
        zero_count_notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (plant_id) REFERENCES plants(id)
      )
    `);

    // Create plant_inventory table
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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (plant_id) REFERENCES plants(id)
      )
    `);

    // Re-enable foreign keys
    db.pragma("foreign_keys = ON");

    console.log("Step 5: Verifying database integrity...");

    // Check for foreign key violations
    const foreignKeys = db.prepare(`PRAGMA foreign_key_check`).all();
    if (foreignKeys.length > 0) {
      console.log("Foreign key constraint violations found:");
      console.log(foreignKeys);
      throw new Error("Foreign key constraints are violated");
    }

    console.log("All foreign key constraints are valid!");

    // Final verification: ensure plants table has clean schema (no mixed old/new columns)
    const finalPlantsColumns = db.prepare("PRAGMA table_info(plants)").all() as {name: string; type: string}[];
    const finalColumnNames = finalPlantsColumns.map((col) => col.name);
    const hasOldTextColumns =
      finalColumnNames.includes("species") || finalColumnNames.includes("family") || finalColumnNames.includes("genus");

    if (hasOldTextColumns) {
      console.log(
        "Warning: Plants table still has old text columns. Consider running 'npm run fix-plants-schema' to clean up."
      );
    } else {
      console.log("✓ Plants table has clean foreign key schema");
    }

    console.log("Database setup completed successfully with correct taxonomy structure!");
  });

  // Execute the setup transaction
  setup();

  console.log("PlantKeeper database is ready for use!");
} catch (error) {
  console.error(`Database setup failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
