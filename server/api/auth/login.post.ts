// server/api/auth/login.post.ts
import { db } from '~/server/utils/db';
import bcrypt from 'bcryptjs';

export default defineEventHandler(async (event) => {
  const { username, password } = await readBody(event);

  if (!username || !password) {
    throw createError({
      statusCode: 400,
      message: 'Username and password are required',
    });
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    
    if (!user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid credentials',
      });
    }

    // Using bcrypt to compare the provided password with the stored hash
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      throw createError({
        statusCode: 401,
        message: 'Invalid credentials',
      });
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email
    };
  } catch (error) {
    console.error('Login error:', error);
    throw createError({
      statusCode: 500,
      message: 'Server error during authentication',
    });
  }
});
