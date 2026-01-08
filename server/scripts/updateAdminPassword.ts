// server/scripts/updateAdminPassword.ts
import 'dotenv/config';
import { db } from '../utils/db';
import bcrypt from 'bcryptjs';

// Get password from command line arguments
const newPassword = process.argv[2];

if (!newPassword) {
  console.error('Error: No password provided');
  console.log('Usage: npx tsx server/scripts/updateAdminPassword.ts yourNewPassword');
  process.exit(1);
}

async function updateAdminPassword() {
  try {
    console.log('Updating admin password...');

    // Hash the new password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update the admin user's password
    const result = db.prepare('UPDATE users SET password = ? WHERE username = ?').run(passwordHash, 'admin');

    if (result.changes > 0) {
      console.log('Admin password updated successfully!');
    } else {
      console.log('No admin user found. Please run the database reset script first.');
    }
  } catch (error) {
    console.error('Error updating admin password:', error);
  }
}

updateAdminPassword();
