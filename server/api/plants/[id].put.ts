// server/api/plants/[id].put.ts
import { db } from '~/server/utils/db';
import { mapPlantBodyToDbFields, validateFieldName, validateTaxonomyIds } from '~/server/utils/plants.db';
import type { PlantModelPost } from '~/types/plant-models';
import type { H3Event } from 'h3';

export default defineEventHandler(async (event: H3Event) => {
  const context = 'plants';
  const body = (await readBody(event)) as PlantModelPost;
  const plant_id = parseInt(getRouterParam(event, 'id') as string) as number;

  console.log('Received plant data:', JSON.stringify(body, null, 2));

  validateFieldId(plant_id);

  validateFieldName(body);

  validateTaxonomyIds(body);

  try {
    // Use transaction to ensure both tables are updated
    db.exec('BEGIN TRANSACTION');

    const plantData = mapPlantBodyToDbFields(body);

    console.log('Processed plant data for database:', JSON.stringify(plantData, null, 2));

    const values = Object.values(plantData);
    // console.log('values for database:', JSON.stringify(values, null, 2));
    console.log('more data', plant_id);
    console.log('more data user', plantData.user_id);
    db.prepare(
      `
      UPDATE plants 
      SET 
      user_id = ?,
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
    ).run(...values, plant_id, plantData.user_id);

    console.log('Updated plant ID:', plant_id);

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

    return { success: true, id: plant_id };
  } catch (error) {
    return handleDataTableTransactionError(db, error, context, body);
  }
});
