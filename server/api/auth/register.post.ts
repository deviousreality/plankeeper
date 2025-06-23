// server/api/auth/register.post.ts
import { db } from '~/server/utils/db';
import bcrypt from 'bcryptjs';

export default defineEventHandler(async (event) => {
  const { username, password, email } = await readBody(event);

  if (!username || !password) {
    throw createError({
      statusCode: 400,
      message: 'Username and password are required',
    });
  }

  try {
    // Check if user already exists
    const existingUser = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
    
    if (existingUser) {
      throw createError({
        statusCode: 409,
        message: 'Username or email already exists',
      });
    }

    // Hash the password before storing
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    const result = db.prepare('INSERT INTO users (username, password, email) VALUES (?, ?, ?)').run(username, hashedPassword, email);
    
    return {
      id: result.lastInsertRowid,
      username,
      email
    };
  } catch (error) {
    console.error('Registration error:', error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      message: 'Server error during registration',
    });
  }
});
