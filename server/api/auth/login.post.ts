// server/api/auth/login.post.ts
import { db } from '~/server/utils/db';
import type { User } from '~/server/utils/db';
import { isApiError } from '~/server/utils/errors';
import bcrypt from 'bcryptjs';

type LoginCredentials = {
  username: string;
  password: string;
};

type UserResponse = {
  id: number;
  username: string;
  email: string | null;
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { username, password } = body as LoginCredentials;

  if (!username || !password) {
    throw createError({
      statusCode: 400,
      message: 'Username and password are required',
    });
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as User | undefined;
    
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
    }    const response: UserResponse = {
      id: user.id,
      username: user.username,
      email: user.email
    };
    return response;} catch (err) {
    console.error('Login error:', err);
    
    // If it's already an API error with status code, rethrow it
    if (isApiError(err)) {
      throw err;
    }
    
    throw createError({
      statusCode: 500,
      message: 'Server error during authentication',
    });
  }
});
