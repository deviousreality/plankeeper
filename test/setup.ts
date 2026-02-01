import { vi } from 'vitest';
import type { H3Event, EventHandlerRequest } from 'h3';
import Database from 'better-sqlite3';
import { generateForeignKeySeedTestData, generateUserTestData } from '~/server/utils/db';
import { buildTables } from '~/server/utils/db_build';

type Handler = (event: H3Event<EventHandlerRequest>) => Promise<unknown>;

function useDBTestUtils() {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  buildTables(db);
  generateUserTestData(db);
  generateForeignKeySeedTestData(db);
  vi.stubGlobal('db', db);
  return db;
}

function useH3TestUtils() {
  const h3 = vi.hoisted(() => ({
    createError: vi.fn().mockImplementation(() => {
      return {
        statusCode: 500,
        message: 'Bad Request',
      };
    }),
    defineEventHandler: vi.fn((handler: Handler) => {
      return handler;
    }),
    readBody: vi.fn(async (event: H3Event) => {
      if (event._requestBody && typeof event._requestBody === 'string') {
        return JSON.parse(event._requestBody);
      }
      return event._requestBody || {};
    }),
    getRouterParams: vi.fn((event: H3Event) => event.context?.params || {}),
    getQuery: vi.fn((event: H3Event) => event.context?.query || {}),
    readMultipartFormData: vi.fn(),
  }));

  vi.stubGlobal('defineEventHandler', h3.defineEventHandler);
  vi.stubGlobal('readBody', h3.readBody);
  vi.stubGlobal('getRouterParam', h3.getRouterParams);
  vi.stubGlobal('getQuery', h3.getQuery);
  vi.stubGlobal('createError', h3.createError);
  vi.stubGlobal('readMultipartFormData', h3.readMultipartFormData);
  return h3;
}

export { useDBTestUtils, useH3TestUtils };
