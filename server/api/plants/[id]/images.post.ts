// server/api/plants/[id]/images.post.ts
import { db } from '~/server/utils/db';
import fs from 'fs';
import path from 'path';

export default defineEventHandler(async (event) => {
  const plantId = getRouterParam(event, 'id');

  if (!plantId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Plant ID is required.',
    });
  }

  const body = await readBody(event);
  const { fileName, mainImage, thumbnailImage, position } = body;

  if (!fileName || !mainImage || !thumbnailImage) {
    throw createError({
      statusCode: 400,
      statusMessage: 'File name, main image, and thumbnail are required.',
    });
  }

  try {
    // Create directories for storing images if they don't exist
    const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');
    const plantUploadsDir = path.join(uploadsDir, 'plants', plantId.toString());

    // Ensure directories exist
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    if (!fs.existsSync(path.join(uploadsDir, 'plants'))) {
      fs.mkdirSync(path.join(uploadsDir, 'plants'), { recursive: true });
    }
    if (!fs.existsSync(plantUploadsDir)) {
      fs.mkdirSync(plantUploadsDir, { recursive: true });
    }

    // Generate safe file names
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const mainImageFileName = `${timestamp}-${sanitizedFileName}`;
    const thumbImageFileName = `${timestamp}-thumb-${sanitizedFileName}`;

    // Save paths
    const mainImagePath = `/uploads/plants/${plantId}/${mainImageFileName}`;
    const thumbImagePath = `/uploads/plants/${plantId}/${thumbImageFileName}`;

    // Extract the base64 data (remove the "data:image/jpeg;base64," prefix)
    const mainImageData = mainImage.split(',')[1];
    const thumbImageData = thumbnailImage.split(',')[1];

    // Write the files
    fs.writeFileSync(path.join(process.cwd(), 'public', mainImagePath), Buffer.from(mainImageData, 'base64'));
    fs.writeFileSync(path.join(process.cwd(), 'public', thumbImagePath), Buffer.from(thumbImageData, 'base64'));

    // Start a transaction to update the database
    db.exec('BEGIN TRANSACTION');

    // Insert into plant_images table (assuming it exists)
    try {
      db.prepare(
        `
        CREATE TABLE IF NOT EXISTS plant_images (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          plant_id INTEGER NOT NULL,
          image_path TEXT NOT NULL,
          thumbnail_path TEXT NOT NULL,
          position INTEGER NOT NULL DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (plant_id) REFERENCES plants(id)
        )
      `
      ).run();

      // Insert the image record
      const result = db
        .prepare(
          `
        INSERT INTO plant_images (
          plant_id, image_path, thumbnail_path, position
        ) VALUES (?, ?, ?, ?)
      `
        )
        .run(plantId, mainImagePath, thumbImagePath, position || 1);

      // Update the plant's primary image_url if it's the first image
      const plant = db.prepare('SELECT image_url FROM plants WHERE id = ?').get(plantId) as
        | { image_url: string | null }
        | undefined;
      if (!plant || !plant.image_url) {
        db.prepare('UPDATE plants SET image_url = ? WHERE id = ?').run(mainImagePath, plantId);
      }

      db.exec('COMMIT');

      return {
        success: true,
        imageId: result.lastInsertRowid,
        mainImagePath,
        thumbImagePath,
      };
    } catch (dbError) {
      db.exec('ROLLBACK');
      console.error('Database error during image upload:', dbError);
      throw createError({
        statusCode: 500,
        statusMessage: 'Error saving image to database.',
      });
    }
  } catch (error) {
    console.error('Error processing image upload:', error);
    throw createError({
      statusCode: 500,
      statusMessage: `Error processing image: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }
});
