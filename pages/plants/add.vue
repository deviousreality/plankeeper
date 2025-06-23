<!-- pages/plants/add.vue -->
<template>
  <div>
    <div class="d-flex justify-space-between align-center mb-6">
      <h1 class="text-h3">Add New Plant</h1>
      <v-btn
        color="primary"
        variant="outlined"
        prepend-icon="mdi-arrow-left"
        to="/plants"
      >
        Back to Plants
      </v-btn>
    </div>

    <v-form ref="form" @submit.prevent="savePlant">
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
                :rules="[(v) => !!v || 'Name is required']"
              ></v-text-field>

              <v-text-field
                v-model="plant.species"
                label="Species"
                hint="E.g., Monstera deliciosa"
              ></v-text-field>

              <v-text-field
                v-model="plant.image_url"
                label="Image URL"
                hint="Link to an image of your plant"
                placeholder="https://example.com/image.jpg"
              ></v-text-field>

              <v-textarea
                v-model="plant.notes"
                label="Notes"
                hint="Any additional information about your plant"
                auto-grow
                rows="3"
              ></v-textarea>

              <v-dialog
                ref="dialog"
                v-model="datePickerModal"
                :close-on-content-click="false"
                width="auto"
              >
                <template v-slot:activator="{ props }">
                  <v-text-field
                    v-model="formattedDate"
                    label="Date Acquired"
                    prepend-icon="mdi-calendar"
                    readonly
                    v-bind="props"
                    clearable
                    @click:clear="plant.acquired_date = null"
                  ></v-text-field>
                </template>
                <v-date-picker
                  v-model="plant.acquired_date"
                  @update:model-value="datePickerModal = false"
                ></v-date-picker>
              </v-dialog>
            </v-col>

            <!-- Right Column - Care Details -->
            <v-col cols="12" md="6">
              <h2 class="text-h5 mb-4">Care Details</h2>

              <v-select
                v-model="plant.light_needs"
                :items="lightOptions"
                label="Light Needs"
                hint="Select the light requirement for this plant"
              ></v-select>

              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model.number="plant.watering_interval"
                    label="Watering Interval (days)"
                    type="number"
                    min="1"
                    hint="Days between waterings"
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="6">
                  <v-text-field
                    v-model.number="plant.fertilizing_interval"
                    label="Fertilizing Interval (days)"
                    type="number"
                    min="1"
                    hint="Days between fertilizing"
                  ></v-text-field>
                </v-col>
              </v-row>

              <v-switch
                v-model="setInitialCare"
                label="Set initial care dates"
                hint="Record that you watered/fertilized today"
                color="primary"
              ></v-switch>

              <v-expand-transition>
                <div v-if="setInitialCare">
                  <v-row>
                    <v-col cols="12" md="6">
                      <v-checkbox
                        v-model="initialWatering"
                        label="Watered today"
                      ></v-checkbox>
                    </v-col>

                    <v-col cols="12" md="6">
                      <v-checkbox
                        v-model="initialFertilizing"
                        label="Fertilized today"
                      ></v-checkbox>
                    </v-col>
                  </v-row>
                </div>
              </v-expand-transition>
            </v-col>
          </v-row>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="$router.push('/plants')">Cancel</v-btn>
          <v-btn color="success" type="submit" :loading="loading"
            >Save Plant</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-form>
  </div>
</template>

<script setup>
  definePageMeta({
    middleware: "auth",
  });

  const router = useRouter();
  const auth = useAuth();
  const form = ref(null);
  const loading = ref(false);
  const setInitialCare = ref(true);
  const initialWatering = ref(true);
  const initialFertilizing = ref(false);
  const datePickerModal = ref(false);

  // Plant data
  const plant = ref({
    name: "",
    species: "",
    image_url: "",
    notes: "",
    acquired_date: new Date().toISOString().split("T")[0],
    light_needs: "Medium Light",
    watering_interval: 7,
    fertilizing_interval: 30,
  });

  // Form options
  const lightOptions = [
    "Low Light",
    "Medium Light",
    "Bright Indirect Light",
    "Full Sun",
  ];

  // Format date for display
  const formattedDate = computed(() => {
    if (!plant.value.acquired_date) return "";

    return new Date(plant.value.acquired_date).toLocaleDateString();
  });

  // Save plant to database
  async function savePlant() {
    if (!form.value.validate()) return;

    loading.value = true;

    try {
      // Prepare data for API
      const plantData = {
        ...plant.value,
        user_id: auth.user.value.id,
        last_watered:
          initialWatering.value && setInitialCare.value
            ? new Date().toISOString().split("T")[0]
            : null,
        last_fertilized:
          initialFertilizing.value && setInitialCare.value
            ? new Date().toISOString().split("T")[0]
            : null,
      };

      // Save the plant
      const newPlant = await $fetch("/api/plants", {
        method: "POST",
        body: plantData,
      });

      // Redirect to the new plant's page
      router.push(`/plants/${newPlant.id}`);
    } catch (error) {
      console.error("Error saving plant:", error);
      alert("Failed to save plant. Please try again.");
    } finally {
      loading.value = false;
    }
  }
</script>
