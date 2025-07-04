// server/api/taxonomy/genius/[id].put.ts
import { db } from '~/server/utils/db';

export default defineEventHandler(async (event) => {
  const id = parseInt(event.context.params.id);
  
  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Genus ID is required',
    });
  }

  try {
    const body = await readBody(event);
    
    if (!body.name || typeof body.name !== 'string') {
      throw createError({
        statusCode: 400,
        message: 'Genus name is required',
      });
    }
    
    const speciesId = body.speciesId ? parseInt(body.speciesId) : null;
    
    // Verify species exists if specified
    if (speciesId) {
      const speciesExists = db.prepare(`
        SELECT 1 FROM plant_species WHERE id = ?
      `).get(speciesId);
      
      if (!speciesExists) {
        throw createError({
          statusCode: 400,
          message: 'Referenced species does not exist',
        });
      }
    }
    
    const result = db.prepare(`
      UPDATE plant_genius
      SET name = ?, species_id = ?
      WHERE id = ?
    `).run(body.name.trim(), speciesId, id);
    
    if (result.changes === 0) {
      throw createError({
        statusCode: 404,
        message: 'Genus not found',
      });
    }
    
    return {
      id,
      name: body.name.trim(),
      speciesId
    };
  } catch (error) {
    console.error(`Error updating genus ${id}:`, error);
    throw createError({
      statusCode: 500,
      message: 'Server error updating genus',
    });
  }
});
