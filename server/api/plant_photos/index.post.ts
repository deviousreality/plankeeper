// server/api/plant_photos/index.post.ts
import { plantPhotosDataObject } from '~/server/scripts/imageToTable';
import { db, handleDataTableTransactionError } from '~/server/utils/db';
import { PlantPhotosPost, PlantPhotos } from '~/types/database';

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) as PlantPhotosPost[];
  const context = 'plant_photos';

  console.log('Received photo data:', JSON.stringify(body, null, 2));
  let plantPhotoData = [] as PlantPhotos[];
  try {
    plantPhotoData = await plantPhotosDataObject(body);
  } catch (error) {
    console.error('Error processing plant photos:', error);
    throw createError({
      statusCode: 500,
      message: 'No valid plant photos provided',
    });
  }

  if (plantPhotoData.length === 0) {
    console.error('No valid plant photos to insert');
    throw createError({
      statusCode: 500,
      message: 'No valid plant photos provided',
    });
  }

  try {
    // Use transaction to ensure tables are updated
    db.exec('BEGIN TRANSACTION;');

    const insert = db.prepare(
      `
      INSERT INTO plant_photos (plant_id, filename, image, mime_type, size_type, created_at)
    )
      VALUES (?, ?, ?, ?, ?, ?)
    `
    );

    const insertMany = db.transaction((photos: PlantPhotos[]) => {
      for (const photo of photos) insert.run(...Object.values(photo));
    });

    insertMany(plantPhotoData);

    db.exec('COMMIT');
  } catch (error: unknown | string) {
    handleDataTableTransactionError(db, error, context, body);
  }
});
