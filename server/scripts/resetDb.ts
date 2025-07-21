// server/scripts/resetDb.ts
import { db, initDb } from '../utils/db';
import bcrypt from 'bcryptjs';

console.log('Starting database reset...');

// Initialize database schema
initDb();
console.log('Database schema initialized');

// Add sample data if needed
async function addSampleData() {
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
        .prepare(
          `
        INSERT INTO users (username, password, email) 
        VALUES ('admin', ?, 'admin@example.com')
      `
        )
        .run(hashedPassword);
      adminUserId = userResult.lastInsertRowid as number;
      console.log(`Added new admin user: ${adminUserId}`);
    }

    console.log(`Default admin credentials: username="admin", password="${defaultPassword}"`);

    // Add sample taxonomy data
    
    // Sample plant families
    const plantFamilies = [
      { id: 1, name: 'Araceae' },        // Monstera, Pothos, Peace Lily
      { id: 2, name: 'Asparagaceae' },   // Snake Plant
      { id: 3, name: 'Araliaceae' }      // ZZ Plant
    ];
    
    // Sample plant genera
    const plantGenera = [
      { id: 1, name: 'Monstera', family_id: 1 },
      { id: 2, name: 'Dracaena', family_id: 2 }, // Modern classification of Snake Plant
      { id: 3, name: 'Epipremnum', family_id: 1 }, // Pothos
      { id: 4, name: 'Spathiphyllum', family_id: 1 }, // Peace Lily
      { id: 5, name: 'Zamioculcas', family_id: 3 } // ZZ Plant
    ];
    
    // Sample plant species
    const plantSpecies = [
      { id: 1, name: 'deliciosa', genus_id: 1, common_name: 'Swiss Cheese Plant' }, // Monstera deliciosa
      { id: 2, name: 'trifasciata', genus_id: 2, common_name: 'Snake Plant' },      // Dracaena trifasciata (formerly Sansevieria)
      { id: 3, name: 'aureum', genus_id: 3, common_name: 'Golden Pothos' },         // Epipremnum aureum
      { id: 4, name: 'wallisii', genus_id: 4, common_name: 'Peace Lily' },          // Spathiphyllum wallisii
      { id: 5, name: 'zamiifolia', genus_id: 5, common_name: 'ZZ Plant' }           // Zamioculcas zamiifolia
    ];
    
    // Clear existing taxonomy data to prevent duplicates
    const existingFamiliesCount = db.prepare('SELECT COUNT(*) as count FROM plant_family').get() as { count: number };
    if (existingFamiliesCount.count > 0) {
      db.prepare('DELETE FROM plant_species').run();
      db.prepare('DELETE FROM plant_genus').run();
      db.prepare('DELETE FROM plant_family').run();
      console.log(`Cleared existing taxonomy data (${existingFamiliesCount.count} families)`);
    }
    
    // Insert plant families
    const familyInsert = db.prepare('INSERT OR IGNORE INTO plant_family (id, name) VALUES (?, ?)');
    plantFamilies.forEach(family => {
      familyInsert.run(family.id, family.name);
    });
    console.log(`Added ${plantFamilies.length} plant families`);
    
    // Insert plant genera
    const genusInsert = db.prepare('INSERT OR IGNORE INTO plant_genus (id, name, family_id) VALUES (?, ?, ?)');
    plantGenera.forEach(genus => {
      genusInsert.run(genus.id, genus.name, genus.family_id);
    });
    console.log(`Added ${plantGenera.length} plant genera`);
    
    // Insert plant species
    const speciesInsert = db.prepare('INSERT OR IGNORE INTO plant_species (id, name, genus_id, common_name) VALUES (?, ?, ?, ?)');
    plantSpecies.forEach(species => {
      speciesInsert.run(species.id, species.name, species.genus_id, species.common_name);
    });
    console.log(`Added ${plantSpecies.length} plant species`);
    
    // Sample care tips
    const careTips = [
      {
        species: 'Monstera Deliciosa',
        tip: 'Thrives in bright, indirect light. Water when top inch of soil is dry.',
        source: 'Plant Care Guide',
      },
      {
        species: 'Monstera Deliciosa',
        tip: 'Benefits from monthly fertilizing during growing season.',
        source: 'Plant Care Guide',
      },
      {
        species: 'Snake Plant',
        tip: 'Tolerates low light but prefers bright indirect light. Let soil dry completely before watering.',
        source: 'Plant Care Guide',
      },
      { species: 'Snake Plant', tip: 'Only needs fertilizing 2-3 times a year.', source: 'Plant Care Guide' },
      {
        species: 'Pothos',
        tip: 'Adaptable to various light conditions. Water when top 1-2 inches of soil are dry.',
        source: 'Plant Care Guide',
      },
      { species: 'Pothos', tip: 'Can be propagated easily in water from stem cuttings.', source: 'Plant Care Guide' },
      {
        species: 'Peace Lily',
        tip: 'Prefers low to medium indirect light. Water when leaves start to droop slightly.',
        source: 'Plant Care Guide',
      },
      {
        species: 'Peace Lily',
        tip: 'Enjoys high humidity. Regular misting is beneficial.',
        source: 'Plant Care Guide',
      },
      {
        species: 'ZZ Plant',
        tip: 'Thrives in low to bright indirect light. Let soil dry out between waterings.',
        source: 'Plant Care Guide',
      },
      {
        species: 'ZZ Plant',
        tip: 'Extremely drought tolerant. Better to underwater than overwater.',
        source: 'Plant Care Guide',
      },
    ];

    // Clear existing care tips to prevent duplicates
    const existingTipsCount = db.prepare('SELECT COUNT(*) as count FROM care_tips').get() as { count: number };
    if (existingTipsCount.count > 0) {
      db.prepare('DELETE FROM care_tips').run();
      console.log(`Cleared ${existingTipsCount.count} existing care tips`);
    }

    // Insert care tips
    const tipInsert = db.prepare('INSERT INTO care_tips (species, tip, source) VALUES (?, ?, ?)');
    let tipCount = 0;

    careTips.forEach((tip) => {
      tipInsert.run(tip.species, tip.tip, tip.source);
      tipCount++;
    });

    console.log(`Added ${tipCount} sample care tips`);
  } catch (error) {
    console.error('Error adding sample data:', error);
  }
}

// Call the function to add sample data
addSampleData().then(() => {
  console.log('Database reset completed successfully!');
});
