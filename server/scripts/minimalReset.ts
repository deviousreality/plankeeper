// server/scripts/minimalReset.ts
import { db, initDb } from '../utils/db';
import bcrypt from 'bcryptjs';

console.log('Starting minimal database reset...');

// Initialize database schema first
initDb();
console.log('Database schema initialized');

async function addMinimalData() {
  try {
    // Hash a default password for the admin user
    const defaultPassword = 'admin123';
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(defaultPassword, saltRounds);

    // Check if admin user already exists
    const existingAdmin = db.prepare(`SELECT id FROM users WHERE username = 'admin'`).get() as
      | { id: number }
      | undefined;

    let adminUserId: number;
    if (existingAdmin) {
      // Update existing admin user
      db.prepare(`UPDATE users SET password = ?, email = ? WHERE username = 'admin'`).run(
        hashedPassword,
        'admin@example.com'
      );
      adminUserId = existingAdmin.id;
      console.log(`Updated existing admin user: ${adminUserId}`);
    } else {
      // Insert new admin user
      const userResult = db
        .prepare(`INSERT INTO users (username, password, email) VALUES ('admin', ?, 'admin@example.com')`)
        .run(hashedPassword);
      adminUserId = userResult.lastInsertRowid as number;
      console.log(`Added new admin user: ${adminUserId}`);
    }

    console.log(`Default admin credentials: username="admin", password="${defaultPassword}"`);

    // Add just one simple family/genus/species for testing
    const familyResult = db.prepare('INSERT OR IGNORE INTO plant_family (name) VALUES (?)').run('Araceae');
    const familyId = familyResult.lastInsertRowid as number;

    const genusResult = db
      .prepare('INSERT OR IGNORE INTO plant_genus (name, family_id) VALUES (?, ?)')
      .run('Monstera', familyId);
    const genusId = genusResult.lastInsertRowid as number;

    const speciesResult = db
      .prepare('INSERT OR IGNORE INTO plant_species (name, genus_id) VALUES (?, ?)')
      .run('Monstera deliciosa', genusId);
    const speciesId = speciesResult.lastInsertRowid as number;

    console.log('Added basic taxonomy structure:');
    console.log(`  Family: Araceae (ID: ${familyId})`);
    console.log(`  Genus: Monstera (ID: ${genusId})`);
    console.log(`  Species: Monstera deliciosa (ID: ${speciesId})`);
  } catch (error) {
    console.error('Error adding minimal data:', error);
  }
}

// Call the function to add minimal data
addMinimalData().then(() => {
  console.log('Minimal database reset completed successfully!');
});
