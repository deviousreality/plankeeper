import sharp from 'sharp';
import { PlantPhotos, PlantPhotosPost, PlantPhotosSizeType } from '~/types';
import { undefinedToNull } from '~/server/utils/db';

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
const resizeImageFilesToSizes = async (file: File): Promise<{ buffer: Buffer; name: PlantPhotosSizeType }[]> => {
  try {
    console.log('Processing file:', file.name, file.type);

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
    console.log(`Buffer created, size: ${buffer.length} bytes`);

    // Process with sharp
    const resizedImages = await Promise.all(
      sizes.map(async (size) => {
        try {
          const resizedBuffer = await resizeImage(buffer, size);
          return { buffer: resizedBuffer, name: size.name };
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
const plantPhotosDataObject = async (photo: PlantPhotosPost): Promise<PlantPhotos[]> => {
  const buffers = await resizeImageFilesToSizes(photo.file);
  return buffers.map((buffer) => {
    return undefinedToNull({
      plant_id: photo.plant_id,
      filename: photo.file.name,
      image: buffer.name,
      mime_type: photo.file.type,
      size_type: buffer.name,
      created_at: new Date().toISOString(),
    });
  }) as unknown as Promise<PlantPhotos[]>;
};

const validatePlantPhotoData = async (body: PlantPhotosPost): Promise<PlantPhotos[]> => {
  try {
    console.log('Validating plant photo data:', {
      plant_id: body.plant_id,
      file: body.file
        ? {
            name: body.file.name,
            type: body.file.type,
            hasArrayBuffer: !!body.file.arrayBuffer,
          }
        : 'No file',
    });

    if (!body.file) {
      console.error('Missing file in request body');
      throw createError({
        statusCode: 400,
        message: 'Missing file in request body',
      });
    }

    const data = await plantPhotosDataObject(body);

    if (!data || data.length === 0) {
      console.error('No valid plant photos to insert');
      throw createError({
        statusCode: 500,
        message: 'No valid plant photos provided',
      });
    }

    console.log(`Processed ${data.length} photo sizes successfully`);
    return data;
  } catch (error: unknown) {
    console.error('Error processing plant photos:', error);

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

export { plantPhotosDataObject, validatePlantPhotoData };
