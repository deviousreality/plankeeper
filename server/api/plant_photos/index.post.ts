// server/api/plant_photos/index.post.ts
import { validatePlantPhotoData } from '~/server/utils/plant_photos.db';
import { db, handleDataTableTransactionError, validateFieldId } from '~/server/utils/db';
import { PlantPhotosPost, PlantPhotos } from '~/types/database';

export default defineEventHandler(async (event) => {
  const context = 'plant_photos';

  try {
    // Read the multipart form data
    const formData = await readMultipartFormData(event);
    if (!formData) {
      throw createError({
        statusCode: 400,
        message: 'No form data provided',
      });
    }

    console.log('Received form data parts:', formData.length);

    // Extract plant_id and file from form data
    const plantIdPart = formData.find((part) => part.name === 'plant_id');
    const filePart = formData.find((part) => part.name === 'file');

    // Log what we received
    formData.forEach((part) => {
      console.log(
        `Form part: ${part.name}, ${part.filename || 'no filename'}, type: ${part.type || 'no type'}, size: ${part.data?.length || 0} bytes`
      );
    });

    if (!plantIdPart || !plantIdPart.data) {
      throw createError({
        statusCode: 400,
        message: 'Missing plant_id in form data',
      });
    }

    if (!filePart || !filePart.data) {
      throw createError({
        statusCode: 400,
        message: 'Missing file data in form data',
      });
    }

    // Parse plant ID
    let plantId: number;
    try {
      plantId = parseInt(Buffer.from(plantIdPart.data).toString('utf8'));
      if (isNaN(plantId) || plantId <= 0) {
        throw new Error('Invalid plant_id value');
      }
    } catch (err) {
      throw createError({
        statusCode: 400,
        message: 'Invalid plant_id: must be a positive integer',
      });
    }

    // Construct a mock File object that our processing functions can use
    const body: PlantPhotosPost = {
      plant_id: plantId,
      file: {
        name: filePart.filename || 'unknown.jpg',
        type: filePart.type || 'image/jpeg',
        size: filePart.data.length,
        lastModified: Date.now(),
        arrayBuffer: async () => Promise.resolve(filePart.data.buffer),
        slice: () => new Blob(),
        stream: () => new ReadableStream(),
        text: async () => Promise.resolve(''),
      } as unknown as File,
    };

    console.log('Processed photo data:', {
      plant_id: body.plant_id,
      filename: body.file.name,
      fileSize: body.file.size,
      fileType: body.file.type,
    });

    validateFieldId(body.plant_id);

    let plantPhotoData = await validatePlantPhotoData(body);

    // Use transaction to ensure tables are updated
    db.exec('BEGIN TRANSACTION;');

    const insert = db.prepare(
      `
      INSERT INTO plant_photos (plant_id, filename, image, mime_type, size_type, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `
    );

    const insertMany = db.transaction((photos: PlantPhotos[]) => {
      for (const photo of photos) insert.run(...Object.values(photo));
    });

    insertMany(plantPhotoData);

    db.exec('COMMIT');

    // Return success response with some basic information
    return {
      success: true,
      message: 'Plant photos uploaded successfully',
      count: plantPhotoData.length,
      plant_id: body.plant_id,
    };
  } catch (error: unknown | string) {
    // If we're in a transaction and encounter an error, roll it back
    try {
      db.exec('ROLLBACK');
    } catch (e) {
      // Ignore rollback errors
    }

    return handleDataTableTransactionError(db, error, context, {});
  }
});
