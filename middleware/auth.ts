// middleware/auth.ts
export default defineNuxtRouteMiddleware((to) => {
  // Skip auth check on server side - let client handle authentication
  if (process.server) {
    return;
  }

  const auth = useAuth();

  // Initialize auth if not already initialized
  if (!auth.user.value) {
    auth.initAuth();
  }

  // Double check with localStorage as fallback
  if (!auth.isAuthenticated.value) {
    const storedUser = localStorage.getItem('plantkeeper_user');
    if (storedUser) {
      try {
        auth.initAuth();
        if (auth.isAuthenticated.value) {
          return;
        }
      } catch (e) {
        console.error('Error in auth middleware:', e);
      }
    }
  }

  // If user is authenticated, allow access
  if (auth.isAuthenticated.value) {
    return;
  }

  // If not authenticated, redirect to login but preserve the intended destination
  return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`);
});
