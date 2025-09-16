// server/api/plant_photos/index.post.ts
import { validatePlantPhotoData } from '~/server/utils/plant_photos.db';
import { db, handleDataTableTransactionError, validateFieldId } from '~/server/utils/db';
import { PlantPhotosMockFile, PlantPhotosTableRowInsert } from '~/types/database';

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
    // Extract plant_id and file from form data
    const plantIdPart = formData.find((part) => part.name === 'plant_id');
    const filePart = formData.find((part) => part.name === 'image');

    // Log what we received
    formData.forEach((part) => {
      console.log(
        `Form part: ${part.name}, ${part.filename || 'no filename'}, type: ${part.type || 'no type'}, size: ${part.data?.length || 0} bytes`
      );
    });

    console.log(
      'Raw form data parts:',
      formData.map((part) => ({
        name: part.name,
        filename: part.filename,
        type: part.type,
        dataExists: !!part.data,
        dataLength: part.data?.length || 0,
        dataBytesHex: part.data ? part.data.slice(0, 10).toString('hex') : 'none',
      }))
    );

    if (!plantIdPart) {
      throw createError({
        statusCode: 400,
        message: 'Missing plant_id in form data',
      });
    }

    if (!filePart) {
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
    const mockFile: PlantPhotosMockFile = {
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
      } as File,
    };

    console.log('Received plant photos:', JSON.stringify(mockFile, null, 2));

    validateFieldId(mockFile.plant_id);

    const plantPhotoData = await validatePlantPhotoData(mockFile);

    console.log(
      'Received plant photos:',
      JSON.stringify(
        plantPhotoData.map((photo) => {
          return {
            plantId: photo.plant_id,
            filename: photo.filename,
            file: '[Buffer]',
            mime_type: photo.mime_type,
            size_type: photo.size_type,
            // Exclude the actual image buffer from logs for brevity
          };
        }),
        null,
        2
      )
    );

    // Use transaction to ensure tables are updated
    db.exec('BEGIN TRANSACTION;');

    const insert = db.prepare(
      `
      INSERT INTO plant_photos (plant_id, filename, image, mime_type, size_type)
      VALUES (?, ?, ?, ?, ?)
    `
    );

    const insertMany = db.transaction((photos: PlantPhotosTableRowInsert[]) => {
      for (const photo of photos) {
        // Extract only the fields we're inserting (excluding created_at which has a default)
        const values = [photo.plant_id, photo.filename, photo.image, photo.mime_type, photo.size_type];
        insert.run(...values);
      }
    });

    insertMany(plantPhotoData);

    db.exec('COMMIT');

    // Return success response with some basic information
    return {
      success: true,
      message: 'Plant photo uploaded successfully',
      plant_id: plantIdPart,
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
