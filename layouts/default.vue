<!-- layouts/default.vue -->
<template>
  <v-app :theme="theme">
    <v-app-bar color="primary">
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
      <v-app-bar-title>PlantKeeper</v-app-bar-title>
      <v-spacer></v-spacer>
      <v-btn icon @click="toggleTheme">
        <v-icon>{{
          isDark ? "mdi-weather-sunny" : "mdi-weather-night"
        }}</v-icon>
      </v-btn>
    </v-app-bar>

    <v-navigation-drawer v-model="drawer" temporary>
      <v-list>
        <v-list-item
          to="/"
          title="Dashboard"
          prepend-icon="mdi-view-dashboard"
        ></v-list-item>
        <v-list-item
          to="/plants"
          title="My Plants"
          prepend-icon="mdi-flower"
        ></v-list-item>
        <v-list-item
          to="/plants/add"
          title="Add Plant"
          prepend-icon="mdi-plus"
        ></v-list-item>
        <v-list-item
          to="/care-tips"
          title="Care Tips"
          prepend-icon="mdi-lightbulb"
        ></v-list-item>
        <v-list-item
          to="/weather"
          title="Weather"
          prepend-icon="mdi-weather-partly-cloudy"
        ></v-list-item>
      </v-list>
      <template v-slot:append>
        <div class="pa-2">
          <v-btn block color="error" @click="logout">
            Logout
            <v-icon end>mdi-logout</v-icon>
          </v-btn>
        </div>
      </template>
    </v-navigation-drawer>

    <v-main>
      <v-container fluid>
        <slot />
      </v-container>
    </v-main>

    <v-footer app color="primary" class="text-center">
      <div class="text-center w-100">
        &copy; {{ new Date().getFullYear() }} - PlantKeeper
      </div>
    </v-footer>
  </v-app>
</template>

<script setup>
  const colorMode = useColorMode();
  const drawer = ref(false);
  const isDark = computed(() => colorMode.value === "dark");
  const theme = computed(() => (isDark.value ? "dark" : "light"));

  const toggleTheme = () => {
    colorMode.preference = isDark.value ? "light" : "dark";
  };

  const auth = useAuth();
  const logout = () => {
    auth.logout();
    navigateTo("/login");
  };
</script>
