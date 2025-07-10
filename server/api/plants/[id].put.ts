// server/api/plants/[id].put.ts
import {db, undefinedToNull} from "~/server/utils/db";

export default defineEventHandler(async (event) => {
  const plantId = getRouterParam(event, "id");
  const body = await readBody(event);

  if (!plantId || !body.name || !body.user_id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid input. Plant ID, name, and user ID are required.",
    });
  }

  try {
    // Convert undefined to null for database storage
    const plantData = undefinedToNull({
      name: body.name,
      species_id: body.species_id,
      family_id: body.family_id,
      genus_id: body.genus_id,
      acquired_date: body.acquired_date,
      image_url: body.image_url,
      notes: body.notes,
      is_favorite: body.is_favorite,
      can_sell: body.can_sell,
      is_personal: body.is_personal,
      common_name: body.common_name,
      flower_color: body.flower_color,
      variety: body.variety,
      light_pref: body.light_pref,
      water_pref: body.water_pref,
      soil_type: body.soil_type,
    });

    // Update plant record
    db.prepare(
      `
      UPDATE plants 
      SET name = ?, species_id = ?, family_id = ?, genus_id = ?, 
          acquired_date = ?, image_url = ?, notes = ?, is_favorite = ?,
          can_sell = ?, is_personal = ?, common_name = ?, flower_color = ?,
          variety = ?, light_pref = ?, water_pref = ?, soil_type = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `
    ).run(
      plantData.name,
      plantData.species_id,
      plantData.family_id,
      plantData.genus_id,
      plantData.acquired_date,
      plantData.image_url,
      plantData.notes,
      plantData.is_favorite,
      plantData.can_sell,
      plantData.is_personal,
      plantData.common_name,
      plantData.flower_color,
      plantData.variety,
      plantData.light_pref,
      plantData.water_pref,
      plantData.soil_type,
      plantId,
      body.user_id
    );

    // Update care schedule if provided
    if (
      body.watering_interval !== undefined ||
      body.fertilizing_interval !== undefined ||
      body.last_watered !== undefined ||
      body.last_fertilized !== undefined ||
      body.light_needs !== undefined
    ) {
      const careData = undefinedToNull({
        watering_interval: body.watering_interval,
        fertilizing_interval: body.fertilizing_interval,
        last_watered: body.last_watered,
        last_fertilized: body.last_fertilized,
        light_needs: body.light_needs,
      });

      db.prepare(
        `
        UPDATE care_schedules
        SET watering_interval = ?, fertilizing_interval = ?, last_watered = ?, 
            last_fertilized = ?, light_needs = ?
        WHERE plant_id = ?
      `
      ).run(
        careData.watering_interval,
        careData.fertilizing_interval,
        careData.last_watered,
        careData.last_fertilized,
        careData.light_needs,
        plantId
      );
    }

    return {success: true, id: plantId};
  } catch (error) {
    console.error("Error updating plant:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to update plant information.",
    });
  }
});
