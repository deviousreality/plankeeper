// composables/useAuth.ts
import { ref, computed } from 'vue';

export interface User {
  id: number;
  username: string;
  email: string;
}

export const useAuth = () => {
  // Initialize user state - starts as null, will be set from localStorage on client
  const user = useState<User | null>('auth.user', () => null);

  const isAuthenticated = computed(() => !!user.value);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Check if user is already logged in (from storage)
  const initAuth = () => {
    if (process.client && !user.value) {
      const storedUser = localStorage.getItem('plankeeper_user');

      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          user.value = parsed;
          console.log('User auto-authenticated from storage:', parsed);
        } catch (e) {
          console.error('Error parsing stored user:', e);
          localStorage.removeItem('plankeeper_user');
          localStorage.removeItem('plankeeper_token');
        }
      }
    }
  };

  // Login function
  const login = async (username: string, password: string) => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await $fetch('/api/auth/login', {
        method: 'POST',
        body: { username, password },
      });

      user.value = response as User;

      // Store authentication data
      if (process.client) {
        localStorage.setItem('plankeeper_user', JSON.stringify(user.value));
        // Note: If your API returns a token, store it too
        // localStorage.setItem('plankeeper_token', response.token);
      }

      console.log('User logged in and stored:', user.value);
      return { success: true };
    } catch (e: any) {
      error.value = e.data?.message || 'Login failed';
      return { success: false, error: error.value };
    } finally {
      isLoading.value = false;
    }
  };

  // Register function
  const register = async (username: string, password: string, email: string) => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await $fetch('/api/auth/register', {
        method: 'POST',
        body: { username, password, email },
      });

      user.value = response as User;

      // Store authentication data
      if (process.client) {
        localStorage.setItem('plankeeper_user', JSON.stringify(user.value));
      }

      return { success: true };
    } catch (e: any) {
      error.value = e.data?.message || 'Registration failed';
      return { success: false, error: error.value };
    } finally {
      isLoading.value = false;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await $fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      user.value = null;

      // Clear stored authentication data
      if (process.client) {
        localStorage.removeItem('plankeeper_user');
        localStorage.removeItem('plankeeper_token');
      }

      await navigateTo('/login');
    }
  };

  return {
    user: readonly(user),
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    initAuth, // Expose the init function
  };
};
