// server/api/care-schedules/[id].post.ts
import { db } from '~/server/utils/db';

export default defineEventHandler(async (event) => {
  const plantId = parseInt(event.context.params.id);

  if (!plantId) {
    throw createError({
      statusCode: 400,
      message: 'Plant ID is required',
    });
  }

  try {
    const body = await readBody(event);

    // Check if a schedule already exists for this plant
    const existingSchedule = db
      .prepare(
        `
      SELECT id FROM care_schedules WHERE plant_id = ?
    `
      )
      .get(plantId);

    let result;

    // Calculate the next task date (earlier of watering or fertilizing)
    let nextTaskDate = null;

    if (body.wateringInterval && body.lastWatered) {
      const lastWatered = new Date(body.lastWatered);
      const nextWatering = new Date(lastWatered);
      nextWatering.setDate(nextWatering.getDate() + parseInt(body.wateringInterval));
      nextTaskDate = nextWatering.toISOString().split('T')[0];
    }

    if (body.fertilizingInterval && body.lastFertilized) {
      const lastFertilized = new Date(body.lastFertilized);
      const nextFertilizing = new Date(lastFertilized);
      nextFertilizing.setDate(nextFertilizing.getDate() + parseInt(body.fertilizingInterval));
      const nextFertilizingDate = nextFertilizing.toISOString().split('T')[0];

      if (!nextTaskDate || nextFertilizingDate < nextTaskDate) {
        nextTaskDate = nextFertilizingDate;
      }
    }

    if (existingSchedule) {
      // Update existing schedule
      result = db
        .prepare(
          `
        UPDATE care_schedules
        SET watering_interval = ?, fertilizing_interval = ?,
            last_watered = ?, last_fertilized = ?,
            light_needs = ?, next_task_date = ?
        WHERE plant_id = ?
      `
        )
        .run(
          body.wateringInterval,
          body.fertilizingInterval,
          body.lastWatered,
          body.lastFertilized,
          body.lightNeeds,
          nextTaskDate,
          plantId
        );
    } else {
      // Create new schedule
      result = db
        .prepare(
          `
        INSERT INTO care_schedules
        (plant_id, watering_interval, fertilizing_interval, last_watered, last_fertilized, light_needs, next_task_date)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `
        )
        .run(
          plantId,
          body.wateringInterval,
          body.fertilizingInterval,
          body.lastWatered,
          body.lastFertilized,
          body.lightNeeds,
          nextTaskDate
        );
    }

    // Get the updated care schedule
    const updatedSchedule = db
      .prepare(
        `
      SELECT * FROM care_schedules
      WHERE plant_id = ?
    `
      )
      .get(plantId);

    return {
      success: true,
      id: existingSchedule ? existingSchedule.id : result.lastInsertRowid,
      data: updatedSchedule,
      message: existingSchedule ? 'Care schedule updated' : 'Care schedule created',
    };
  } catch (error) {
    console.error(`Error saving care schedule for plant ${plantId}:`, error);
    throw createError({
      statusCode: 500,
      message: 'Server error saving care schedule',
    });
  }
});
