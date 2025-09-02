// server/api/plants/index.post.ts
import { db, handleDataTableTransactionError } from '~/server/utils/db';
import { mapPlantBodyToDbFields, validateFieldName, validateTaxonomyIds } from '~/server/utils/plants.db';
import type { PlantTableRow } from '~/types/database';
import type { PlantModelPost } from '~/types/plant-models';

export default defineEventHandler(async (event) => {
  const context = 'plants';
  const body = (await readBody(event)) as PlantModelPost;

  console.log('Received plant data:', JSON.stringify(body, null, 2));

  validateFieldName(body);

  validateTaxonomyIds(body);

  try {
    // Use transaction to ensure both tables are updated
    db.exec('BEGIN TRANSACTION');

    // For simplicity, we'll default to user ID 1 (usually admin)
    // In a production app, you would extract this from the auth session
    const userId = 1;

    // Add user_id to the body object
    body.user_id = userId;

    const plantData = mapPlantBodyToDbFields(body);

    console.log('Processed plant data for database:', JSON.stringify(plantData, null, 2));

    const values = Object.values(plantData);
    // Add plant using new schema with foreign key IDs
    const plantResult = db
      .prepare(
        `
      INSERT INTO plants (
        user_id, name, species_id, family_id, genus_id, common_name, variety, 
        flower_color, is_personal, is_favorite, acquired_date, image_url, notes,
        light_pref, water_pref, soil_type, plant_zones, plant_use, has_fragrance,
        fragrance_description, is_petsafe, can_sell
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      )
      .run(...values);

    const plantId = plantResult.lastInsertRowid;
    console.log('Inserted plant ID:', plantId);

    // If the plant is personal, add personal plant entry
    if (plantData.is_personal) {
      // validate personal plant data
      const personalData = undefinedToNull({
        plant_id: plantId,
        count: body.personal_count,
      });
      db.prepare(
        `
            INSERT INTO personal_plants (
              plant_id, count
            )
            VALUES (?, ?)
          `
      ).run(personalData.plant_id, personalData.count);
    }

    // Add care schedule if watering/fertilizing intervals provided
    // if (wateringInterval || fertilizingInterval || lightPref) {
    //   const careData = undefinedToNull({
    //     plant_id: plantId,
    //     watering_interval: wateringInterval,
    //     fertilizing_interval: fertilizingInterval,
    //     light_needs: lightPref,
    //     last_watered: lastWatered,
    //     last_fertilized: lastFertilized,
    //   });

    //   db.prepare(
    //     `
    //     INSERT INTO care_schedules (
    //       plant_id, watering_interval, fertilizing_interval,
    //       light_needs, last_watered, last_fertilized
    //     )
    //     VALUES (?, ?, ?, ?, ?, ?)
    //   `
    //   ).run(
    //     careData.plant_id,
    //     careData.watering_interval,
    //     careData.fertilizing_interval,
    //     careData.light_needs,
    //     careData.last_watered,
    //     careData.last_fertilized
    //   );
    // }

    db.exec('COMMIT');

    // Now fetch the newly created plant with care schedule and taxonomy data
    const PlantTableRow = db
      .prepare(
        `
      SELECT 
        p.*, 
        -- cs.watering_interval, 
        -- cs.fertilizing_interval, 
        -- cs.last_watered, 
        -- cs.last_fertilized, 
        -- cs.light_needs, 
        -- cs.next_task_date,
        pf.name as family_name,
        pg.name as genus_name,
        ps.name as species_name
      FROM plants p
      -- LEFT JOIN care_schedules cs ON p.id = cs.plant_id
      LEFT JOIN plant_family pf ON p.family_id = pf.id
      LEFT JOIN plant_genus pg ON p.genus_id = pg.id
      LEFT JOIN plant_species ps ON p.species_id = ps.id
      WHERE p.id = ?
    `
      )
      .get(plantId);

    console.log('Retrieved plant row:', PlantTableRow);

    if (!PlantTableRow) {
      throw new Error(`Plant with ID ${plantId} not found after insertion`);
    }

    // Convert the plant row to proper application type and ensure we return the plant with id
    const plant = plantTableRowToPlant(PlantTableRow as PlantTableRow);
    console.log('Returning plant with ID:', plant.id);

    return plant;
  } catch (error) {
    handleDataTableTransactionError(db, error, context, body);
  }
});
