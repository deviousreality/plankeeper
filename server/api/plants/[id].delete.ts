// server/api/plants/[id].delete.ts
import { db } from '../../utils/db';

export default defineEventHandler(async (event) => {
  const plantId = getRouterParam(event, 'id');

  if (!plantId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Plant ID is required.',
    });
  }

  try {
    // Start a transaction to delete related records first
    const transaction = db.transaction(() => {
      // Delete care logs
      db.prepare('DELETE FROM care_logs WHERE plant_id = ?').run(plantId);

      // Delete care schedule
      db.prepare('DELETE FROM care_schedules WHERE plant_id = ?').run(plantId);

      // Delete plant
      db.prepare('DELETE FROM plants WHERE id = ?').run(plantId);
    });

    transaction();

    return { success: true };
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete plant.',
    });
  }
});
