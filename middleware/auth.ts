// middleware/auth.ts
export default defineNuxtRouteMiddleware((to, from) => {
  const auth = useAuth();
  
  // If user is not authenticated and not trying to access the login/register pages
  if (!auth.isAuthenticated.value && !['/login', '/register'].includes(to.path)) {
    return navigateTo('/login');
  }

  // If user is authenticated and trying to access login/register pages
  if (auth.isAuthenticated.value && ['/login', '/register'].includes(to.path)) {
    return navigateTo('/');
  }
});
