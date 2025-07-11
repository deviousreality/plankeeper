<!-- pages/index.vue -->
<template>
  <div>
    <h1 class="text-h3 mb-6">Dashboard</h1>

    <v-row>
      <!-- Weather Card -->
      <v-col cols="12" sm="6" md="4">
        <v-card class="mb-4">
          <v-card-title class="d-flex align-center">
            <v-icon color="info" class="me-2"> mdi-weather-partly-cloudy </v-icon>
            Weather
          </v-card-title>
          <v-card-text v-if="weatherLoading">
            <v-progress-circular indeterminate />
          </v-card-text>
          <v-card-text v-else-if="weather">
            <div class="d-flex align-center">
              <img
                :src="`https://openweathermap.org/img/w/${weather.icon}.png`"
                :alt="weather.description"
                height="50" />
              <div class="ms-2">
                <div class="text-h5">{{ weather.temperature }}°C</div>
                <div>{{ weather.description }}</div>
                <div>Humidity: {{ weather.humidity }}%</div>
              </div>
            </div>
          </v-card-text>
          <v-card-text v-else>
            <v-alert type="info" variant="tonal"> Weather data not available </v-alert>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Plants Overview Card -->
      <v-col cols="12" sm="6" md="4">
        <v-card class="mb-4">
          <v-card-title class="d-flex align-center">
            <v-icon color="success" class="me-2"> mdi-flower </v-icon>
            My Plants
          </v-card-title>
          <v-card-text v-if="plantsLoading">
            <v-progress-circular indeterminate />
          </v-card-text>
          <v-card-text v-else-if="plants && plants.length">
            <div class="text-h5 mb-2">{{ plants.length }} Plants</div>
            <v-list density="compact">
              <v-list-item
                v-for="plant in plants.slice(0, 5)"
                :key="plant.id"
                :title="plant.name"
                :subtitle="plant.species || 'Unknown species'"
                :to="`/plants/${plant.id}`" />
            </v-list>
            <div v-if="plants.length > 5" class="text-center mt-2">
              <v-btn color="secondary" variant="text" to="/plants" size="small"> View all plants </v-btn>
            </div>
          </v-card-text>
          <v-card-text v-else>
            <v-alert type="info" variant="tonal"> No plants added yet. Add your first plant! </v-alert>
            <div class="text-center mt-4">
              <v-btn color="primary" to="/plants/add"> Add Plant </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Tasks Card -->
      <v-col cols="12" sm="6" md="4">
        <v-card class="mb-4">
          <v-card-title class="d-flex align-center">
            <v-icon color="warning" class="me-2"> mdi-calendar-check </v-icon>
            Upcoming Tasks
          </v-card-title>
          <v-card-text v-if="plantsLoading">
            <v-progress-circular indeterminate />
          </v-card-text>
          <v-card-text v-else-if="upcomingTasks.length">
            <v-list density="compact">
              <v-list-item
                v-for="task in upcomingTasks"
                :key="`${task.plantId}-${task.type}`"
                :title="task.plantName"
                :subtitle="`${task.type} - ${task.dueDate}`"
                :to="`/plants/${task.plantId}`">
                <template #prepend>
                  <v-icon :color="task.type === 'Watering' ? 'info' : 'success'">
                    {{ task.type === "Watering" ? "mdi-water" : "mdi-fertilizer" }}
                  </v-icon>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
          <v-card-text v-else>
            <v-alert type="success" variant="tonal"> No upcoming tasks! 🎉 </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import type {Plant} from "~/types/database";
import type {WeatherInfo} from "~/types/index";

definePageMeta({
  middleware: "auth",
});

// Type for plant with care schedule data
type PlantWithCareSchedule = Plant & {
  species?: string;
  watering_interval?: number;
  fertilizing_interval?: number;
  last_watered?: string;
  last_fertilized?: string;
  light_needs?: string;
  next_task_date?: string;
};

// Type for dashboard task
type DashboardTask = {
  plantId: number;
  plantName: string;
  type: string;
  dueDate: string;
  date: Date;
};

const auth = useAuth();
const plants = ref<PlantWithCareSchedule[]>([]);
const plantsLoading = ref(true);
const weather = ref<WeatherInfo | null>(null);
const weatherLoading = ref(true);

// Computed for upcoming tasks
const upcomingTasks = computed((): DashboardTask[] => {
  if (!plants.value) return [];

  const tasks: DashboardTask[] = [];
  const today = new Date();

  plants.value.forEach((plant) => {
    if (plant.next_task_date) {
      const nextTask = new Date(plant.next_task_date);
      const daysUntil = Math.floor((nextTask.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntil <= 7 && daysUntil >= 0) {
        // Determine if it's watering or fertilizing
        const lastWatered = plant.last_watered ? new Date(plant.last_watered) : null;
        const lastFertilized = plant.last_fertilized ? new Date(plant.last_fertilized) : null;

        let type = "Maintenance";
        if (lastWatered && lastFertilized) {
          type = lastWatered > lastFertilized ? "Fertilizing" : "Watering";
        } else if (lastWatered) {
          type = "Fertilizing";
        } else if (lastFertilized) {
          type = "Watering";
        }

        tasks.push({
          plantId: plant.id,
          plantName: plant.name,
          type: type,
          dueDate: daysUntil === 0 ? "Today" : `In ${daysUntil} days`,
          date: nextTask,
        });
      }
    }
  });

  return tasks.sort((a, b) => a.date.getTime() - b.date.getTime());
});

// Fetch plants data
async function fetchPlants(): Promise<void> {
  if (!auth.user.value) return;

  plantsLoading.value = true;
  try {
    plants.value = await $fetch<PlantWithCareSchedule[]>(`/api/plants?userId=${auth.user.value.id}`);
  } catch (error) {
    console.error("Error fetching plants:", error);
  } finally {
    plantsLoading.value = false;
  }
}

// Fetch weather data
async function fetchWeather(): Promise<void> {
  weatherLoading.value = true;
  try {
    // TODO: Disable weather API for now
    // For demo purposes, using a default city
    // In a real app, you would use geolocation or user preferences
    // weather.value = await $fetch<WeatherInfo>("/api/weather?city=London");

    // Temporary placeholder
    weather.value = null;
  } catch (error) {
    console.error("Error fetching weather data:", error);
  } finally {
    weatherLoading.value = false;
  }
}

// Load data on component mount
onMounted(() => {
  fetchPlants();
  fetchWeather();
});
</script>
