// server/api/plants/index.get.ts
import { db } from '~/server/utils/db';
import type { PlantTableRow } from '~/types/database';
import { plantTableRowToPlant } from '~/server/utils/plants.db';

export default defineEventHandler(async (event) => {
  const context = 'photos';
  // In a real app, you'd get the user id from session/token validation
  const query = getQuery(event);
  const userId = parseInt(query['userId'] as string);

  if (!userId) {
    throw createError({
      statusCode: 500,
      message: 'User ID is required',
    });
  }

  try {
    const PlantTableRows = db
      .prepare(
        `
      SELECT p.*, 
      --cs.watering_interval, cs.fertilizing_interval, 
      -- cs.last_watered, cs.last_fertilized, cs.light_needs, cs.next_task_date,
      pp.count AS personal_count
      FROM plants p
      -- LEFT JOIN care_schedules cs ON p.id = cs.plant_id
      LEFT JOIN personal_plants pp ON p.id = pp.plant_id
      WHERE p.user_id = ?
      ORDER BY p.is_favorite DESC, p.name
    `
      )
      .all(userId) as PlantTableRow[];

    // Convert all plant rows to proper application types
    const plants = PlantTableRows.map((row) => plantTableRowToPlant(row));

    return plants;
  } catch (error) {
    // console.error('Error fetching plants:', error);
    handleDatatableFetchError(context, error as unknown);
  }
});
