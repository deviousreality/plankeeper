// server/api/plants/index.post.ts
import { db } from '~/server/utils/db';

export default defineEventHandler(async (event) => {
  const { userId, name, species, acquiredDate, imageUrl, notes, wateringInterval, fertilizingInterval, lightNeeds } = await readBody(event);
  
  if (!userId || !name) {
    throw createError({
      statusCode: 400,
      message: 'User ID and plant name are required',
    });
  }

  try {
    // Use transaction to ensure both tables are updated
    db.exec('BEGIN TRANSACTION');
    
    // Add plant
    const plantResult = db.prepare(`
      INSERT INTO plants (user_id, name, species, acquired_date, image_url, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, name, species, acquiredDate, imageUrl, notes);
    
    const plantId = plantResult.lastInsertRowid;
    
    // Add care schedule
    db.prepare(`
      INSERT INTO care_schedules (plant_id, watering_interval, fertilizing_interval, light_needs)
      VALUES (?, ?, ?, ?)
    `).run(plantId, wateringInterval, fertilizingInterval, lightNeeds);
    
    db.exec('COMMIT');
    
    // Fetch the newly created plant with care schedule
    const plant = db.prepare(`
      SELECT p.*, cs.watering_interval, cs.fertilizing_interval, 
      cs.last_watered, cs.last_fertilized, cs.light_needs, cs.next_task_date
      FROM plants p
      LEFT JOIN care_schedules cs ON p.id = cs.plant_id
      WHERE p.id = ?
    `).get(plantId);
    
    return plant;
  } catch (error) {
    db.exec('ROLLBACK');
    console.error('Error creating plant:', error);
    throw createError({
      statusCode: 500,
      message: 'Server error creating plant',
    });
  }
});
