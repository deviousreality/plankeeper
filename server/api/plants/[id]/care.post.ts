// server/api/plants/[id]/care.post.ts
import { db } from '../../../utils/db';

export default defineEventHandler(async (event) => {
  const plantId = getRouterParam(event, 'id');
  const body = await readBody(event);
  
  if (!plantId || !body.actionType) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Plant ID and action type are required.'
    });
  }
  
  try {
    // Add care log entry
    const logResult = db.prepare(`
      INSERT INTO care_logs (plant_id, action_type, notes)
      VALUES (?, ?, ?)
    `).run(
      plantId,
      body.actionType,
      body.notes || null
    );
    
    // If it's watering or fertilizing, update the last_watered or last_fertilized dates
    if (body.actionType === 'watering' || body.actionType === 'fertilizing') {
      const today = new Date().toISOString().split('T')[0];
      
      const fieldToUpdate = body.actionType === 'watering' ? 'last_watered' : 'last_fertilized';
      
      db.prepare(`
        UPDATE care_schedules
        SET ${fieldToUpdate} = ?
        WHERE plant_id = ?
      `).run(today, plantId);
      
      // Calculate and update next task date
      const plant = db.prepare(`
        SELECT cs.watering_interval, cs.fertilizing_interval, cs.last_watered, cs.last_fertilized
        FROM care_schedules cs
        WHERE cs.plant_id = ?
      `).get(plantId);
      
      if (plant) {
        let nextTaskDate = null;
        let lastWateredDate = plant.last_watered ? new Date(plant.last_watered) : null;
        let lastFertilizedDate = plant.last_fertilized ? new Date(plant.last_fertilized) : null;
        
        if (lastWateredDate && plant.watering_interval) {
          const nextWatering = new Date(lastWateredDate);
          nextWatering.setDate(nextWatering.getDate() + plant.watering_interval);
          
          if (!nextTaskDate || nextWatering < nextTaskDate) {
            nextTaskDate = nextWatering;
          }
        }
        
        if (lastFertilizedDate && plant.fertilizing_interval) {
          const nextFertilizing = new Date(lastFertilizedDate);
          nextFertilizing.setDate(nextFertilizing.getDate() + plant.fertilizing_interval);
          
          if (!nextTaskDate || nextFertilizing < nextTaskDate) {
            nextTaskDate = nextFertilizing;
          }
        }
        
        if (nextTaskDate) {
          db.prepare(`
            UPDATE care_schedules
            SET next_task_date = ?
            WHERE plant_id = ?
          `).run(nextTaskDate.toISOString().split('T')[0], plantId);
        }
      }
    }
    
    return {
      success: true,
      id: logResult.lastInsertRowid
    };
  } catch (error) {
    console.error('Error recording care action:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to record care action.'
    });
  }
});
