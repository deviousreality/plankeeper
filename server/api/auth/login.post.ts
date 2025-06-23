// server/api/auth/login.post.ts
import { db } from '~/server/utils/db';

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

    // In a real application, you would use a secure password comparison
    // like bcrypt.compare(password, user.password)
    if (password !== user.password) {
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
