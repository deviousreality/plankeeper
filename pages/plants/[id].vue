<!-- pages/plants/[id].vue -->
<template>
  <div>
    <v-row v-if="loading">
      <v-col cols="12" class="text-center">
        <v-progress-circular indeterminate></v-progress-circular>
        <div class="mt-3">Loading plant details...</div>
      </v-col>
    </v-row>

    <div v-else-if="error" class="text-center pa-5">
      <v-alert type="error" title="Error Loading Plant">
        {{ error }}
      </v-alert>
      <v-btn class="mt-4" color="primary" to="/plants"> Back to Plants </v-btn>
    </div>

    <template v-else>
      <!-- Back button and actions bar -->
      <div class="d-flex justify-space-between align-center mb-6">
        <v-btn
          color="primary"
          variant="outlined"
          prepend-icon="mdi-arrow-left"
          to="/plants"
        >
          Back to Plants
        </v-btn>
        <div>
          <v-btn color="warning" class="me-2" @click="toggleFavorite">
            <v-icon>{{
              plant.is_favorite ? "mdi-star" : "mdi-star-outline"
            }}</v-icon>
            {{ plant.is_favorite ? "Favorite" : "Add to Favorites" }}
          </v-btn>
          <v-btn color="primary" class="me-2" :to="`/plants/${plant.id}/edit`">
            <v-icon>mdi-pencil</v-icon>
            Edit
          </v-btn>
          <v-btn color="error" @click="confirmDelete = true">
            <v-icon>mdi-delete</v-icon>
            Delete
          </v-btn>
        </div>
      </div>

      <v-row>
        <!-- Plant info -->
        <v-col cols="12" md="6">
          <v-card class="mb-4">
            <v-img
              :src="plant.image_url || '/images/default-plant.jpg'"
              height="300"
              cover
              class="align-end"
            >
              <template v-slot:placeholder>
                <div class="d-flex align-center justify-center fill-height">
                  <v-icon size="64" color="grey">mdi-flower</v-icon>
                </div>
              </template>
            </v-img>

            <v-card-title class="text-h4">{{ plant.name }}</v-card-title>

            <v-card-text>
              <v-list>
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon>mdi-flower</v-icon>
                  </template>
                  <v-list-item-title>Species</v-list-item-title>
                  <v-list-item-subtitle>{{
                    plant.species || "Unknown"
                  }}</v-list-item-subtitle>
                </v-list-item>

                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon>mdi-calendar</v-icon>
                  </template>
                  <v-list-item-title>Acquired</v-list-item-title>
                  <v-list-item-subtitle>{{
                    plant.acquired_date
                      ? formatDate(plant.acquired_date)
                      : "Unknown"
                  }}</v-list-item-subtitle>
                </v-list-item>

                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon>mdi-water</v-icon>
                  </template>
                  <v-list-item-title>Last Watered</v-list-item-title>
                  <v-list-item-subtitle>{{
                    plant.last_watered
                      ? formatDate(plant.last_watered)
                      : "Never"
                  }}</v-list-item-subtitle>
                </v-list-item>

                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon>mdi-fertilizer</v-icon>
                  </template>
                  <v-list-item-title>Last Fertilized</v-list-item-title>
                  <v-list-item-subtitle>{{
                    plant.last_fertilized
                      ? formatDate(plant.last_fertilized)
                      : "Never"
                  }}</v-list-item-subtitle>
                </v-list-item>

                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon>mdi-weather-sunny</v-icon>
                  </template>
                  <v-list-item-title>Light Needs</v-list-item-title>
                  <v-list-item-subtitle>{{
                    plant.light_needs || "Not specified"
                  }}</v-list-item-subtitle>
                </v-list-item>
              </v-list>

              <v-expansion-panels variant="accordion" class="mt-4">
                <v-expansion-panel title="Notes">
                  <template v-slot:text>
                    <div class="py-2">
                      {{ plant.notes || "No notes yet." }}
                    </div>
                  </template>
                </v-expansion-panel>
              </v-expansion-panels>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Care history and actions -->
        <v-col cols="12" md="6">
          <!-- Propagation widget -->
          <PropagationWidget
            :plantId="plant.id"
            class="mb-4"
            @propagation-added="refreshPlantData"
          />

          <!-- Action buttons -->
          <v-card class="mb-4">
            <v-card-title>Plant Care</v-card-title>
            <v-card-text>
              <div class="d-flex flex-wrap gap-3">
                <v-btn
                  color="primary"
                  prepend-icon="mdi-water"
                  @click="recordCareAction('watering')"
                  :loading="careActionLoading === 'watering'"
                >
                  Record Watering
                </v-btn>

                <v-btn
                  color="success"
                  prepend-icon="mdi-fertilizer"
                  @click="recordCareAction('fertilizing')"
                  :loading="careActionLoading === 'fertilizing'"
                >
                  Record Fertilizing
                </v-btn>

                <v-btn
                  color="info"
                  prepend-icon="mdi-clipboard-text"
                  @click="recordCareAction('pruning')"
                  :loading="careActionLoading === 'pruning'"
                >
                  Record Pruning
                </v-btn>
              </div>
            </v-card-text>
          </v-card>

          <!-- Care tips -->
          <v-card class="mb-4" v-if="careTips.length">
            <v-card-title>Care Tips</v-card-title>
            <v-card-text>
              <v-list lines="two">
                <v-list-item v-for="(tip, index) in careTips" :key="index">
                  <v-list-item-title>
                    <v-icon
                      color="info"
                      class="me-2"
                      icon="mdi-lightbulb"
                    ></v-icon>
                    {{ tip.tip }}
                  </v-list-item-title>
                  <v-list-item-subtitle v-if="tip.source" class="text-grey">
                    Source: {{ tip.source }}
                  </v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>

          <!-- Care history -->
          <v-card>
            <v-card-title>Care History</v-card-title>
            <v-card-text v-if="!careLogs.length">
              <v-alert type="info" variant="tonal">
                No care history recorded yet.
              </v-alert>
            </v-card-text>
            <v-list v-else>
              <v-list-item v-for="log in careLogs" :key="log.id">
                <template v-slot:prepend>
                  <v-icon :icon="getCareLogIcon(log.action_type)"></v-icon>
                </template>
                <v-list-item-title>{{
                  formatCareAction(log.action_type)
                }}</v-list-item-title>
                <v-list-item-subtitle>
                  {{ formatDate(log.action_date) }}
                  <span v-if="log.notes" class="ms-2">- {{ log.notes }}</span>
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <!-- Delete confirmation dialog -->
    <v-dialog v-model="confirmDelete" max-width="500px">
      <v-card>
        <v-card-title class="text-h5">Delete Plant</v-card-title>
        <v-card-text>
          Are you sure you want to delete {{ plant?.name }}? This action cannot
          be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="confirmDelete = false"
            >Cancel</v-btn
          >
          <v-btn color="error" @click="deletePlant" :loading="deleteLoading"
            >Delete</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Care action dialog -->
    <v-dialog v-model="showCareDialog" max-width="500px">
      <v-card>
        <v-card-title>{{ formatCareAction(currentCareAction) }}</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="saveCareAction">
            <p>
              Recording
              {{ formatCareAction(currentCareAction).toLowerCase() }} for
              {{ plant?.name }}.
            </p>
            <v-text-field
              v-model="careNotes"
              label="Notes (optional)"
              placeholder="Any details about this care action"
            ></v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="showCareDialog = false"
            >Cancel</v-btn
          >
          <v-btn
            color="success"
            @click="saveCareAction"
            :loading="careActionLoading === 'saving'"
            >Save</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
  definePageMeta({
    middleware: "auth",
  });

  const route = useRoute();
  const router = useRouter();
  const auth = useAuth();
  const plantId = route.params.id;

  // Data
  const plant = ref({});
  const careTips = ref([]);
  const careLogs = ref([]);
  const loading = ref(true);
  const error = ref(null);
  const confirmDelete = ref(false);
  const deleteLoading = ref(false);
  const showCareDialog = ref(false);
  const currentCareAction = ref("");
  const careNotes = ref("");
  const careActionLoading = ref(null);

  // Fetch plant data
  async function fetchPlantData() {
    loading.value = true;
    error.value = null;

    try {
      const plantData = await $fetch(`/api/plants/${plantId}`);
      plant.value = { ...plantData.plant, ...plantData.care };
      careLogs.value = plantData.logs || [];

      if (plant.value.species) {
        fetchCareTips(plant.value.species);
      }
    } catch (e) {
      console.error("Error fetching plant:", e);
      error.value = "Failed to load plant data. Please try again.";
    } finally {
      loading.value = false;
    }
  }

  // Fetch care tips for this plant species
  async function fetchCareTips(species) {
    try {
      careTips.value = await $fetch(
        `/api/care-tips/${encodeURIComponent(species)}`
      );
    } catch (e) {
      console.error("Error fetching care tips:", e);
    }
  }

  // Record care action
  function recordCareAction(action) {
    currentCareAction.value = action;
    careNotes.value = "";
    showCareDialog.value = true;
  }

  // Save care action to database
  async function saveCareAction() {
    careActionLoading.value = "saving";

    try {
      const response = await $fetch(`/api/plants/${plantId}/care`, {
        method: "POST",
        body: {
          actionType: currentCareAction.value,
          notes: careNotes.value,
        },
      });

      // Update the plant data with new dates
      if (currentCareAction.value === "watering") {
        plant.value.last_watered = new Date().toISOString().split("T")[0];
      } else if (currentCareAction.value === "fertilizing") {
        plant.value.last_fertilized = new Date().toISOString().split("T")[0];
      }

      // Add the new log to the list
      careLogs.value.unshift({
        id: response.id,
        action_type: currentCareAction.value,
        action_date: new Date().toISOString(),
        notes: careNotes.value,
      });

      showCareDialog.value = false;
    } catch (e) {
      console.error("Error recording care action:", e);
      alert("Failed to record care action. Please try again.");
    } finally {
      careActionLoading.value = null;
    }
  }

  // Delete the plant
  async function deletePlant() {
    deleteLoading.value = true;

    try {
      await $fetch(`/api/plants/${plantId}`, {
        method: "DELETE",
      });

      confirmDelete.value = false;
      router.push("/plants");
    } catch (e) {
      console.error("Error deleting plant:", e);
      alert("Failed to delete plant. Please try again.");
    } finally {
      deleteLoading.value = false;
    }
  }

  // Toggle favorite status
  async function toggleFavorite() {
    try {
      // Update the plant's favorite status
      const updatedPlant = {
        ...plant.value,
        is_favorite: !plant.value.is_favorite,
      };

      // Save to server
      await $fetch(`/api/plants/${plantId}`, {
        method: "PUT",
        body: updatedPlant,
      });

      // Update local state
      plant.value.is_favorite = !plant.value.is_favorite;
    } catch (e) {
      console.error("Error updating favorite status:", e);
      alert("Failed to update favorite status. Please try again.");
    }
  }

  // Helper functions
  function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  }

  function getCareLogIcon(actionType) {
    const icons = {
      watering: "mdi-water",
      fertilizing: "mdi-fertilizer",
      pruning: "mdi-content-cut",
      repotting: "mdi-flower-pot",
      treatment: "mdi-medical-bag",
    };

    return icons[actionType] || "mdi-clipboard-text";
  }

  function formatCareAction(actionType) {
    return actionType.charAt(0).toUpperCase() + actionType.slice(1);
  }

  // Load data on component mount
  onMounted(() => {
    fetchPlantData();
  });
</script>
