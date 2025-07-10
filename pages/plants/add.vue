<!-- pages/plants/add.vue -->
<template>
  <div>
    <div class="d-flex justify-space-between align-center mb-6">
      <h1 class="text-h3">Add New Plant</h1>
      <v-btn color="primary" variant="outlined" prepend-icon="mdi-arrow-left" to="/plants"> Back to Plants </v-btn>
    </div>

    <v-form ref="form" @submit.prevent="savePlant">
      <v-card>
        <v-card-text>
          <v-row>
            <!-- Left Column - Basic Plant Info -->
            <v-col cols="12" md="6">
              <h2 class="text-h5 mb-4">Plant Details</h2>
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="plant.name"
                label="Plant Name*"
                required
                :rules="[(v) => !!v || 'Name is required']" />
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="4" md="2">
              <v-autocomplete
                v-model="plant.family_id"
                autocomplete="off"
                label="Family"
                hint="Select a plant family first (e.g., Araceae, Asparagaceae)"
                :items="familyOptions"
                item-title="title"
                item-value="id"
                clearable />
            </v-col>
            <v-col cols="4" md="2">
              <v-autocomplete
                v-model="plant.genus_id"
                autocomplete="off"
                label="Genus"
                :hint="
                  plant.family_id
                    ? 'Select a genus within the chosen family (e.g., Monstera, Sansevieria)'
                    : 'Select a family first to see available genera'
                "
                :items="genusOptions"
                item-title="title"
                item-value="id"
                :disabled="!plant.family_id"
                clearable />
            </v-col>
            <v-col cols="4" md="2">
              <v-autocomplete
                v-model="plant.species_id"
                autocomplete="off"
                label="Species"
                :hint="
                  plant.genus_id
                    ? 'Select a species within the chosen genus (e.g., M. deliciosa)'
                    : 'Select a genus first to see available species'
                "
                :items="speciesOptions"
                item-title="title"
                item-value="id"
                :disabled="!plant.genus_id"
                clearable />
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="plant.flower_color"
                label="Flower Color"
                hint="Primary color of the plant"
                placeholder="e.g., Green, Variegated" />
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12" md="6">
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

              <v-switch v-model="plant.is_favorite" color="warning" label="Add to favorites" prepend-icon="mdi-star" />

              <v-dialog ref="dialog" v-model="datePickerModal" :close-on-content-click="false" width="auto">
                <template #activator="{props}">
                  <v-text-field
                    v-model="formattedDate"
                    label="Date Acquired"
                    prepend-icon="mdi-calendar"
                    readonly
                    v-bind="props"
                    clearable
                    @click:clear="plant.acquired_date = ''" />
                </template>
                <v-date-picker v-model="plant.acquired_date" @update:model-value="datePickerModal = false" />
              </v-dialog>
            </v-col>
          </v-row>
        </v-card-text>

        <v-divider />

        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" @click="$router.push('/plants')"> Cancel </v-btn>
          <v-btn color="success" type="submit" :loading="loading"> Save Plant </v-btn>
        </v-card-actions>
      </v-card>
    </v-form>
  </div>
</template>

<script lang="ts" setup>
import type {PlantModel, PlantModelPost} from "~/types";

type FamilyOptions = {
  title: string;
  value: string;
  id: number;
};

type GenusOptions = {
  title: string;
  value: string;
  id: number;
};

type SpeciesOptions = {
  title: string;
  value: string;
  id: number;
};

definePageMeta({
  middleware: "auth",
});

const router = useRouter();
const auth = useAuth();
const form = ref();
const loading = ref(false);
// const setInitialCare = ref(true);
// const initialWatering = ref(true);
// const initialFertilizing = ref(false);
const datePickerModal = ref(false);

// Taxonomy data
const speciesOptions = ref<SpeciesOptions[]>([]);
const familyOptions = ref<FamilyOptions[]>([]);
const genusOptions = ref<GenusOptions[]>([]);

// Track selected taxonomy IDs for API calls
const selectedFamilyId = ref<number | undefined>(undefined);
const selectedGenusId = ref<number | undefined>(undefined);

// Plant data - using the correct Plant type from database
const plant = ref<PlantModel>({
  name: "",
  family_id: undefined,
  genus_id: undefined,
  species_id: undefined,
  flower_color: undefined,
  image_url: undefined,
  notes: undefined,
  acquired_date: new Date().toISOString().split("T")[0],
  is_favorite: false,
  can_sell: false,
  is_personal: false,
  light_pref: undefined,
  water_pref: undefined,
  soil_type: undefined,
  common_name: undefined,
  variety: undefined,
  updated_at: new Date().toISOString().split("T")[0],
});

// Form options
// const lightOptions = ["Low Light", "Medium Light", "Bright Indirect Light", "Full Sun"];

