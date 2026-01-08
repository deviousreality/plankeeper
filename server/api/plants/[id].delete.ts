// server/api/plants/[id].delete.ts
import { db, handleDataTableTransactionError, validateFieldId } from '~/server/utils/db';
import { getRouterParams, type H3Event } from 'h3';

const handler = async (event: H3Event, dbInstance = db) => {
  const context = 'plants';
  const params = getRouterParams(event);
  const plant_id = parseInt(params['id'] as string);

  validateFieldId(plant_id);

  try {
    // Start a transaction to delete related records first
    const transaction = dbInstance.transaction(() => {
      // Delete care logs
      dbInstance.prepare('DELETE FROM care_logs WHERE plant_id = ?').run(plant_id);

      // Delete care schedule
      dbInstance.prepare('DELETE FROM care_schedules WHERE plant_id = ?').run(plant_id);

      // Delete plant
      dbInstance.prepare('DELETE FROM plants WHERE id = ?').run(plant_id);
    });

    transaction();

    return { success: true };
  } catch (error) {
    handleDataTableTransactionError(dbInstance, error, context, '');
    return null;
  }
};

export default defineEventHandler((event) => handler(event));

export { handler };
