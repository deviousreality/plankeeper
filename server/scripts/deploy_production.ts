/**
 * Production Deployment Script
 *
 * This script handles the production deployment process:
 * 1. Builds the Nuxt application for production
 * 2. Checks if production database exists
 * 3. Creates production database if it doesn't exist
 * 4. Runs database migrations
 */

import { execSync } from 'child_process';
import fs from 'fs';
import Database from 'better-sqlite3';
import { buildTables, createDatabase, getDbPath } from '../utils/db_build';
import { runMigrations } from '../utils/migrations';
import 'dotenv/config';

const dbPath = () => getDbPath();

/**
 * Run a shell command and display output
 */
const runCommand = (command: string, description: string): void => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`${description}`);
  console.log(`${'='.repeat(60)}\n`);

  try {
    execSync(command, { stdio: 'inherit', env: { ...process.env, NODE_ENV: 'production' } });
    console.log(`✓ ${description} completed successfully\n`);
  } catch (error) {
    console.error(`✗ ${description} failed`);
    throw error;
  }
};

/**
 * Check if production database exists
 */
const checkDatabaseExists = (): boolean => {
  const path = dbPath();

  console.log(`\n${'='.repeat(60)}`);
  console.log('Checking for production database');
  console.log(`${'='.repeat(60)}`);
  console.log(`Database path: ${path}`);

  const exists = fs.existsSync(path);
  console.log(`Database exists: ${exists ? '✓ Yes' : '✗ No'}\n`);

  return exists;
};

/**
 * Create and initialize production database
 */
const createProductionDatabase = (): void => {
  console.log(`\n${'='.repeat(60)}`);
  console.log('Creating production database');
  console.log(`${'='.repeat(60)}\n`);

  const db = createDatabase(dbPath());

  // Build database schema
  console.log('Building database schema...');
  buildTables(db);

  console.log('✓ Production database created and initialized\n');

  db.close();
};

/**
 * Run database migrations
 */
const runDatabaseMigrations = async (): Promise<void> => {
  console.log(`\n${'='.repeat(60)}`);
  console.log('Running database migrations');
  console.log(`${'='.repeat(60)}\n`);

  const db = new Database(dbPath());

  try {
    await runMigrations(db, 'up');
    console.log('✓ Database migrations completed\n');
  } catch (error) {
    console.error('✗ Migration failed:', error);
    throw error;
  } finally {
    db.close();
  }
};

/**
 * Main deployment function
 */
const deploy = async (): Promise<void> => {
  console.log('\n');
  console.log('╔' + '═'.repeat(58) + '╗');
  console.log('║' + ' '.repeat(10) + 'PRODUCTION DEPLOYMENT SCRIPT' + ' '.repeat(20) + '║');
  console.log('╚' + '═'.repeat(58) + '╝');
  console.log('\n');

  try {
    // Step 1: Check if database exists
    const dbExists = checkDatabaseExists();

    // // Step 2: Create database if it doesn't exist
    if (!dbExists) {
      createProductionDatabase();
    } else {
      console.log('Database already exists, skipping creation...\n');
    }

    // // Step 3: Run migrations
    await runDatabaseMigrations();

    // Step 4: Build Nuxt application for production
    const buildCmd = `nuxi build"`;
    runCommand(buildCmd, 'Step 1: Building Nuxt application');

    console.log('\n');
    console.log('╔' + '═'.repeat(58) + '╗');
    console.log('║' + ' '.repeat(8) + '✓ DEPLOYMENT COMPLETED SUCCESSFULLY!' + ' '.repeat(13) + '║');
    console.log('╚' + '═'.repeat(58) + '╝');
    console.log('\n');
    console.log('Next steps:');
    console.log('  - Review the build output in .output directory');
    console.log('  - Set up environment variables for production');
    console.log('  - Start the production server with: npm run preview');
    console.log('\n');
  } catch (error) {
    console.error('\n');
    console.error('╔' + '═'.repeat(58) + '╗');
    console.error('║' + ' '.repeat(12) + '✗ DEPLOYMENT FAILED!' + ' '.repeat(21) + '║');
    console.error('╚' + '═'.repeat(58) + '╝');
    console.error('\n');
    console.error('Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
};

// Run deployment
await deploy();
