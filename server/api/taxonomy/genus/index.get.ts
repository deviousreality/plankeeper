// server/api/taxonomy/genus/index.get.ts
import { db } from '~/server/utils/db';

export default defineEventHandler(async (event) => {
  try {
    const genus = db
      .prepare(
        `
      SELECT 
        g.id, 
        g.name, 
        g.family_id as familyId,
        f.name as familyName
      FROM plant_genus g
      JOIN plant_family f ON g.family_id = f.id
      ORDER BY g.name
    `
      )
      .all();

    return genus;
  } catch (error) {
    console.error('Error fetching genus entries:', error);
    throw createError({
      statusCode: 500,
      message: 'Server error fetching genus entries',
    });
  }
});
