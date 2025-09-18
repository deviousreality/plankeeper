// server/scripts/resetDb.ts
import { db, initDb } from '../utils/db';
import bcrypt from 'bcryptjs';

console.log('Starting database reset...');

// Initialize database schema first
initDb();
console.log('Database schema initialized');

// Disable foreign key constraints for data reset
db.pragma('foreign_keys = OFF');
console.log('Foreign key constraints disabled for reset');

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

    // Sample taxonomy data (Family -> Genus -> Species hierarchy)
    const taxonomyData = [
      {
        family: 'Araceae',
        genera: [
          {
            name: 'Monstera',
            species: [
              { name: 'Monstera deliciosa', commonName: 'Swiss Cheese Plant' },
              { name: 'Monstera adansonii', commonName: 'Monstera Monkey Mask' },
            ],
          },
          {
            name: 'Epipremnum',
            species: [
              { name: 'Epipremnum aureum', commonName: 'Golden Pothos' },
              { name: 'Epipremnum pinnatum', commonName: 'Devils Ivy' },
            ],
          },
          {
            name: 'Spathiphyllum',
            species: [{ name: 'Spathiphyllum wallisii', commonName: 'Peace Lily' }],
          },
        ],
      },
      {
        family: 'Asparagaceae',
        genera: [
          {
            name: 'Sansevieria',
            species: [
              { name: 'Sansevieria trifasciata', commonName: 'Snake Plant' },
              { name: 'Sansevieria cylindrica', commonName: 'Cylindrical Snake Plant' },
            ],
          },
        ],
      },
      {
        family: 'Araliaceae',
        genera: [
          {
            name: 'Zamioculcas',
            species: [{ name: 'Zamioculcas zamiifolia', commonName: 'ZZ Plant' }],
          },
        ],
      },
    ];

    // Clear existing taxonomy data to prevent duplicates (in dependency order)
    // Disable foreign keys temporarily for cleanup
    db.pragma('foreign_keys = OFF');

    db.prepare('DELETE FROM plants').run(); // Delete plants first (they reference taxonomy)
    db.prepare('DELETE FROM plant_species').run(); // Delete species next (they reference genus)
    db.prepare('DELETE FROM plant_genus').run(); // Delete genus next (they reference family)
    db.prepare('DELETE FROM plant_family').run(); // Delete family last (no dependencies)

    console.log('Cleared existing taxonomy data');

    // Insert taxonomy data with proper relationships
    const familyInsert = db.prepare('INSERT INTO plant_family (name) VALUES (?)');
    const genusInsert = db.prepare('INSERT INTO plant_genus (name, family_id) VALUES (?, ?)');
    const speciesInsert = db.prepare('INSERT INTO plant_species (name, genus_id, common_name) VALUES (?, ?, ?)');

    let familyCount = 0;
    let genusCount = 0;
    let speciesCount = 0;

    taxonomyData.forEach((familyData) => {
      // Insert family
      const familyResult = familyInsert.run(familyData.family);
      const familyId = familyResult.lastInsertRowid as number;
      familyCount++;

      familyData.genera.forEach((genusData) => {
        // Insert genus with family reference
        const genusResult = genusInsert.run(genusData.name, familyId);
        const genusId = genusResult.lastInsertRowid as number;
        genusCount++;

        genusData.species.forEach((speciesData) => {
          // Insert species with genus reference
          speciesInsert.run(speciesData.name, genusId, speciesData.commonName);
          speciesCount++;
        });
      });
    });

    console.log(`Added ${familyCount} plant families`);
    console.log(`Added ${genusCount} plant genera`);
    console.log(`Added ${speciesCount} plant species`);

    // Add sample plants for the admin user with proper taxonomy references
    const samplePlants = [
      {
        name: 'My Monstera',
        species: 'Monstera deliciosa',
        family: 'Araceae',
        genus: 'Monstera',
        notes: 'Large specimen in the living room corner',
        is_favorite: true,
        can_sell: false,
        is_personal: true,
      },
      {
        name: 'Golden Pothos on Bookshelf',
        species: 'Epipremnum aureum',
        family: 'Araceae',
        genus: 'Epipremnum',
        notes: 'Trailing vine plant on the bookshelf',
        is_favorite: false,
        can_sell: true,
        is_personal: true,
      },
      {
        name: 'Snake Plant Collection',
        species: 'Sansevieria trifasciata',
        family: 'Asparagaceae',
        genus: 'Sansevieria',
        notes: 'Hardy plant in the bedroom',
        is_favorite: false,
        can_sell: false,
        is_personal: true,
      },
    ];

    const plantInsert = db.prepare(`
      INSERT INTO plants (
        user_id, name, species_id, family_id, genus_id, 
        notes, is_favorite, can_sell, is_personal, acquired_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let plantCount = 0;

    samplePlants.forEach((plant) => {
      try {
        // Get the taxonomy IDs
        const speciesRow = db.prepare('SELECT id FROM plant_species WHERE name = ?').get(plant.species) as
          | { id: number }
          | undefined;
        const genusRow = db.prepare('SELECT id FROM plant_genus WHERE name = ?').get(plant.genus) as
          | { id: number }
          | undefined;
        const familyRow = db.prepare('SELECT id FROM plant_family WHERE name = ?').get(plant.family) as
          | { id: number }
          | undefined;

        console.log(`Processing plant: ${plant.name}`);
        console.log(`  Species "${plant.species}": ${speciesRow ? speciesRow.id : 'NOT FOUND'}`);
        console.log(`  Genus "${plant.genus}": ${genusRow ? genusRow.id : 'NOT FOUND'}`);
        console.log(`  Family "${plant.family}": ${familyRow ? familyRow.id : 'NOT FOUND'}`);
        console.log(`  Admin user ID: ${adminUserId}`);

        if (speciesRow && genusRow && familyRow) {
          plantInsert.run(
            adminUserId,
            plant.name,
            speciesRow.id,
            familyRow.id,
            genusRow.id,
            plant.notes,
            plant.is_favorite ? 1 : 0,
            plant.can_sell ? 1 : 0,
            plant.is_personal ? 1 : 0,
            new Date().toISOString().split('T')[0] // Today's date
          );
          plantCount++;
          console.log(`  ✓ Successfully inserted plant: ${plant.name}`);
        } else {
          console.log(`  ✗ Skipped plant due to missing taxonomy data: ${plant.name}`);
        }
      } catch (error) {
        console.error(`Error inserting plant "${plant.name}":`, error);
        console.error(`Plant data:`, plant);
      }
    });

    console.log(`Added ${plantCount} sample plants`);

    // Sample care tips (updated to match actual species names)
    const careTips = [
      {
        species: 'Monstera deliciosa',
        tip: 'Thrives in bright, indirect light. Water when top inch of soil is dry.',
        source: 'Plant Care Guide',
      },
      {
        species: 'Monstera deliciosa',
        tip: 'Benefits from monthly fertilizing during growing season.',
        source: 'Plant Care Guide',
      },
      {
        species: 'Sansevieria trifasciata',
        tip: 'Tolerates low light but prefers bright indirect light. Let soil dry completely before watering.',
        source: 'Plant Care Guide',
      },
      {
        species: 'Sansevieria trifasciata',
        tip: 'Only needs fertilizing 2-3 times a year.',
        source: 'Plant Care Guide',
      },
      {
        species: 'Epipremnum aureum',
        tip: 'Adaptable to various light conditions. Water when top 1-2 inches of soil are dry.',
        source: 'Plant Care Guide',
      },
      {
        species: 'Epipremnum aureum',
        tip: 'Can be propagated easily in water from stem cuttings.',
        source: 'Plant Care Guide',
      },
      {
        species: 'Spathiphyllum wallisii',
        tip: 'Prefers low to medium indirect light. Water when leaves start to droop slightly.',
        source: 'Plant Care Guide',
      },
      {
        species: 'Spathiphyllum wallisii',
        tip: 'Enjoys high humidity. Regular misting is beneficial.',
        source: 'Plant Care Guide',
      },
      {
        species: 'Zamioculcas zamiifolia',
        tip: 'Thrives in low to bright indirect light. Let soil dry out between waterings.',
        source: 'Plant Care Guide',
      },
      {
        species: 'Zamioculcas zamiifolia',
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
  // Re-enable foreign key constraints at the very end
  db.pragma('foreign_keys = ON');
  console.log('Foreign key constraints re-enabled');
  console.log('Database reset completed successfully!');
});
