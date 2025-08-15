import sharp from 'sharp';
import { PlantPhotos, PlantPhotosPost, PlantPhotosSizeType } from '~/types';

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
  const buffer = (await file.arrayBuffer()) as unknown as Buffer;
  const resizedImages = await Promise.all(
    sizes.map(async (size) => {
      const resizedBuffer = await resizeImage(buffer, size);
      return { buffer: resizedBuffer, name: size.name };
    })
  );
  return resizedImages;
};

// Process Plant Photos Data
const plantPhotosDataObject = async (photosPost: PlantPhotosPost[]): Promise<PlantPhotos[]> => {
  const resizedPhotos = await Promise.all(
    photosPost.map(async (photo) => {
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
      });
    })
  );
  return resizedPhotos as unknown as Promise<PlantPhotos[]>;
};

export { plantPhotosDataObject };
