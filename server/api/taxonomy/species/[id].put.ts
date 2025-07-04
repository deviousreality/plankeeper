// server/api/taxonomy/species/[id].put.ts
import { db } from '~/server/utils/db';

export default defineEventHandler(async (event) => {
  const id = parseInt(event.context.params.id);
  
  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Species ID is required',
    });
  }

  try {
    const body = await readBody(event);
    
    if (!body.name || typeof body.name !== 'string') {
      throw createError({
        statusCode: 400,
        message: 'Species name is required',
      });
    }
    
    const result = db.prepare(`
      UPDATE plant_species 
      SET name = ?
      WHERE id = ?
    `).run(body.name.trim(), id);
    
    if (result.changes === 0) {
      throw createError({
        statusCode: 404,
        message: 'Species not found',
      });
    }
    
    return {
      id,
      name: body.name.trim(),
    };
  } catch (error) {
    console.error(`Error updating species ${id}:`, error);
    throw createError({
      statusCode: 500,
      message: 'Server error updating species',
    });
  }
});
