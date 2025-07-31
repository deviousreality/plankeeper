// server/api/plants/[id].get.ts
import { db, plantTableRowToPlant, nullToUndefined } from '~/server/utils/db';
import type { PlantTableRow } from '~/types/database';

export default defineEventHandler(async (event) => {
  const id = event.context.params?.['id'];

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Plant ID is required',
    });
  }

  try {
    const PlantTableRow = db
      .prepare(
        `
      SELECT p.*, 
      --cs.watering_interval, cs.fertilizing_interval, 
      --cs.last_watered, cs.last_fertilized, cs.light_needs, cs.next_task_date,
      pp.count AS personal_count
      FROM plants p
      --LEFT JOIN care_schedules cs ON p.id = cs.plant_id
      LEFT JOIN personal_plants pp ON p.id = pp.plant_id
      WHERE p.id = ?
    `
      )
      .get(id) as PlantTableRow;

    if (!PlantTableRow) {
      throw createError({
        statusCode: 404,
        message: 'Plant not found',
      });
    }

    // Convert to application type
    const plant = plantTableRowToPlant(PlantTableRow);

    console.log('Read Plant from database:', JSON.stringify(plant, null, 2));

    // Get care logs for this plant
    const careLogsRaw = db
      .prepare(
        `
      SELECT * FROM care_logs
      WHERE plant_id = ?
      ORDER BY action_date DESC
    `
      )
      .all(id);

    // Get care tips for this plant species
    const careTipsRaw = db
      .prepare(
        `
      SELECT * FROM care_tips
      WHERE species = ?
      LIMIT 5
    `
      )
      .all(plant.species_id);

    // Convert nulls to undefined for consistency
    const careLogs = nullToUndefined(careLogsRaw);
    const careTips = nullToUndefined(careTipsRaw);

    return {
      ...plant,
      careLogs,
      careTips,
    };
  } catch (error) {
    console.error('Error fetching plant details:', error);
    throw createError({
      statusCode: 500,
      message: 'Server error fetching plant details',
    });
  }
});
