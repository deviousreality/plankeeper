// server/api/taxonomy/genius/index.post.ts
import { db } from '~/server/utils/db';

export default defineEventHandler(async (event) => {
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
      INSERT INTO plant_genius (name, species_id)
      VALUES (?, ?)
    `).run(body.name.trim(), speciesId);
    
    return {
      id: result.lastInsertRowid,
      name: body.name.trim(),
      speciesId
    };
  } catch (error) {
    console.error('Error creating genus:', error);
    throw createError({
      statusCode: 500,
      message: 'Server error creating genus',
    });
  }
});
