import { describe, expect, vi, it, beforeEach, afterEach } from 'vitest';
import { useDBTestUtils, useH3TestUtils } from '~/test/setup';
import { createMockH3Event } from '~/test/mocks/h3-events';
import { Database } from 'better-sqlite3';
import { Plant, PlantModelPost } from '~/types';
import type { H3Error } from 'h3';

describe('POST /api/plants', async () => {
  let db: Database;
  const h3 = useH3TestUtils();

  beforeEach(() => {
    vi.clearAllMocks();
    db = useDBTestUtils();
    // Start a transaction for this test (changes will be isolated)
    db.exec('BEGIN TRANSACTION');
  });

  afterEach(() => {
    // Rollback any changes made during the test
    db.exec('ROLLBACK');
    db.close();
  });

  const handler = await import('../index.post');

  it('creates a new plant for valid request', async () => {
    const newPlantData = {
      user_id: 1,
      name: 'Test Plant',
      species_id: undefined,
      family_id: undefined,
      genus_id: undefined,
      common_name: 'Test Plant',
      variety: 'Test Variety',
      flower_color: 'Green',
      is_personal: true,
      is_favorite: false,
      acquired_date: '2024-01-01',
      notes: 'This is a test plant.',
      light_pref: 'Full Sun',
      water_pref: 'Moderate',
      soil_type: 'Loamy',
      plant_zones: '5-9',
      plant_use: 'Ornamental',
      has_fragrance: false,
      fragrance_description: '',
      is_petsafe: true,
      can_sell: false,
    } as unknown as PlantModelPost;
    const event = createMockH3Event({
      body: newPlantData,
    });

    const response = (await handler.default(event)) as Plant;
    expect(response).toBeDefined();
    expect(response.id).toBeGreaterThan(0);
    expect(response.name).toBeDefined();
    expect(response.common_name).toBeDefined();
    expect(response.variety).toBeDefined();
    expect(response.is_personal).toBe(true);
    expect(response.is_favorite).toBe(false);
    expect(response.acquired_date).toBeDefined();
    expect(response.notes).toBeDefined();
    expect(response.light_pref).toBeDefined();
    expect(response.water_pref).toBeDefined();
    expect(response.soil_type).toBeDefined();
    expect(response.plant_zones).toBeDefined();
    expect(response.plant_use).toBeDefined();
    expect(response.has_fragrance).toBe(false);
    expect(response.fragrance_description).toBeDefined();
    expect(response.is_petsafe).toBe(true);
    expect(response.can_sell).toBe(false);
  });

  it('should return 500 if plant name is missing', async () => {
    vi.spyOn(h3, 'createError').mockImplementation((options) => {
      throw new Error(JSON.stringify({ statusCode: options.statusCode, message: options.message }));
    });

    const event = createMockH3Event({
      body: {},
    });
    try {
      await handler.default(event);
    } catch (error) {
      await expect(error as H3Error).toMatchObject({
        statusCode: 500,
        message: 'Plant name is required and cannot be empty',
      });
    }
  });
});
