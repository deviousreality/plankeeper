// server/api/plants/[id].get.ts
import { db } from '~/server/utils/db';

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id;
  
  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Plant ID is required',
    });
  }

  try {
    const plant = db.prepare(`
      SELECT p.*, cs.watering_interval, cs.fertilizing_interval, 
      cs.last_watered, cs.last_fertilized, cs.light_needs, cs.next_task_date
      FROM plants p
      LEFT JOIN care_schedules cs ON p.id = cs.plant_id
      WHERE p.id = ?
    `).get(id);
    
    if (!plant) {
      throw createError({
        statusCode: 404,
        message: 'Plant not found',
      });
    }
    
    // Get care logs for this plant
    const careLogs = db.prepare(`
      SELECT * FROM care_logs
      WHERE plant_id = ?
      ORDER BY action_date DESC
    `).all(id);
    
    // Get care tips for this plant species
    const careTips = db.prepare(`
      SELECT * FROM care_tips
      WHERE species = ?
      LIMIT 5
    `).all(plant.species);
    
    return {
      ...plant,
      careLogs,
      careTips
    };
  } catch (error) {
    console.error('Error fetching plant details:', error);
    throw createError({
      statusCode: 500,
      message: 'Server error fetching plant details',
    });
  }
});
