// server/scripts/updateAdminPassword.ts
import 'dotenv/config';
import { db } from '../utils/db';
import bcrypt from 'bcryptjs';
import Database from 'better-sqlite3';
import 'dotenv/config';

// THIS IS NOT CURRENTLY USED ANYWHERE IN THE APP BUT MAY BE USEFUL FOR ADMIN PASSWORD RESETTING IN THE FUTURE.

async function updateAdminPassword(db: Database.Database): Promise<number | void> {
  // Get password from command line arguments
  const newPassword = process.env['ADMIN_PASSWORD'] as string;

  if (!newPassword) {
    console.error('Error: No password provided');
    console.log('Usage: npx tsx server/scripts/updateAdminPassword.ts yourNewPassword');
    process.exit(1);
  }

  try {
    // Hash the new password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Check if admin user already exists
    const existingAdmin = db.prepare(`SELECT id FROM users WHERE username = 'admin'`).get() as
      | { id: number }
      | undefined;
    let adminUserId: number;

    if (existingAdmin) {
      // Update existing admin user
      db.prepare(`UPDATE users SET password = ?, email = ? WHERE username = 'admin'`).run(
        passwordHash,
        'admin@example.com'
      );
      adminUserId = existingAdmin.id;
      console.log(`Updated existing admin user: ${adminUserId}`);
    } else {
      const userResult = db
        .prepare(
          `
        INSERT INTO users (username, password, email) 
        VALUES ('admin', ?, 'admin@example.com')
      `
        )
        .run(passwordHash);
      adminUserId = userResult.lastInsertRowid as number;
      console.log(`Added new admin user: ${adminUserId}`);
    }
    return adminUserId;
  } catch (error) {
    console.error('Error updating admin password:', error);
  }
}

updateAdminPassword(db);

export { updateAdminPassword };
