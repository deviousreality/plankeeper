// server/api/care-schedules/[id].get.ts
import { db } from '~/server/utils/db';

export default defineEventHandler(async (event) => {
  const plantId = parseInt(event.context.params.id);
  
  if (!plantId) {
    throw createError({
      statusCode: 400,
      message: 'Plant ID is required',
    });
  }

  try {
    // Get the care schedule for this plant
    const schedule = db.prepare(`
      SELECT * FROM care_schedules
      WHERE plant_id = ?
    `).get(plantId);
    
    return schedule || null;
  } catch (error) {
    console.error(`Error fetching care schedule for plant ${plantId}:`, error);
    throw createError({
      statusCode: 500,
      message: 'Server error fetching care schedule',
    });
  }
});
