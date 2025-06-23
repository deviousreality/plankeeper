<!-- pages/login.vue -->
<template>
  <NuxtLayout name="auth">
    <v-card-title class="text-center text-h4 mb-5">
      <v-icon size="large" class="me-2">mdi-nature-people</v-icon>
      PlantKeeper
    </v-card-title>
    <v-card-text>
      <v-form @submit.prevent="handleLogin">
        <v-text-field
          v-model="username"
          label="Username"
          prepend-icon="mdi-account"
          :rules="[rules.required]"
          required
        ></v-text-field>

        <v-text-field
          v-model="password"
          label="Password"
          type="password"
          prepend-icon="mdi-lock"
          :rules="[rules.required]"
          required
        ></v-text-field>

        <v-alert
          v-if="auth.error"
          type="error"
          class="mt-4"
          density="compact"
          variant="tonal"
        >
          {{ auth.error }}
        </v-alert>

        <v-card-actions class="mt-4">
          <v-btn
            color="secondary"
            variant="text"
            to="/register"
            :disabled="auth.isLoading"
          >
            Register
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn color="primary" type="submit" :loading="auth.isLoading">
            Login
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card-text>
  </NuxtLayout>
</template>

<script setup>
  definePageMeta({
    layout: false,
    middleware: "guest",
  });

  const auth = useAuth();
  const username = ref("");
  const password = ref("");
  const router = useRouter();

  const rules = {
    required: (value) => !!value || "Required.",
  };

  async function handleLogin() {
    if (!username.value || !password.value) return;

    const success = await auth.login(username.value, password.value);
    if (success) {
      router.push("/");
    }
  }
</script>
