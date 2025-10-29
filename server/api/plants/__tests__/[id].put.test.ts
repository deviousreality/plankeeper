import { describe, expect, vi, it, beforeEach, afterEach } from 'vitest';
import { useDBTestUtils, useH3TestUtils } from '~/test/setup';
import { createMockH3Event } from '~/test/mocks/h3-events';
import { Database } from 'better-sqlite3';
import { Plant, PlantModelPost } from '~/types';
import type { H3Error } from 'h3';

describe('PUT /api/plants/:id', async () => {
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
  const handler = await import('../[id].put');

  it('updates an existing plant for valid request', async () => {
    // Insert a plant to update
    const insertStmt = db.prepare(
      `INSERT INTO plants (user_id, name, species_id, family_id, genus_id, common_name, variety, flower_color, is_personal, is_favorite, acquired_date, notes, light_pref, water_pref, soil_type, plant_zones, plant_use, has_fragrance, fragrance_description, is_petsafe, can_sell) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    insertStmt.run(
      1,
      'Original Plant',
      null,
      null,
      null,
      'Original Common Name',
      'Original Variety',
      'Blue',
      1,
      1,
      '2023-01-01',
      'Original notes',
      'Shade',
      'Low',
      'Sandy',
      '3-7',
      'Edible',
      0,
      'Sweet',
      0,
      1
    );
    // Get the inserted plant's ID
    const plantId = (db.prepare('SELECT last_insert_rowid() as id').get() as Plant).id;

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
      context: { params: { id: plantId?.toString() ?? '' } },
    });

    const response = await handler.default(event);

    expect(response).toBeDefined();
  });

  it('should return 500 if plantId is missing', async () => {
    vi.spyOn(h3, 'createError').mockImplementation((options) => {
      throw new Error(JSON.stringify({ statusCode: options.statusCode, message: options.message }));
    });

    const event = createMockH3Event({
      context: { params: { id: '' } },
    });

    try {
      await handler.default(event);
    } catch (error) {
      await expect(error as H3Error).toMatchObject({
        statusCode: 500,
        message: 'Valid plant ID is required',
      });
    }
  });

  it('should return 500 if invalid name field', async () => {
    vi.spyOn(h3, 'createError').mockImplementation((options) => {
      throw new Error(JSON.stringify({ statusCode: options.statusCode, message: options.message }));
    });

    const event = createMockH3Event({
      context: { params: { id: '1' } },
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

  it('should return 500 if invalid family_id name field', async () => {
    vi.spyOn(h3, 'createError').mockImplementation((options) => {
      throw new Error(JSON.stringify({ statusCode: options.statusCode, message: options.message }));
    });

    const event = createMockH3Event({
      body: {
        name: 'Valid Name',
        family_id: 0,
      },
      context: { params: { id: '1' } },
    });

    try {
      await handler.default(event);
    } catch (error) {
      await expect(error as H3Error).toMatchObject({
        statusCode: 500,
        message: 'Family with ID 0 does not exist',
      });
    }
  });

  it('should return 500 if invalid genus_id name field', async () => {
    vi.spyOn(h3, 'createError').mockImplementation((options) => {
      throw new Error(JSON.stringify({ statusCode: options.statusCode, message: options.message }));
    });

    const event = createMockH3Event({
      body: {
        name: 'Valid Name',
        family_id: 1,
        genus_id: 0,
      },
      context: { params: { id: '1' } },
    });

    try {
      await handler.default(event);
    } catch (error) {
      await expect(error as H3Error).toMatchObject({
        statusCode: 500,
        message: 'Genus with ID 0 does not exist',
      });
    }
  });

  it('should return 500 if invalid species_id name field', async () => {
    vi.spyOn(h3, 'createError').mockImplementation((options) => {
      throw new Error(JSON.stringify({ statusCode: options.statusCode, message: options.message }));
    });

    const event = createMockH3Event({
      body: {
        name: 'Valid Name',
        family_id: 1,
        genus_id: 1,
        species_id: 0,
      },
      context: { params: { id: '1' } },
    });

    try {
      await handler.default(event);
    } catch (error) {
      await expect(error as H3Error).toMatchObject({
        statusCode: 500,
        message: 'Species with ID 0 does not exist',
      });
    }
  });
});
