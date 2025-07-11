// server/api/plants/index.get.ts
import {db, plantRowToPlant} from "~/server/utils/db";
import type {PlantRow} from "~/types/database";

export default defineEventHandler(async (event) => {
  // In a real app, you'd get the user id from session/token validation
  const query = getQuery(event);
  const userId = parseInt(query["userId"] as string);

  if (!userId) {
    throw createError({
      statusCode: 400,
      message: "User ID is required",
    });
  }

  try {
    const plantRows = db
      .prepare(
        `
      SELECT p.*, cs.watering_interval, cs.fertilizing_interval, 
      cs.last_watered, cs.last_fertilized, cs.light_needs, cs.next_task_date
      FROM plants p
      LEFT JOIN care_schedules cs ON p.id = cs.plant_id
      WHERE p.user_id = ?
      ORDER BY p.is_favorite DESC, p.name
    `
      )
      .all(userId) as PlantRow[];

    // Convert all plant rows to proper application types
    const plants = plantRows.map((row) => plantRowToPlant(row));

    return plants;
  } catch (error) {
    console.error("Error fetching plants:", error);
    throw createError({
      statusCode: 500,
      message: "Server error fetching plants",
    });
  }
});
