/**
 * Script to add location and size columns to market_price table
 * 
 * This script adds:
 * - location: For store name, website, or location where price was observed
 * - size: For plant size information (4-inch pot, 1 gallon, etc.)
 */
import { db } from '../utils/db';

console.log('Starting market_price table update...');

try {
  // Check if the column already exists
  const columnInfo = db.prepare("PRAGMA table_info(market_price)").all();
  const columns = columnInfo.map((col: any) => col.name);
  
  // Start a transaction
  const updateTable = db.transaction(() => {
    // Add location column if it doesn't exist
    if (!columns.includes('location')) {
      console.log('Adding location column to market_price table...');
      db.exec('ALTER TABLE market_price ADD COLUMN location TEXT');
    } else {
      console.log('Location column already exists');
    }
    
    // Add size column if it doesn't exist
    if (!columns.includes('size')) {
      console.log('Adding size column to market_price table...');
      db.exec('ALTER TABLE market_price ADD COLUMN size TEXT');
    } else {
      console.log('Size column already exists');
    }
  });
  
  // Execute the transaction
  updateTable();
  
  console.log('Market_price table update completed successfully!');
} catch (error) {
  console.error(`Error updating market_price table: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
