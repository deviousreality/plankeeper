// server/api/taxonomy/family/index.get.ts
import { db } from '~/server/utils/db';

export default defineEventHandler(async (event) => {
  try {
    // Don't include genus_id and species_id since they create a circular reference
    // and aren't used in the new taxonomy search functionality
    const families = db
      .prepare(
        `
      SELECT id, name
      FROM plant_family
      ORDER BY name
    `
      )
      .all();

    return families;
  } catch (error) {
    console.error('Error fetching plant families:', error);
    throw createError({
      statusCode: 500,
      message: 'Server error fetching plant families',
    });
  }
});
