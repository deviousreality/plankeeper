import { describe, expect, vi, it, beforeEach, afterEach } from 'vitest';
import { useDBTestUtils, useH3TestUtils } from '~/test/setup';
import { createMockH3Event } from '~/test/mocks/h3-events';
import { Database } from 'better-sqlite3';
import { Plant } from '~/types';
import type { H3Error } from 'h3';

describe('DELETE /api/plants/:id', async () => {
  let db: Database;
  const h3 = useH3TestUtils();

  const insertPlant = (db: Database): number => {
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
    return plantId as number;
  };

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

  const handler = await import('../[id].delete');

  it('deletes an existing plant for valid request', async () => {
    const plantId = insertPlant(db);
    const event = createMockH3Event({
      body: {},
      context: { params: { id: plantId.toString() } },
    });
    const response = (await handler.default(event)) as { success: boolean };
    expect(response).toBeDefined();
    expect(response.success).toBe(true);
  });

  it('should return 500 if plantId is missing', async () => {
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
        message: 'Valid plant ID is required',
      });
    }
  });
});
