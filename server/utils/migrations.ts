import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { type Migrations } from '../../types/database';

const MIGRATIONS_DIR = path.join(process.cwd(), 'server/migrations');

export interface Migration {
  name: string;
  up: (db: Database.Database) => void;
  down: (db: Database.Database) => void;
}

export const loadMigrations = async (): Promise<Migration[]> => {
  const files = fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.ts') || f.endsWith('.js'));
  const migrations = await Promise.all(
    files.map(async (file) => {
      const name = path.basename(file, path.extname(file));
      const filePath = path.join(MIGRATIONS_DIR, file);
      const fileUrl = pathToFileURL(filePath).href;
      const module = await import(fileUrl);
      return { name, up: module.up, down: module.down };
    })
  );
  return migrations;
};

export const getAppliedMigrations = (db: Database.Database): string[] => {
  return db
    .prepare<unknown[], Migrations>('SELECT name FROM migrations ORDER BY id')
    .all()
    .map((row) => row.name);
};

export const runMigrations = async (db: Database.Database, direction: 'up' | 'down' = 'up') => {
  const migrations = await loadMigrations();
  const applied = getAppliedMigrations(db);

  const toRun =
    direction === 'up'
      ? migrations.filter((m) => !applied.includes(m.name))
      : migrations.filter((m) => applied.includes(m.name)).reverse();

  for (const migration of toRun) {
    console.log(`Running ${direction}: ${migration.name}`);
    db.transaction(() => {
      migration[direction](db);
      if (direction === 'up') {
        db.prepare('INSERT INTO migrations (name) VALUES (?)').run(migration.name);
      } else {
        db.prepare('DELETE FROM migrations WHERE name = ?').run(migration.name);
      }
    })();
  }
};
