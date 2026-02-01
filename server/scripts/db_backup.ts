/**
 * Database Backup Script
 * Creates timestamped backup of production database
 */

import fs from 'fs';
import path from 'path';
import { getDbPath } from '../utils/db_build';

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const dbPath = getDbPath();
const backupDir = path.join(path.dirname(dbPath), 'backups');
const backupPath = path.join(backupDir, `plant-keeper-${timestamp}.db`);

// Create backups directory if it doesn't exist
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Copy database file
if (fs.existsSync(dbPath)) {
  fs.copyFileSync(dbPath, backupPath);
  console.log(`✓ Database backed up to: ${backupPath}`);
} else {
  console.log(`⚠ No database found at: ${dbPath}`);
}
