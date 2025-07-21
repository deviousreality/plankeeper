// server/api/taxonomy/species/index.get.ts
import { db } from '~/server/utils/db';

export default defineEventHandler(async () => {
  try {
    const species = db
      .prepare(
        `
      SELECT 
        s.id, 
        s.name, 
        s.genus_id as genusId, 
        s.common_name as commonName,
        g.name as genusName,
        f.name as familyName
      FROM plant_species s
      JOIN plant_genus g ON s.genus_id = g.id
      JOIN plant_family f ON g.family_id = f.id
      ORDER BY s.name
    `
      )
      .all();

    return species;
  } catch (error) {
    console.error('Error fetching species:', error);
    throw createError({
      statusCode: 500,
      message: 'Server error fetching species',
    });
  }
});
