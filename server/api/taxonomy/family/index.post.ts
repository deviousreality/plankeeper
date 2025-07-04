// server/api/taxonomy/family/index.post.ts
import { db } from '~/server/utils/db';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    
    if (!body.name || typeof body.name !== 'string') {
      throw createError({
        statusCode: 400,
        message: 'Family name is required',
      });
    }
    
    const geniusId = body.geniusId ? parseInt(body.geniusId) : null;
    const speciesId = body.speciesId ? parseInt(body.speciesId) : null;
    
    // Verify genius exists if specified
    if (geniusId) {
      const geniusExists = db.prepare(`
        SELECT 1 FROM plant_genius WHERE id = ?
      `).get(geniusId);
      
      if (!geniusExists) {
        throw createError({
          statusCode: 400,
          message: 'Referenced genus does not exist',
        });
      }
    }
    
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
      INSERT INTO plant_family (name, genius_id, species_id)
      VALUES (?, ?, ?)
    `).run(body.name.trim(), geniusId, speciesId);
    
    return {
      id: result.lastInsertRowid,
      name: body.name.trim(),
      geniusId,
      speciesId
    };
  } catch (error) {
    console.error('Error creating plant family:', error);
    throw createError({
      statusCode: 500,
      message: 'Server error creating plant family',
    });
  }
});
