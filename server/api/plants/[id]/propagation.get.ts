/**
 * API endpoint to get propagation records for a specific plant
 * GET /api/plants/[id]/propagation
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

    // Get plant ID from URL
    const plantId = event.context.params?.id;
    if (!plantId) {
      throw createError({
        statusCode: 400,
        message: 'Plant ID is required'
      });
    }

    // Verify user owns the plant
    const plant = db.prepare('SELECT id FROM plants WHERE id = ? AND user_id = ?')
      .get(plantId, user.id);
      
    if (!plant) {
      throw createError({
        statusCode: 404,
        message: 'Plant not found or you do not have permission to access it'
      });
    }

    // Get propagation records for this plant
    const propagations = db.prepare(`
      SELECT * FROM plant_propagation
      WHERE plant_id = ?
      ORDER BY prop_date DESC
    `).all(plantId);

    // Map DB column names to camelCase for frontend
    const mappedPropagations = propagations.map(p => {
      const record = p as Record<string, any>;
      return {
        id: record.id,
        plantId: record.plant_id,
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
    });

    return {
      success: true,
      data: mappedPropagations
    };
  } catch (error) {
    console.error('Error fetching plant propagation records:', error);
    throw createError({
      statusCode: 500,
      message: 'Error fetching plant propagation records'
    });
  }
});
