// server/api/plants/[id]/photos/[photoId].delete.ts
import { db } from '~/server/utils/db';

export default defineEventHandler(async (event) => {
  const plantId = event.context.params?.['id'];
  const photoId = event.context.params?.['photoId'];

  if (!plantId) {
    throw createError({
      statusCode: 400,
      message: 'Plant ID is required',
    });
  }

  if (!photoId) {
    throw createError({
      statusCode: 400,
      message: 'Photo ID is required',
    });
  }

  try {
    // First check if the photo exists and belongs to the specified plant
    const photo = db.prepare('SELECT id FROM plant_photos WHERE id = ? AND plant_id = ?').get(photoId, plantId);

    if (!photo) {
      throw createError({
        statusCode: 404,
        message: 'Photo not found or does not belong to this plant',
      });
    }

    // Delete the photo
    const result = db.prepare('DELETE FROM plant_photos WHERE id = ?').run(photoId);

    if (result.changes === 0) {
      throw createError({
        statusCode: 500,
        message: 'Failed to delete photo',
      });
    }

    return {
      success: true,
      message: 'Photo deleted successfully',
    };
  } catch (error: any) {
    console.error('Error deleting plant photo:', error);

    if (error && typeof error === 'object' && 'statusCode' in error) {
      // Re-throw the error if it's already formatted
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: 'Failed to delete photo',
    });
  }
});
