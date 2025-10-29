import { describe, expect, vi, it, beforeEach, afterEach } from 'vitest';
import { useDBTestUtils, useH3TestUtils } from '~/test/setup';
import { createMockH3Event } from '~/test/mocks/h3-events';
import { Database } from 'better-sqlite3';
import { Plant } from '~/types';
import type { H3Error } from 'h3';

describe('GET /api/plants[id]', async () => {
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

  const handler = await import('../[id].get');

  it('returns row for valid request', async () => {
    const event = createMockH3Event({
      body: {},
      context: { params: { id: '1' } },
    });

    const response = (await handler.default(event)) as Plant;

    expect(response).toBeDefined();
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
        message: 'Plant ID is required',
      });
    }
  });
});
