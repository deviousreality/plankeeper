<!-- layouts/auth.vue -->
<template>
  <v-app :theme="theme">
    <v-main>
      <v-container class="fill-height" fluid>
        <v-row align="center" justify="center">
          <v-col cols="12" sm="8" md="6" lg="4">
            <v-card class="elevation-12 pa-6">
              <slot />
            </v-card>
          </v-col>
        </v-row>
        <v-btn
          icon
          color="secondary"
          class="position-absolute top-0 end-0 ma-4"
          @click="toggleTheme"
        >
          <v-icon>{{
            isDark ? "mdi-weather-sunny" : "mdi-weather-night"
          }}</v-icon>
        </v-btn>
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
  const isDark = computed(() => colorMode.value === "dark");
  const theme = computed(() => (isDark.value ? "dark" : "light"));

  const toggleTheme = () => {
    colorMode.preference = isDark.value ? "light" : "dark";
  };
</script>

<style scoped>
  .position-absolute {
    position: absolute;
  }

  .top-0 {
    top: 0;
  }

  .end-0 {
    right: 0;
  }
</style>
