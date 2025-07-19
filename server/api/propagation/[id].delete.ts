/**
 * API endpoint to delete a specific propagation record
 * DELETE /api/propagation/[id]
 */
import { db } from '~/server/utils/db';
import type { H3Event } from 'h3';

export default defineEventHandler(async (event: H3Event) => {
  try {
    // Get user ID from auth
    const user = event.context.user;
    if (!user) {
      throw createError({
        statusCode: 401,
        message: 'Unauthorized',
      });
    }

    // Get propagation ID from URL
    const id = event.context.params?.id;
    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Propagation ID is required',
      });
    }

    // Verify propagation record exists and user owns the plant
    const existingPropagation = db
      .prepare(
        `
      SELECT pp.id
      FROM plant_propagation pp
      JOIN plants p ON pp.plant_id = p.id
      WHERE pp.id = ? AND p.user_id = ?
    `
      )
      .get(id, user.id);

    if (!existingPropagation) {
      throw createError({
        statusCode: 404,
        message: 'Propagation record not found or you do not have permission to delete it',
      });
    }

    // Delete propagation record
    db.prepare('DELETE FROM plant_propagation WHERE id = ?').run(id);

    return {
      success: true,
      message: 'Propagation record deleted successfully',
    };
  } catch (error) {
    console.error('Error deleting propagation record:', error);
    throw createError({
      statusCode: 500,
      message: 'Error deleting propagation record',
    });
  }
});
