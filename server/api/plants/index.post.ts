// server/api/plants/index.post.ts
import { db, handleDataTableTransactionError, plantTableRowToPlant } from '~/server/utils/db';
import type { PlantTableRow } from '~/types/database';
import type { PlantModelPost } from '~/types/plant-models';

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) as PlantModelPost;
  const context = 'plants';
  console.log('Received plant data:', JSON.stringify(body, null, 2));

  // const {
  //   user_id: user_id,
  //   name,
  //   species_id: species_id,
  //   family_id: family_id,
  //   genus_id: genus_id,
  //   common_name: common_name,
  //   variety,
  //   flower_color: flower_color,
  //   is_personal: is_personal,
  //   is_favorite: is_favorite,
  //   acquired_date: acquired_date,
  //   notes,
  //   image_url: image_url,
  //   light_pref: light_pref,
  //   water_pref: water_pref,
  //   soil_type: soil_type,
  //   plant_zones: plant_zones,
  //   plant_use: plant_use,
  //   has_fragrance: has_fragrance,
  //   fragrance_description: fragrance_description,
  //   is_petsafe: is_petsafe,
  //   can_sell: can_sell,
  //   // Additional fields for personal plants
  //   personal_count: personal_count,
  //   // Care schedule fields
  //   // watering_interval: watering_interval,
  //   // fertilizing_interval: fertilizing_interval,
  //   // last_watered: last_watered,
  //   // last_fertilized: last_fertilized,
  // } = body;

  if (!body.name || body.name.trim().length === 0) {
    console.error('Validation failed - missing or empty name:', body.name);
    throw createError({
      statusCode: 400,
      message: 'Plant name is required and cannot be empty',
    });
  }

  // Validate taxonomy IDs exist if provided (check for valid positive integers)
  if (body.family_id && body.family_id > 0) {
    const family = db.prepare('SELECT id FROM plant_family WHERE id = ?').get(body.family_id);
    if (!family) {
      console.error('Validation failed - family_id not found:', body.family_id);
      throw createError({
        statusCode: 400,
        message: `Family with ID ${body.family_id} does not exist`,
      });
    }
  }

  if (body.genus_id && body.genus_id > 0) {
    const genus = db.prepare('SELECT id FROM plant_genus WHERE id = ?').get(body.genus_id);
    if (!genus) {
      console.error('Validation failed - genus_id not found:', body.genus_id);
      throw createError({
        statusCode: 400,
        message: `Genus with ID ${body.genus_id} does not exist`,
      });
    }
  }

  if (body.species_id && body.species_id > 0) {
    const species = db.prepare('SELECT id FROM plant_species WHERE id = ?').get(body.species_id);
    if (!species) {
      console.error('Validation failed - species_id not found:', body.species_id);
      throw createError({
        statusCode: 400,
        message: `Species with ID ${body.species_id} does not exist`,
      });
    }
  }

  try {
    // Use transaction to ensure both tables are updated
    db.exec('BEGIN TRANSACTION');

    // Convert undefined to null for database storage - be explicit to avoid SQLite binding errors
    // Only set taxonomy IDs if they are valid positive integers
    const plantData = undefinedToNull({
      user_id: body.user_id,
      name: body.name,
      species_id: body.species_id,
      family_id: body.family_id,
      genus_id: body.genus_id,
      common_name: body.common_name,
      variety: body.variety,
      flower_color: body.flower_color,
      is_personal: body.is_personal ? 1 : 0,
      is_favorite: body.is_favorite ? 1 : 0,
      acquired_date: body.acquired_date,
      image_url: body.image_url,
      notes: body.notes,
      light_pref: body.light_pref,
      water_pref: body.water_pref,
      soil_type: body.soil_type,
      plant_zones: body.plant_zones,
      plant_use: body.plant_use,
      has_fragrance: body.has_fragrance ? 1 : 0,
      fragrance_description: body.fragrance_description,
      is_petsafe: body.is_petsafe ? 1 : 0,
      can_sell: body.can_sell ? 1 : 0,
    });

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
