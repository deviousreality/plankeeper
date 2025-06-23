// composables/useAuth.ts
import { ref, computed } from 'vue';

export interface User {
  id: number;
  username: string;
  email: string;
}

export const useAuth = () => {
  const user = ref<User | null>(null);
  const isAuthenticated = computed(() => !!user.value);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Check if user is already logged in (from storage)
  const initAuth = () => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        user.value = JSON.parse(storedUser);
      } catch (e) {
        localStorage.removeItem('user');
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
        body: { username, password }
      });
      
      user.value = response as User;
      localStorage.setItem('user', JSON.stringify(user.value));
      return true;
    } catch (e: any) {
      error.value = e.data?.message || 'Login failed';
      return false;
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
        body: { username, password, email }
      });
      
      user.value = response as User;
      localStorage.setItem('user', JSON.stringify(user.value));
      return true;
    } catch (e: any) {
      error.value = e.data?.message || 'Registration failed';
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  // Logout function
  const logout = () => {
    user.value = null;
    localStorage.removeItem('user');
  };

  // Initialize on creation
  if (process.client) {
    initAuth();
  }

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout
  };
};
