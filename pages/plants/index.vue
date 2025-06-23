<!-- pages/plants/index.vue -->
<template>
  <div>
    <div class="d-flex justify-space-between align-center mb-6">
      <h1 class="text-h3">My Plants</h1>
      <v-btn color="primary" prepend-icon="mdi-plus" to="/plants/add">
        Add Plant
      </v-btn>
    </div>

    <v-card v-if="loading" class="text-center pa-5">
      <v-progress-circular indeterminate></v-progress-circular>
      <div class="mt-3">Loading plants...</div>
    </v-card>

    <template v-else>
      <!-- Search and filters -->
      <v-card class="mb-6">
        <v-card-text>
          <v-text-field
            v-model="search"
            prepend-inner-icon="mdi-magnify"
            label="Search plants"
            clearable
            hide-details
            class="mb-3"
          ></v-text-field>

          <v-expansion-panels variant="accordion">
            <v-expansion-panel title="Filters">
              <template v-slot:text>
                <v-row>
                  <v-col cols="12" sm="6" md="4">
                    <v-select
                      v-model="filters.species"
                      :items="speciesOptions"
                      label="Species"
                      clearable
                    ></v-select>
                  </v-col>
                  <v-col cols="12" sm="6" md="4">
                    <v-select
                      v-model="filters.needsWater"
                      :items="[
                        { title: 'All', value: null },
                        { title: 'Needs Water Soon', value: true },
                      ]"
                      label="Watering Status"
                    ></v-select>
                  </v-col>
                  <v-col cols="12" sm="6" md="4">
                    <v-select
                      v-model="filters.needsFertilizer"
                      :items="[
                        { title: 'All', value: null },
                        { title: 'Needs Fertilizer Soon', value: true },
                      ]"
                      label="Fertilizing Status"
                    ></v-select>
                  </v-col>
                  <v-col cols="12" sm="6" md="4">
                    <v-select
                      v-model="filters.favorite"
                      :items="[
                        { title: 'All Plants', value: null },
                        { title: 'Favorites Only', value: true },
                      ]"
                      label="Favorite Status"
                    ></v-select>
                  </v-col>
                </v-row>
              </template>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-card-text>
      </v-card>

      <!-- No plants message -->
      <v-card v-if="!filteredPlants.length" class="text-center pa-5">
        <v-icon size="64" color="grey" class="mb-4">mdi-sprout</v-icon>
        <h2 class="text-h5 mb-2">No Plants Found</h2>
        <p class="mb-4">
          {{
            plants.length
              ? "Try changing your filters."
              : "Start by adding your first plant!"
          }}
        </p>
        <v-btn color="primary" to="/plants/add">Add Plant</v-btn>
      </v-card>

      <!-- Plants grid -->
      <v-row v-else>
        <v-col
          v-for="plant in filteredPlants"
          :key="plant.id"
          cols="12"
          sm="6"
          md="4"
          lg="3"
        >
          <v-card :to="`/plants/${plant.id}`" class="h-100">
            <v-img
              :src="plant.image_url || '/images/default-plant.jpg'"
              height="200"
              cover
              class="align-end"
            >
              <template v-slot:placeholder>
                <div class="d-flex align-center justify-center fill-height">
                  <v-icon size="64" color="grey">mdi-flower</v-icon>
                </div>
              </template>
              <v-card-title class="text-white bg-black bg-opacity-50">
                <div class="d-flex align-center">
                  <v-icon v-if="plant.is_favorite" color="amber" class="me-2"
                    >mdi-star</v-icon
                  >
                  {{ plant.name }}
                </div>
              </v-card-title>
            </v-img>

            <v-card-text>
              <div class="text-subtitle-1">
                {{ plant.species || "Unknown Species" }}
              </div>

              <!-- Status indicators -->
              <div class="d-flex mt-2">
                <v-chip
                  v-if="plant.next_task_date && daysTillNextTask(plant) <= 3"
                  :color="daysTillNextTask(plant) <= 0 ? 'error' : 'warning'"
                  size="small"
                  class="me-2"
                >
                  <v-icon start>{{ getTaskIcon(plant) }}</v-icon>
                  {{ getTaskText(plant) }}
                </v-chip>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>
  </div>
</template>

<script setup>
  definePageMeta({
    middleware: "auth",
  });

  const auth = useAuth();
  const plants = ref([]);
  const loading = ref(true);
  const search = ref("");
  const filters = ref({
    species: null,
    needsWater: null,
    needsFertilizer: null,
    favorite: null,
  });

  // Computed for filter options
  const speciesOptions = computed(() => {
    const uniqueSpecies = new Set(
      plants.value.map((p) => p.species).filter(Boolean)
    );
    const options = [{ title: "All", value: null }];
    uniqueSpecies.forEach((species) =>
      options.push({ title: species, value: species })
    );
    return options;
  });

  // Filtered plants based on search and filters
  const filteredPlants = computed(() => {
    if (!plants.value) return [];

    return plants.value.filter((plant) => {
      // Search filter
      if (
        search.value &&
        !plant.name.toLowerCase().includes(search.value.toLowerCase()) &&
        !plant.species?.toLowerCase().includes(search.value.toLowerCase())
      ) {
        return false;
      }

      // Species filter
      if (filters.value.species && plant.species !== filters.value.species) {
        return false;
      }

      // Watering filter
      if (filters.value.needsWater === true) {
        const daysTillWater = daysTillNextTask(plant);
        if (daysTillWater > 3 || !isNextTaskWatering(plant)) {
          return false;
        }
      }

      // Fertilizing filter
      if (filters.value.needsFertilizer === true) {
        const daysTillFertilize = daysTillNextTask(plant);
        if (daysTillFertilize > 3 || isNextTaskWatering(plant)) {
          return false;
        }
      }

      // Favorite filter
      if (filters.value.favorite === true && !plant.is_favorite) {
        return false;
      }

      return true;
    });
  });

  // Helpers
  function daysTillNextTask(plant) {
    if (!plant.next_task_date) return null;
    const today = new Date();
    const nextTask = new Date(plant.next_task_date);
    return Math.floor((nextTask - today) / (1000 * 60 * 60 * 24));
  }

  function isNextTaskWatering(plant) {
    if (!plant.last_watered || !plant.last_fertilized) return true; // Default to watering if missing data
    const lastWatered = new Date(plant.last_watered);
    const lastFertilized = new Date(plant.last_fertilized);
    return lastWatered <= lastFertilized;
  }

  function getTaskIcon(plant) {
    return isNextTaskWatering(plant) ? "mdi-water" : "mdi-fertilizer";
  }

  function getTaskText(plant) {
    const days = daysTillNextTask(plant);
    const taskType = isNextTaskWatering(plant) ? "Water" : "Fertilize";

    if (days < 0) {
      return `${taskType} overdue`;
    } else if (days === 0) {
      return `${taskType} today`;
    } else {
      return `${taskType} in ${days}d`;
    }
  }

  // Fetch plants data
  async function fetchPlants() {
    if (!auth.user.value) return;

    loading.value = true;
    try {
      plants.value = await $fetch(`/api/plants?userId=${auth.user.value.id}`);
    } catch (error) {
      console.error("Error fetching plants:", error);
    } finally {
      loading.value = false;
    }
  }

  // Load data on component mount
  onMounted(() => {
    fetchPlants();
  });
</script>
