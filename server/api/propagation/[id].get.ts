/**
 * API endpoint to get details of a specific propagation record
 * GET /api/propagation/[id]
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
        message: 'Unauthorized'
      });
    }

    // Get propagation ID from URL
    const id = event.context.params?.id;
    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Propagation ID is required'
      });
    }

    // Fetch propagation record with plant information
    const propagation = db.prepare(`
      SELECT 
        pp.*,
        p.name as plantName,
        p.species
      FROM plant_propagation pp
      JOIN plants p ON pp.plant_id = p.id
      WHERE pp.id = ? AND p.user_id = ?
    `).get(id, user.id);

    if (!propagation) {
      throw createError({
        statusCode: 404,
        message: 'Propagation record not found'
      });
    }

    // Map DB column names to camelCase for frontend
    const record = propagation as Record<string, any>;
    const mappedPropagation = {
      id: record.id,
      plantId: record.plant_id,
      plantName: record.plantName,
      species: record.species,
      propType: record.prop_type,
      seedSource: record.seed_source,
      cuttingSource: record.cutting_source,
      propDate: record.prop_date,
      initialCount: record.initial_count,
      currentCount: record.current_count,
      transplantDate: record.transplant_date,
      notes: record.notes,
      zeroCoutNotes: record.zero_cout_notes
    };

    return {
      success: true,
      data: mappedPropagation
    };
  } catch (error) {
    console.error('Error fetching propagation record:', error);
    throw createError({
      statusCode: 500,
      message: 'Error fetching propagation record'
    });
  }
});