// Format date for display
const formattedDate = computed(() => {
  if (!plant.value.acquired_date) return "";

  return new Date(plant.value.acquired_date).toLocaleDateString();
});

// Fetch initial family data
async function fetchFamilies(): Promise<FamilyOptions[] | void> {
  try {
    const response = await $fetch("/api/taxonomy");

    // Transform families for v-autocomplete
    familyOptions.value = response.families.map((family) => ({
      title: family.name,
      value: family.name,
      id: family.id,
    }));
  } catch (error) {
    console.error("Error fetching families:", error);
  }
}

// Fetch genera for selected family
async function fetchGenera(familyId: number): Promise<GenusOptions[] | void> {
  try {
    const response = await $fetch(`/api/taxonomy?familyId=${familyId}`);

    // Transform genera for v-autocomplete
    genusOptions.value = response.genera.map((genus) => ({
      title: genus.name,
      value: genus.name,
      id: genus.id,
    }));

    // Clear species when family changes
    speciesOptions.value = [];
    plant.value.species_id = undefined;
  } catch (error) {
    console.error("Error fetching genera:", error);
    genusOptions.value = [];
  }
}

// Fetch species for selected genus
async function fetchSpecies(familyId: number, genusId: number): Promise<SpeciesOptions[] | void> {
  try {
    const response = await $fetch(`/api/taxonomy?familyId=${familyId}&genusId=${genusId}`);

    // Transform species for v-autocomplete
    speciesOptions.value = response.species.map((species) => ({
      title: species.name,
      value: species.name,
      id: species.id,
    }));
  } catch (error) {
    console.error("Error fetching species:", error);
    speciesOptions.value = [];
  }
}

// Watch for family selection changes
watch(
  () => plant.value.family_id,
  (newFamilyId) => {
    if (newFamilyId) {
      selectedFamilyId.value = newFamilyId;
      fetchGenera(newFamilyId);

      // Clear genus and species when family changes
      plant.value.genus_id = undefined;
      plant.value.species_id = undefined;
      selectedGenusId.value = undefined;
    } else {
      // Clear everything when family is cleared
      selectedFamilyId.value = undefined;
      selectedGenusId.value = undefined;
      genusOptions.value = [];
      speciesOptions.value = [];
      plant.value.genus_id = undefined;
      plant.value.species_id = undefined;
    }
  }
);

// Watch for genus selection changes
watch(
  () => plant.value.genus_id,
  (newGenusId) => {
    if (newGenusId && selectedFamilyId.value) {
      selectedGenusId.value = newGenusId;
      fetchSpecies(selectedFamilyId.value, newGenusId);

      // Clear species when genus changes
      plant.value.species_id = undefined;
    } else {
      // Clear species when genus is cleared
      selectedGenusId.value = undefined;
      speciesOptions.value = [];
      plant.value.species_id = undefined;
    }
  }
);

// Fetch data when component mounts
onMounted(() => {
  fetchFamilies();
});

// Save plant to database
async function savePlant(): Promise<void> {
  if (!form.value.validate()) return;

  loading.value = true;

  try {
    // Check authentication first
    console.log("Auth user:", auth.user.value);
    console.log("Auth user ID:", auth.user.value?.id);

    if (!auth.user.value?.id) {
      alert("You must be logged in to add a plant.");
      router.push("/login");
      return;
    }

    // Prepare data for API using the new schema
    const plantData = {
      user_id: auth.user.value.id,
      name: plant.value.name,
      species_id: plant.value.species_id,
      family_id: plant.value.family_id,
      genus_id: plant.value.genus_id,
      acquired_date: plant.value.acquired_date,
      image_url: plant.value.image_url,
      notes: plant.value.notes,
      is_favorite: plant.value.is_favorite,
      is_personal: plant.value.is_personal,
      can_sell: plant.value.can_sell,
      common_name: plant.value.common_name,
      variety: plant.value.variety,
      flower_color: plant.value.flower_color,
      light_pref: plant.value.light_pref,
      water_pref: plant.value.water_pref,
      soil_type: plant.value.soil_type,
    } as PlantModelPost;

    console.log("Plant form data:", JSON.stringify(plant.value, null, 2));
    console.log("About to send plant data:", JSON.stringify(plantData, null, 2));

    // Save the plant
    const response = await $fetch("/api/plants", {
      method: "POST",
      body: plantData,
    });

    console.log("Received response:", response);

    // Redirect to the new plant's page
    const plantId = response?.id;
    if (!plantId) {
      console.error("No plant ID in response:", response);
      throw new Error("No plant ID returned from server");
    }

    router.push(`/plants/${plantId}`);
  } catch (error) {
    console.error("Error saving plant:", error);
    alert("Failed to save plant. Please try again.");
  } finally {
    loading.value = false;
  }
}
</script>
