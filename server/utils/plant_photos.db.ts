import sharp from 'sharp';
import {
  PlantPhotos,
  PlantPhotosTableRowInsert,
  PlantPhotosMockFile,
  PlantPhotosSizeType,
  PlantPhotosTableRow,
} from '~/types';
import { undefinedToNull } from '~/server/utils/db';
import { generateGuid } from '~/utils/crypto';

type SizeOptions = {
  name: PlantPhotosSizeType;
  height: number;
  width: number;
};

// Assume `buffer` is a Buffer containing the uploaded image
const sizes: SizeOptions[] = [
  { name: PlantPhotosSizeType.Small, width: 100, height: 100 },
  { name: PlantPhotosSizeType.Medium, width: 500, height: 500 },
  { name: PlantPhotosSizeType.Original, width: 1000, height: 1000 },
];

// Resize image buffer
const resizeImage = async (
  buffer: Buffer,
  size: { width: number; height: number }
): Promise<Buffer<ArrayBufferLike>> => {
  return await sharp(buffer).resize(size.width, size.height).toBuffer();
};

// Resize image files to multiple sizes
const resizeImageFilesToSizes = async (file: File): Promise<{ buffer: Buffer; sizeType: PlantPhotosSizeType }[]> => {
  try {
    // Get ArrayBuffer from file
    let arrayBuffer: ArrayBuffer;
    if (file.arrayBuffer) {
      arrayBuffer = await file.arrayBuffer();
    } else if ((file as any).buffer) {
      // Handle case when we already have buffer data
      arrayBuffer = (file as any).buffer;
    } else {
      throw new Error('Cannot get buffer data from file');
    }

    // Convert to Buffer that sharp can use
    const buffer = Buffer.from(arrayBuffer);

    // Process with sharp
    const resizedImages = await Promise.all(
      sizes.map(async (size) => {
        try {
          const resizedBuffer = await resizeImage(buffer, size);
          return { buffer: resizedBuffer, sizeType: size.name };
        } catch (err) {
          console.error(`Error resizing to ${size.name}:`, err);
          throw err;
        }
      })
    );
    return resizedImages;
  } catch (error) {
    console.error('Error in resizeImageFilesToSizes:', error);
    throw error;
  }
};

// Process Plant Photos Data
const plantPhotosDataObject = async (photo: PlantPhotosMockFile): Promise<PlantPhotosTableRowInsert[]> => {
  const guid = generateGuid();
  const buffers = await resizeImageFilesToSizes(photo.file);
  return buffers.map((bufferObj, index: number) => {
    // Don't use undefinedToNull on the Buffer as it corrupts it
    const photoData = {
      id: undefined,
      created_at: undefined,
      plant_id: photo.plant_id,
      filename: photo.file.name,
      image: bufferObj.buffer, // Keep the actual Buffer object
      mime_type: photo.file.type,
      size_type:
        index === 0
          ? PlantPhotosSizeType.Small
          : index === 1
            ? PlantPhotosSizeType.Medium
            : PlantPhotosSizeType.Original,
      guid: guid,
    } as PlantPhotosTableRowInsert;

    // Only apply undefinedToNull to non-Buffer fields
    return {
      ...photoData,
      plant_id: undefinedToNull(photoData.plant_id),
      filename: undefinedToNull(photoData.filename),
      mime_type: undefinedToNull(photoData.mime_type),
      size_type: undefinedToNull(photoData.size_type),
      // Keep image as-is since it's a Buffer
    };
  });
};

const plantPhotosTableRowsToPlantPhotos = (rows: PlantPhotosTableRow[]): PlantPhotos[] => {
  return rows.map((row) => {
    let imageData = '';
    if (Buffer.isBuffer(row.image)) {
      // Convert Blob to object URL
      imageData = `data:${row.mime_type};base64,${row.image.toString('base64')}`;
    } else {
      // Fallback for unknown types
      imageData = '';
    }
    return {
      id: row.id,
      plant_id: row.plant_id,
      filename: row.filename,
      image: imageData,
      mime_type: row.mime_type,
      size_type: row.size_type,
      created_at: row.created_at,
      guid: row.guid,
    };
  });
};

const validatePlantPhotoData = async (body: PlantPhotosMockFile): Promise<PlantPhotosTableRowInsert[]> => {
  try {
    if (!body.file) {
      throw createError({
        statusCode: 400,
        message: 'Missing file in request body',
      });
    }

    const data = await plantPhotosDataObject(body);

    if (!data || data.length === 0) {
      throw createError({
        statusCode: 500,
        message: 'No valid plant photos provided',
      });
    }

    return data;
  } catch (error: unknown) {
    // Type-check for error object with statusCode
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error; // Re-throw if it's already a formatted error
    } else {
      // Get error message if available
      const errorMessage =
        error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Unknown error';

      throw createError({
        statusCode: 500,
        message: `Error processing photos: ${errorMessage}`,
      });
    }
  }
};

export { plantPhotosDataObject, plantPhotosTableRowsToPlantPhotos, validatePlantPhotoData };
