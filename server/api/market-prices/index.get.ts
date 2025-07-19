// server/api/market-prices/index.get.ts
import { db } from '~/server/utils/db';

export default defineEventHandler(async (event) => {
  // Get user ID from query param
  const query = getQuery(event);
  const userId = parseInt(query.userId as string);

  if (!userId) {
    throw createError({
      statusCode: 400,
      message: 'User ID is required',
    });
  }

  try {
    // Get plants with their latest market price
    const plants = db
      .prepare(
        `
      SELECT p.*, 
        (SELECT json_object('id', mp.id, 'price', mp.price, 'dateChecked', mp.date_checked) 
         FROM market_price mp 
         WHERE mp.plant_id = p.id 
         ORDER BY mp.date_checked DESC 
         LIMIT 1) as latestPrice
      FROM plants p
      WHERE p.user_id = ?
      ORDER BY p.name
    `
      )
      .all(userId);

    // Parse the JSON string in latestPrice
    return plants.map((plant) => ({
      ...plant,
      latestPrice: plant.latestPrice ? JSON.parse(plant.latestPrice) : null,
    }));
  } catch (error) {
    console.error('Error fetching plants with market prices:', error);
    throw createError({
      statusCode: 500,
      message: 'Server error fetching plants with market prices',
    });
  }
});
