<!-- pages/plants/[id]/edit.vue -->
<template>
  <div>
    <div class="d-flex justify-space-between align-center mb-6">
      <h1 class="text-h3">Edit Plant</h1>
      <v-btn color="primary" variant="outlined" prepend-icon="mdi-arrow-left" :to="`/plants/${plantId}`">
        Back to Plant
      </v-btn>
    </div>

    <v-card v-if="loading" class="text-center pa-5">
      <v-progress-circular indeterminate />
      <div class="mt-3">Loading plant data...</div>
    </v-card>

    <div v-else-if="error" class="text-center pa-5">
      <v-alert type="error" title="Error Loading Plant">
        {{ error }}
      </v-alert>
      <v-btn class="mt-4" color="primary" to="/plants"> Back to Plants </v-btn>
    </div>

    <v-form v-else ref="form" @submit.prevent="savePlant">
      <v-card>
        <v-card-text>
          <v-row>
            <!-- Left Column - Basic Plant Info -->
            <v-col cols="12" md="6">
              <h2 class="text-h5 mb-4">Plant Details</h2>

              <v-text-field
                v-model="plant.name"
                label="Plant Name*"
                required
                :rules="[(v) => !!v || 'Name is required']" />

              <v-text-field v-model="plant.species" label="Species" hint="E.g., Monstera deliciosa" />

              <v-text-field
                v-model="plant.image_url"
                label="Image URL"
                hint="Link to an image of your plant"
                placeholder="https://example.com/image.jpg" />

              <v-textarea
                v-model="plant.notes"
                label="Notes"
                hint="Any additional information about your plant"
                auto-grow
                rows="3" />

              <v-dialog ref="dialog" v-model="datePickerModal" :close-on-content-click="false" width="auto">
                <template #activator="{props}">
                  <v-text-field
                    v-model="formattedDate"
                    label="Date Acquired"
                    prepend-icon="mdi-calendar"
                    readonly
                    v-bind="props"
                    clearable
                    @click:clear="clearAcquiredDate()" />
                </template>
                <v-date-picker v-model="plant.acquired_date" @update:model-value="datePickerModal = false" />
              </v-dialog>
            </v-col>

            <!-- Right Column - Care Details -->
            <v-col cols="12" md="6">
              <h2 class="text-h5 mb-4">Care Details</h2>

              <v-select
                :model-value="plant.light_needs || null"
                @update:model-value="updateLightNeeds"
                :items="lightOptions"
                label="Light Needs"
                hint="Select the light requirement for this plant" />

              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model.number="plant.watering_interval"
                    label="Watering Interval (days)"
                    type="number"
                    min="1"
                    hint="Days between waterings" />
                </v-col>

                <v-col cols="12" md="6">
                  <v-text-field
                    v-model.number="plant.fertilizing_interval"
                    label="Fertilizing Interval (days)"
                    type="number"
                    min="1"
                    hint="Days between fertilizing" />
                </v-col>
              </v-row>

              <v-row>
                <v-col cols="12" md="6">
                  <v-dialog
                    ref="wateringDialog"
                    v-model="wateringDateModal"
                    :close-on-content-click="false"
                    width="auto">
                    <template #activator="{props}">
                      <v-text-field
                        v-model="lastWateredFormatted"
                        label="Last Watered"
                        prepend-icon="mdi-water"
                        readonly
                        v-bind="props"
                        clearable
                        @click:clear="plant.last_watered = null" />
                    </template>
                    <v-date-picker :model-value="plant.last_watered || null" @update:model-value="updateLastWatered" />
                  </v-dialog>
                </v-col>

                <v-col cols="12" md="6">
                  <v-dialog
                    ref="fertilizingDialog"
                    v-model="fertilizingDateModal"
                    :close-on-content-click="false"
                    width="auto">
                    <template #activator="{props}">
                      <v-text-field
                        v-model="lastFertilizedFormatted"
                        label="Last Fertilized"
                        prepend-icon="mdi-fertilizer"
                        readonly
                        v-bind="props"
                        clearable
                        @click:clear="plant.last_fertilized = null" />
                    </template>
                    <v-date-picker
                      :model-value="plant.last_fertilized || null"
                      @update:model-value="updateLastFertilized" />
                  </v-dialog>
                </v-col>
              </v-row>
            </v-col>
          </v-row>
        </v-card-text>

        <v-divider />

        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" :to="`/plants/${plantId}`"> Cancel </v-btn>
          <v-btn color="success" type="submit" :loading="saving"> Save Changes </v-btn>
        </v-card-actions>
      </v-card>
    </v-form>
  </div>
