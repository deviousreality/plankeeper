/**
 * Utility script to verify that all necessary tables and columns were created
 * by the database migration
 */
import { db } from '../utils/db';

// Function to check if a table exists
function tableExists(tableName: string): boolean {
  const result = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name=?
  `).get(tableName);
  
  return !!result;
}

// Function to check if a column exists in a table
function columnExists(tableName: string, columnName: string): boolean {
  const result = db.prepare(`PRAGMA table_info(${tableName})`).all() as { name: string }[];
  return result.some(col => col.name === columnName);
}

// Tables that should exist after migration
const requiredTables = [
  'users',
  'plants',
  'care_schedules',
  'care_logs',
  'care_tips',
  'market_price',
  'plant_species',
  'plant_genius',
  'plant_family',
  'plant_propagation',
  'plant_inventory'
];

// New columns that should exist in the plants table
const requiredPlantColumns = [
  'can_sell',
  'is_personal',
  'common_name',
  'flower_color',
  'variety',
  'light_pref',
  'water_pref',
  'soil_type'
];

// Verify all required tables exist
console.log('Verifying database tables...');
const missingTables = requiredTables.filter(table => !tableExists(table));

if (missingTables.length > 0) {
  console.error(`Error: The following tables are missing: ${missingTables.join(', ')}`);
} else {
  console.log('All required tables exist!');
}

// Verify all required plant columns exist
console.log('\nVerifying plants table columns...');
const missingColumns = requiredPlantColumns.filter(col => !columnExists('plants', col));

if (missingColumns.length > 0) {
  console.error(`Error: The following columns are missing from plants table: ${missingColumns.join(', ')}`);
} else {
  console.log('All required plant columns exist!');
}

// List all tables in the database
const allTables = db.prepare('SELECT name FROM sqlite_master WHERE type=\'table\'').all() as { name: string }[];
console.log('\nTables in database:', allTables.map(t => t.name).join(', '));

// For each table, list its columns
console.log('\nTable schemas:');
for (const table of allTables) {
  const columns = db.prepare(`PRAGMA table_info(${table.name})`).all() as { name: string, type: string }[];
  console.log(`\n${table.name}:`);
  columns.forEach(col => console.log(`  - ${col.name} (${col.type})`));
}

console.log('\nDatabase verification complete!');
