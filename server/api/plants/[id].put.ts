// server/api/plants/[id].put.ts
import { plantPhotosDataObject } from '~/server/scripts/imageToTable';
import { db, undefinedToNull } from '~/server/utils/db';
import { PlantPhotos } from '~/types';
import type { PlantModelPost } from '~/types/plant-models';

export default defineEventHandler(async (event) => {
  const plantId = getRouterParam(event, 'id');
  const body = (await readBody(event)) as PlantModelPost;

  if (!plantId || !body.name || !body.user_id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid input. Plant ID, name, and user ID are required.',
    });
  }

  try {
    // Convert undefined to null for database storage
    const plantData = undefinedToNull({
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

    const plantsValues = Object.values(plantData);

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
    ).run(...plantsValues, plantId, body.user_id);

    db.prepare(
      `
      UPDATE personal_plants
      set count = ?
      WHERE plant_id = ?
      `
    ).run(body.personal_count, plantId);

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
    console.error('Error updating plant:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update plant information.',
    });
  }
});