</template>

<script setup lang="ts">
import type {Plant} from "~/types/database";
import type {LocationQueryValue} from "vue-router";

definePageMeta({
  middleware: "auth",
});

// Helper function to safely get route parameter
function getRouteParam(param: LocationQueryValue | LocationQueryValue[] | undefined): string {
  if (typeof param === "string") {
    return param;
  }
  throw new Error("Invalid route parameter");
}

const route = useRoute();
const router = useRouter();
const auth = useAuth();
const form = ref<any>(null);
const plantId = getRouteParam(route.params["id"]);
const loading = ref(true);
const saving = ref(false);
const error = ref<string | null>(null);

const datePickerModal = ref(false);
const wateringDateModal = ref(false);
const fertilizingDateModal = ref(false);

// Plant data with proper typing
type PlantEditData = Plant & {
  careLogs?: any[];
  careTips?: any[];
  species?: string; // Add species field for form
  light_needs?: string | null;
  watering_interval?: number | null;
  fertilizing_interval?: number | null;
  last_watered?: string | null;
  last_fertilized?: string | null;
};

const plant = ref<PlantEditData>({
  id: 0,
  user_id: 0,
  name: "",
  species_id: undefined,
  family_id: undefined,
  genus_id: undefined,
  acquired_date: undefined,
  image_url: undefined,
  notes: undefined,
  is_favorite: false,
  created_at: "",
  updated_at: "",
  can_sell: false,
  is_personal: false,
  common_name: undefined,
  flower_color: undefined,
  variety: undefined,
  light_pref: undefined,
  water_pref: undefined,
  soil_type: undefined,
  species: "",
  light_needs: "Medium Light",
  watering_interval: 7,
  fertilizing_interval: 30,
  last_watered: null,
  last_fertilized: null,
});

// Form options
const lightOptions = ["Low Light", "Medium Light", "Bright Indirect Light", "Full Sun"];

// Clear acquired date helper
function clearAcquiredDate(): void {
  plant.value.acquired_date = undefined;
}

// Update light needs helper
function updateLightNeeds(value: string | null): void {
  plant.value.light_needs = value;
}

// Update last watered helper
function updateLastWatered(value: string | null | undefined): void {
  plant.value.last_watered = value || null;
  wateringDateModal.value = false;
}

// Update last fertilized helper
function updateLastFertilized(value: string | null | undefined): void {
  plant.value.last_fertilized = value || null;
  fertilizingDateModal.value = false;
}

// Format dates for display
const formattedDate = computed(() => {
  if (!plant.value.acquired_date) return "";
  return new Date(plant.value.acquired_date).toLocaleDateString();
});

const lastWateredFormatted = computed(() => {
  if (!plant.value.last_watered) return "";
  return new Date(plant.value.last_watered).toLocaleDateString();
});

const lastFertilizedFormatted = computed(() => {
  if (!plant.value.last_fertilized) return "";
  return new Date(plant.value.last_fertilized).toLocaleDateString();
});

// Load plant data
async function fetchPlantData(): Promise<void> {
  loading.value = true;
  error.value = null;

  try {
    const plantData = await $fetch<PlantEditData>(`/api/plants/${plantId}`);
    // The API returns the plant data directly, not nested
    plant.value = {...plant.value, ...plantData};
  } catch (e) {
    console.error("Error fetching plant:", e);
    error.value = "Failed to load plant data. Please try again.";
  } finally {
    loading.value = false;
  }
}

// Save plant changes
async function savePlant(): Promise<void> {
  if (!form.value?.validate()) return;
  if (!auth.user.value) {
    error.value = "Authentication required";
    return;
  }

  saving.value = true;

  try {
    // Prepare data for API
    const plantData = {
      ...plant.value,
      user_id: auth.user.value.id,
    };

    // Update the plant
    await $fetch(`/api/plants/${plantId}`, {
      method: "PUT",
      body: plantData,
    });

    // Redirect back to the plant's page
    router.push(`/plants/${plantId}`);
  } catch (error) {
    console.error("Error updating plant:", error);
    alert("Failed to update plant. Please try again.");
  } finally {
    saving.value = false;
  }
}

// Fetch plant data on component mount
onMounted(() => {
  fetchPlantData();
});
</script>
