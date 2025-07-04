/**
 * API endpoint to update a specific propagation record
 * PUT /api/propagation/[id]
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

    // Parse request body
    const body = await readBody(event);
    
    // Validate required fields
    if (!body.plantId) {
      throw createError({
        statusCode: 400,
        message: 'Plant ID is required'
      });
    }
    
    if (!body.propType) {
      throw createError({
        statusCode: 400,
        message: 'Propagation type is required'
      });
    }
    
    if (!body.propDate) {
      throw createError({
        statusCode: 400,
        message: 'Propagation date is required'
      });
    }

    // Verify propagation record exists and user owns the plant
    const existingPropagation = db.prepare(`
      SELECT pp.id
      FROM plant_propagation pp
      JOIN plants p ON pp.plant_id = p.id
      WHERE pp.id = ? AND p.user_id = ?
    `).get(id, user.id);

    if (!existingPropagation) {
      throw createError({
        statusCode: 404,
        message: 'Propagation record not found or you do not have permission to update it'
      });
    }

    // Verify user owns the plant if plant ID has changed
    if (body.plantId) {
      const plant = db.prepare('SELECT id FROM plants WHERE id = ? AND user_id = ?')
        .get(body.plantId, user.id);
        
      if (!plant) {
        throw createError({
          statusCode: 403,
          message: 'You do not have permission to assign this plant'
        });
      }
    }
    
    // Update propagation record
    db.prepare(`
      UPDATE plant_propagation
      SET 
        plant_id = ?,
        prop_type = ?,
        seed_source = ?,
        cutting_source = ?,
        prop_date = ?,
        initial_count = ?,
        current_count = ?,
        transplant_date = ?,
        notes = ?,
        zero_cout_notes = ?
      WHERE id = ?
    `).run(
      body.plantId,
      body.propType,
      body.seedSource || null,
      body.cuttingSource || null,
      body.propDate,
      body.initialCount || null,
      body.currentCount || null,
      body.transplantDate || null,
      body.notes || null,
      body.zeroCoutNotes || null,
      id
    );

    // Get updated record
    const updatedPropagation = db.prepare(`
      SELECT 
        pp.*,
        p.name as plantName,
        p.species
      FROM plant_propagation pp
      JOIN plants p ON pp.plant_id = p.id
      WHERE pp.id = ?
    `).get(id);
      
    // Map DB column names to camelCase for frontend
    const record = updatedPropagation as Record<string, any>;
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
    console.error('Error updating propagation record:', error);
    throw createError({
      statusCode: 500,
      message: 'Error updating propagation record'
    });
  }
});
