// middleware/guest.ts
export default defineNuxtRouteMiddleware(() => {
  const auth = useAuth();

  // If user is authenticated, redirect to plants page
  if (auth.isAuthenticated.value) {
    return navigateTo('/plants');
  }
});
