// server/api/taxonomy/species/index.post.ts
import { db } from '~/server/utils/db';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    
    if (!body.name || typeof body.name !== 'string') {
      throw createError({
        statusCode: 400,
        message: 'Species name is required',
      });
    }
    
    const result = db.prepare(`
      INSERT INTO plant_species (name)
      VALUES (?)
    `).run(body.name.trim());
    
    return {
      id: result.lastInsertRowid,
      name: body.name.trim()
    };
  } catch (error) {
    console.error('Error creating species:', error);
    throw createError({
      statusCode: 500,
      message: 'Server error creating species',
    });
  }
});
