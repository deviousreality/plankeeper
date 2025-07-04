// server/api/taxonomy/genius/index.get.ts
import { db } from '~/server/utils/db';

export default defineEventHandler(async (event) => {
  try {
    const genius = db.prepare(`
      SELECT id, name, species_id as speciesId
      FROM plant_genius
      ORDER BY name
    `).all();
    
    return genius;
  } catch (error) {
    console.error('Error fetching genus entries:', error);
    throw createError({
      statusCode: 500,
      message: 'Server error fetching genus entries',
    });
  }
});
