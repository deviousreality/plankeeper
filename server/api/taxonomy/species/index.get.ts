// server/api/taxonomy/species/index.get.ts
import { db } from '~/server/utils/db';

export default defineEventHandler(async (event) => {
  try {
    const species = db.prepare(`
      SELECT id, name 
      FROM plant_species 
      ORDER BY name
    `).all();
    
    return species;
  } catch (error) {
    console.error('Error fetching species:', error);
    throw createError({
      statusCode: 500,
      message: 'Server error fetching species',
    });
  }
});
