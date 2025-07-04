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
      // Add a sample admin user (first delete if exists)
    db.prepare(`DELETE FROM users WHERE username = 'admin'`).run();
    
    // Now insert the admin user
    const userResult = db.prepare(`
      INSERT INTO users (username, password, email) 
      VALUES ('admin', ?, 'admin@example.com')
    `).run(hashedPassword);
    
    console.log(`Added sample admin user: ${userResult.changes} record(s) affected`);
    console.log(`Default admin credentials: username="admin", password="${defaultPassword}"`);
    
    // Add sample plant species and care tips
    const species = ['Monstera Deliciosa', 'Snake Plant', 'Pothos', 'Peace Lily', 'ZZ Plant'];
    
    // Sample care tips
    const careTips = [
      { species: 'Monstera Deliciosa', tip: 'Thrives in bright, indirect light. Water when top inch of soil is dry.', source: 'Plant Care Guide' },
      { species: 'Monstera Deliciosa', tip: 'Benefits from monthly fertilizing during growing season.', source: 'Plant Care Guide' },
      { species: 'Snake Plant', tip: 'Tolerates low light but prefers bright indirect light. Let soil dry completely before watering.', source: 'Plant Care Guide' },
      { species: 'Snake Plant', tip: 'Only needs fertilizing 2-3 times a year.', source: 'Plant Care Guide' },
      { species: 'Pothos', tip: 'Adaptable to various light conditions. Water when top 1-2 inches of soil are dry.', source: 'Plant Care Guide' },
      { species: 'Pothos', tip: 'Can be propagated easily in water from stem cuttings.', source: 'Plant Care Guide' },
      { species: 'Peace Lily', tip: 'Prefers low to medium indirect light. Water when leaves start to droop slightly.', source: 'Plant Care Guide' },
      { species: 'Peace Lily', tip: 'Enjoys high humidity. Regular misting is beneficial.', source: 'Plant Care Guide' },
      { species: 'ZZ Plant', tip: 'Thrives in low to bright indirect light. Let soil dry out between waterings.', source: 'Plant Care Guide' },
      { species: 'ZZ Plant', tip: 'Extremely drought tolerant. Better to underwater than overwater.', source: 'Plant Care Guide' }
    ];
    
    // Insert care tips
    const tipInsert = db.prepare('INSERT INTO care_tips (species, tip, source) VALUES (?, ?, ?)');
    let tipCount = 0;
    
    careTips.forEach(tip => {
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
