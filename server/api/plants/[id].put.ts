// server/api/plants/[id].put.ts
import { db } from '~/server/utils/db';
import { mapPlantBodyToDbFields, validateFieldName, validateTaxonomyIds } from '~/server/utils/plants.db';
import type { PlantModelPost } from '~/types/plant-models';
import type { H3Event } from 'h3';

export default defineEventHandler(async (event: H3Event) => {
  const context = 'plants';
  const body = (await readBody(event)) as PlantModelPost;
  const user = event.context;
  const plantId = body.id;

  console.log('user', JSON.stringify(user, null, 2));

  console.log('Received plant data:', JSON.stringify(body, null, 2));

  validateFieldId(plantId);

  validateFieldName(body);

  validateTaxonomyIds(body);

  try {
    // Use transaction to ensure both tables are updated
    db.exec('BEGIN TRANSACTION');

    const plantData = mapPlantBodyToDbFields(body);

    console.log('Processed plant data for database:', JSON.stringify(plantData, null, 2));

    const values = Object.values(plantData);
    // console.log('values for database:', JSON.stringify(values, null, 2));
    console.log('more data', plantId);
    console.log('more data user', user.id);
    db.prepare(
      `
      UPDATE plants 
      SET 
      name = ?, 
      species_id = ?, 
      family_id = ?, 
      genus_id = ?, 
      common_name = ?, 
      variety = ?, 
      flower_color = ?, 
      is_personal = ?, 
      is_favorite = ?, 
      acquired_date = ?, 
      image_url = ?, 
      notes = ?, 
      light_pref = ?, 
      water_pref = ?, 
      soil_type = ?, 
      plant_zones = ?, 
      plant_use = ?, 
      has_fragrance = ?, 
      fragrance_description = ?, 
      is_petsafe = ?, 
      can_sell = ?, 
      updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
      `
    ).run(...values, plantId, user.id);

    console.log('Updated plant ID:', plantId);

    // if (plantData.is_personal) {
    //   const personalData = undefinedToNull({
    //     plant_id: plantId,
    //     count: body.personal_count,
    //   });
    //   db.prepare(
    //     `
    //   UPDATE personal_plants
    //   set count = ?
    //   WHERE plant_id = ?
    //   `
    //   ).run(personalData.count, personalData.plant_id);
    // }

    db.exec('COMMIT');

    // Update care schedule if provided
    // if (
    //   body.watering_interval !== undefined ||
    //   body.fertilizing_interval !== undefined ||
    //   body.last_watered !== undefined ||
    //   body.last_fertilized !== undefined ||
    //   body.light_needs !== undefined
    // ) {
    //   const careData = undefinedToNull({
    //     watering_interval: body.watering_interval,
    //     fertilizing_interval: body.fertilizing_interval,
    //     last_watered: body.last_watered,
    //     last_fertilized: body.last_fertilized,
    //     light_needs: body.light_needs,
    //   });

    //   db.prepare(
    //     `
    //     UPDATE care_schedules
    //     SET watering_interval = ?, fertilizing_interval = ?, last_watered = ?,
    //         last_fertilized = ?, light_needs = ?
    //     WHERE plant_id = ?
    //   `
    //   ).run(
    //     careData.watering_interval,
    //     careData.fertilizing_interval,
    //     careData.last_watered,
    //     careData.last_fertilized,
    //     careData.light_needs,
    //     plantId
    //   );
    // }

    return { success: true, id: plantId };
  } catch (error) {
    return handleDataTableTransactionError(db, error, context, body);
  }
});
