import { vi } from 'vitest';
import type { H3Event, EventHandlerRequest } from 'h3';
import Database from 'better-sqlite3';
import { generateForeignKeySeedTestData, generateUserTestData, initDb } from '~/server/utils/db';
// // Mock Nuxt auto-imports
// (globalThis as any).defineNuxtConfig = vi.fn();
// (globalThis as any).useRuntimeConfig = vi.fn();
// (globalThis as any).navigateTo = vi.fn();
// (globalThis as any).useFetch = vi.fn();
// (globalThis as any).useAsyncData = vi.fn();

type Handler = (event: H3Event<EventHandlerRequest>) => Promise<unknown>;

function useDBTestUtils() {
  // Use an in-memory DB for tests (starts empty each run)
  const db = new Database(':memory:');

  db.pragma('foreign_keys = ON');

  // Optionally, run initial schema setup here if needed (e.g., create tables)
  // db.exec(`CREATE TABLE plants (...);`);  // Add your schema SQL
  initDb(db); // or just initDb() if it uses the global db

  generateUserTestData(db);
  generateForeignKeySeedTestData(db);
  // Stub it globally so your code can import/use it
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
