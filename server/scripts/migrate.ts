// server/scripts/migrate.ts
import { db } from '../utils/db';
import { runMigrations } from '../utils/migrations';

// CLI interface
const args = process.argv.slice(2);
const direction = (args[0] as 'up' | 'down') || 'up';
runMigrations(db, direction);

export { runMigrations };
