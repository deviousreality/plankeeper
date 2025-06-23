// server/api/plants/[id].put.ts
import { db } from '../../utils/db';

export default defineEventHandler(async (event) => {
  const plantId = getRouterParam(event, 'id');
  const body = await readBody(event);
  
  if (!plantId || !body.name || !body.user_id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid input. Plant ID, name, and user ID are required.'
    });
  }
  
  try {    // Update plant record
    db.prepare(`
      UPDATE plants 
      SET name = ?, species = ?, acquired_date = ?, image_url = ?, notes = ?, is_favorite = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).run(
      body.name,
      body.species,
      body.acquired_date,
      body.image_url,
      body.notes,
      body.is_favorite ? 1 : 0,
      plantId,
      body.user_id
    );
    
    // Update care schedule
    db.prepare(`
      UPDATE care_schedules
      SET watering_interval = ?, fertilizing_interval = ?, last_watered = ?, 
          last_fertilized = ?, light_needs = ?
      WHERE plant_id = ?
    `).run(
      body.watering_interval || null,
      body.fertilizing_interval || null,
      body.last_watered,
      body.last_fertilized,
      body.light_needs,
      plantId
    );
    
    return { success: true, id: plantId };
  } catch (error) {
    console.error('Error updating plant:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update plant information.'
    });
  }
});
