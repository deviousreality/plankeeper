// server/api/plants/index.post.ts
import {db, plantRowToPlant} from "~/server/utils/db";
import type {PlantRow} from "~/types/database";
import type {PlantModelPost} from "~/types/plant-models";

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) as PlantModelPost;
  console.log("Received plant data:", JSON.stringify(body, null, 2));

  const {
    user_id: user_id,
    name,
    species_id: species_id,
    family_id: family_id,
    genus_id: genus_id,
    acquired_date: acquired_date,
    image_url: image_url,
    notes,
    is_favorite: is_favorite,
    flower_color: flower_color,
    light_pref: light_pref,
    water_pref: water_pref,
    soil_type: soil_type,
    variety,
    common_name: common_name,
    can_sell: can_sell,
    is_personal: is_personal,
    // Care schedule fields
    // watering_interval: watering_interval,
    // fertilizing_interval: fertilizing_interval,
    // last_watered: last_watered,
    // last_fertilized: last_fertilized,
  } = body;

  console.log("User ID from body:", user_id);
  console.log("Type of userId:", typeof user_id);
  console.log("Plant name from body:", name);
  console.log("Type of name:", typeof name);
  console.log("Name length:", name?.length);

  if (!user_id) {
    console.error("Validation failed - missing userId");
    throw createError({
      statusCode: 400,
      message: "User ID is required",
    });
  }

  if (!name || name.trim().length === 0) {
    console.error("Validation failed - missing or empty name:", name);
    throw createError({
      statusCode: 400,
      message: "Plant name is required and cannot be empty",
    });
  }

  try {
    // Use transaction to ensure both tables are updated
    db.exec("BEGIN TRANSACTION");

    // Convert undefined to null for database storage - be explicit to avoid SQLite binding errors
    const plantData = {
      user_id: user_id,
      name,
      species_id: species_id ?? null,
      family_id: family_id ?? null,
      genus_id: genus_id ?? null,
      acquired_date: acquired_date ?? null,
      image_url: image_url ?? null,
      notes: notes ?? null,
      is_favorite: is_favorite ? 1 : 0,
      flower_color: flower_color ?? null,
      light_pref: light_pref ?? null,
      water_pref: water_pref ?? null,
      soil_type: soil_type ?? null,
      variety: variety ?? null,
      common_name: common_name ?? null,
      can_sell: can_sell ? 1 : 0,
      is_personal: is_personal ?? true ? 1 : 0,
    };

    console.log("Processed plant data for database:", JSON.stringify(plantData, null, 2));

    // Add plant using new schema with foreign key IDs
    const plantResult = db
      .prepare(
        `
      INSERT INTO plants (
        user_id, name, species_id, family_id, genus_id, acquired_date, 
        image_url, notes, is_favorite, flower_color, light_pref, water_pref,
        soil_type, variety, common_name, can_sell, is_personal
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
      )
      .run(
        plantData.user_id,
        plantData.name,
        plantData.species_id,
        plantData.family_id,
        plantData.genus_id,
        plantData.acquired_date,
        plantData.image_url,
        plantData.notes,
        plantData.is_favorite,
        plantData.flower_color,
        plantData.light_pref,
        plantData.water_pref,
        plantData.soil_type,
        plantData.variety,
        plantData.common_name,
        plantData.can_sell,
        plantData.is_personal
      );

    const plantId = plantResult.lastInsertRowid;
    console.log("Inserted plant ID:", plantId);

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

    db.exec("COMMIT");

    // Now fetch the newly created plant with care schedule and taxonomy data
    const plantRow = db
      .prepare(
        `
      SELECT 
        p.*, 
        cs.watering_interval, 
        cs.fertilizing_interval, 
        cs.last_watered, 
        cs.last_fertilized, 
        cs.light_needs, 
        cs.next_task_date,
        pf.name as family_name,
        pg.name as genus_name,
        ps.name as species_name
      FROM plants p
      LEFT JOIN care_schedules cs ON p.id = cs.plant_id
      LEFT JOIN plant_family pf ON p.family_id = pf.id
      LEFT JOIN plant_genus pg ON p.genus_id = pg.id
      LEFT JOIN plant_species ps ON p.species_id = ps.id
      WHERE p.id = ?
    `
      )
      .get(plantId);

    console.log("Retrieved plant row:", plantRow);

    if (!plantRow) {
      throw new Error(`Plant with ID ${plantId} not found after insertion`);
    }

    // Convert the plant row to proper application type and ensure we return the plant with id
    const plant = plantRowToPlant(plantRow as PlantRow);
    console.log("Returning plant with ID:", plant.id);

    return plant;
  } catch (error) {
    // Only rollback if a transaction is actually active
    try {
      db.exec("ROLLBACK");
    } catch (rollbackError) {
      // Transaction was already rolled back, that's fine
      console.log("Transaction was already rolled back");
    }

    console.error("Error creating plant:", error);
    console.error("Original request body:", JSON.stringify(body, null, 2));
    console.error("Full error details:", error);
    throw createError({
      statusCode: 500,
      message: `Server error creating plant: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
});
