// server/api/care-tips/[id].delete.ts
import { db } from '../../utils/db';

export default defineEventHandler(async (event) => {
  const tipId = getRouterParam(event, 'id');

  if (!tipId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Care tip ID is required.',
    });
  }

  try {
    db.prepare('DELETE FROM care_tips WHERE id = ?').run(tipId);

    return { success: true };
  } catch (error) {
    console.error('Error deleting care tip:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete care tip.',
    });
  }
});
