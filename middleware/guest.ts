// middleware/guest.ts
export default defineNuxtRouteMiddleware((to, from) => {
  const auth = useAuth();
  
  // If user is authenticated, redirect to home
  if (auth.isAuthenticated.value) {
    return navigateTo('/');
  }
});
