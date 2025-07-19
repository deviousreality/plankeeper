// server/api/taxonomy/family/[id].put.ts
import { db } from '~/server/utils/db';

export default defineEventHandler(async (event) => {
  const id = parseInt(event.context.params.id);

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Family ID is required',
    });
  }

  try {
    const body = await readBody(event);

    if (!body.name || typeof body.name !== 'string') {
      throw createError({
        statusCode: 400,
        message: 'Family name is required',
      });
    }

    const genusId = body.genusId ? parseInt(body.genusId) : null;
    const speciesId = body.speciesId ? parseInt(body.speciesId) : null;

    // Verify genus exists if specified
    if (genusId) {
      const genusExists = db
        .prepare(
          `
        SELECT 1 FROM plant_genus WHERE id = ?
      `
        )
        .get(genusId);

      if (!genusExists) {
        throw createError({
          statusCode: 400,
          message: 'Referenced genus does not exist',
        });
      }
    }

    // Verify species exists if specified
    if (speciesId) {
      const speciesExists = db
        .prepare(
          `
        SELECT 1 FROM plant_species WHERE id = ?
      `
        )
        .get(speciesId);

      if (!speciesExists) {
        throw createError({
          statusCode: 400,
          message: 'Referenced species does not exist',
        });
      }
    }

    const result = db
      .prepare(
        `
      UPDATE plant_family
      SET name = ?, genus_id = ?, species_id = ?
      WHERE id = ?
    `
      )
      .run(body.name.trim(), genusId, speciesId, id);

    if (result.changes === 0) {
      throw createError({
        statusCode: 404,
        message: 'Family not found',
      });
    }

    return {
      id,
      name: body.name.trim(),
      genusId,
      speciesId,
    };
  } catch (error) {
    console.error(`Error updating family ${id}:`, error);
    throw createError({
      statusCode: 500,
      message: 'Server error updating family',
    });
  }
});
