// server/scripts/migrate.ts
import { db } from '~/server/utils/db';
import fs from 'fs';
import path from 'path';

const MIGRATIONS_DIR = path.join(process.cwd(), 'server/migrations');

interface Migration {
  name: string;
  up: () => void;
  down: () => void;
}

// Load migrations from files
const loadMigrations = (): Migration[] => {
  const files = fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.ts') || f.endsWith('.js'));
  return files.map((file) => {
    const name = path.basename(file, path.extname(file));
    const module = require(path.join(MIGRATIONS_DIR, file));
    return { name, up: module.up, down: module.down };
  });
};

// Get applied migrations
const getAppliedMigrations = (): string[] => {
  return db
    .prepare('SELECT name FROM migrations ORDER BY id')
    .all()
    .map((row) => row.name);
};

// Run migrations
const runMigrations = (direction: 'up' | 'down' = 'up') => {
  const migrations = loadMigrations();
  const applied = getAppliedMigrations();

  const toRun =
    direction === 'up'
      ? migrations.filter((m) => !applied.includes(m.name))
      : migrations.filter((m) => applied.includes(m.name)).reverse();

  for (const migration of toRun) {
    console.log(`Running ${direction}: ${migration.name}`);
    db.transaction(() => {
      migration[direction]();
      if (direction === 'up') {
        db.prepare('INSERT INTO migrations (name) VALUES (?)').run(migration.name);
      } else {
        db.prepare('DELETE FROM migrations WHERE name = ?').run(migration.name);
      }
    })();
  }
};

// CLI interface
const args = process.argv.slice(2);
const direction = (args[0] as 'up' | 'down') || 'up';
runMigrations(direction);
