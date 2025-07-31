<!-- pages/plants/[id]/edit.vue -->
<template>
  <div>
    <div class="d-flex justify-space-between align-center mb-6">
      <h1 class="text-h3">Edit Plant</h1>
      <v-btn
        color="primary"
        variant="outlined"
        prepend-icon="mdi-arrow-left"
        :to="`/plants/${plantId}`">
        Back to Plant
      </v-btn>
    </div>

    <v-card
      v-if="loading"
      class="text-center pa-5">
      <v-progress-circular indeterminate />
      <div class="mt-3">Loading plant data...</div>
    </v-card>

    <div
      v-else-if="error"
      class="text-center pa-5">
      <v-alert
        type="error"
        title="Error Loading Plant">
        {{ error }}
      </v-alert>
      <v-btn
        class="mt-4"
        color="primary"
        to="/plants">
        Back to Plants
      </v-btn>
    </div>

    <FormPlant
      v-else
      ref="formPlant"
      v-model:plant="plantFormData"
      :loading="saving"
      :family-options="familyOptions"
      :genus-options="genusOptions"
      :species-options="speciesOptions"
      @submit="savePlant"
      @cancel="$router.push(`/plants/${plantId}`)" />
  </div>
</template>

<script setup lang="ts">
import type { Plant } from '~/types/database';
import type { LocationQueryValue } from 'vue-router';
import FormPlant from '~/components/form-plant.vue';

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

type PlantFormData = Omit<Plant, 'id' | 'user_id' | 'created_at' | 'updated_at'> & {
  id?: number;
  user_id?: number;
  created_at?: string;
  updated_at?: string;
};

definePageMeta({
  middleware: 'auth',
});

// Helper function to safely get route parameter
function getRouteParam(param: LocationQueryValue | LocationQueryValue[] | undefined): string {
  if (typeof param === 'string') {
    return param;
  }
  throw new Error('Invalid route parameter');
}

const router = useRouter();
const route = useRoute();
const auth = useAuth();
const loading = ref(true);

const plantId = getRouteParam(route.params['id']);
const saving = ref(false);
const error = ref<string | null>(null);

// Taxonomy data
const speciesOptions = ref<SpeciesOptions[]>([]);
const familyOptions = ref<FamilyOptions[]>([]);
const genusOptions = ref<GenusOptions[]>([]);

// Track selected taxonomy IDs for API calls
const selectedFamilyId = ref<number | undefined>(undefined);
const selectedGenusId = ref<number | undefined>(undefined);

// Form reference and data
const plantFormData = ref<PlantFormData>({
  name: '',
  species_id: undefined,
  family_id: undefined,
  genus_id: undefined,
  acquired_date: new Date().toISOString().split('T')[0],
  image_url: undefined,
  notes: undefined,
  is_favorite: false,
  can_sell: false,
  is_personal: false,
  common_name: undefined,
  flower_color: undefined,
  variety: undefined,
  light_pref: undefined,
  water_pref: undefined,
  soil_type: undefined,
  plant_use: undefined,
  has_fragrance: false,
  fragrance_description: undefined,
  is_petsafe: false,
  plant_zones: undefined,
  personal_count: undefined,
});

// Form reference for validation
const formPlant = ref();

// Smart name generation and validation
const suggestedName = computed(() => {
  // Get the selected taxonomy names
  const selectedFamily = familyOptions.value.find((f) => f.id === plantFormData.value.family_id);
  const selectedGenus = genusOptions.value.find((g) => g.id === plantFormData.value.genus_id);
  const selectedSpecies = speciesOptions.value.find((s) => s.id === plantFormData.value.species_id);

  if (selectedSpecies) {
    // If species is selected, use its name (e.g., "Monstera deliciosa")
    return selectedSpecies.title;
  } else if (selectedGenus) {
    // If only genus is selected, use genus name (e.g., "Monstera")
    return selectedGenus.title;
  } else if (selectedFamily) {
    // If only family is selected, use family name (e.g., "Araceae")
    return selectedFamily.title;
  }

  return '';
});

// Fetch initial family data
async function fetchFamilies(): Promise<FamilyOptions[] | void> {
  try {
    const response = await $fetch('/api/taxonomy');

    // Transform families for v-autocomplete
    familyOptions.value = response.families.map((family) => ({
      title: family.name,
      value: family.name,
      id: family.id,
    }));
  } catch (error) {
    console.error('Error fetching families:', error);
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
    plantFormData.value.species_id = undefined;
  } catch (error) {
    console.error('Error fetching genera:', error);
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
    console.error('Error fetching species:', error);
    speciesOptions.value = [];
  }
}

// Fetch plant data
async function fetchPlant(): Promise<void> {
  if (!auth.user.value) return;

  loading.value = true;
  try {
    const response = await $fetch<Plant>(`/api/plants/${plantId}`);

    // Convert plant data to form format
    plantFormData.value = {
      name: response.name,
      species_id: response.species_id,
      family_id: response.family_id,
      genus_id: response.genus_id,
      acquired_date: response.acquired_date,
      image_url: response.image_url,
      notes: response.notes,
      is_favorite: response.is_favorite,
      can_sell: response.can_sell,
      is_personal: response.is_personal,
      common_name: response.common_name,
      flower_color: response.flower_color,
      variety: response.variety,
      light_pref: response.light_pref,
      water_pref: response.water_pref,
      soil_type: response.soil_type,
      plant_use: response.plant_use,
      has_fragrance: response.has_fragrance,
      fragrance_description: response.fragrance_description,
      is_petsafe: response.is_petsafe,
      plant_zones: response.plant_zones,
      personal_count: response.personal_count,
    };

    // If plant has taxonomy selected, fetch the dependent options
    if (response.family_id) {
      selectedFamilyId.value = response.family_id;
      await fetchGenera(response.family_id);

      if (response.genus_id) {
        selectedGenusId.value = response.genus_id;
        await fetchSpecies(response.family_id, response.genus_id);
      }
    }

    // // Fetch personal count if it's a personal plant
    // if (response.is_personal) {
    //   try {
    //     const personalResponse = await $fetch<Array<{ count: number }>>(`/api/personal?plantId=${plantId}`);
    //     if (personalResponse && personalResponse.length > 0) {
    //       personalCount.value = personalResponse[0].count;
    //     }
    //   } catch (personalError) {
    //     console.error('Error fetching personal plant count:', personalError);
    //   }
    // }
  } catch (err: unknown) {
    console.error('Error fetching plant:', err);
    error.value = err instanceof Error ? err.message : 'Failed to load plant data';
  } finally {
    loading.value = false;
  }
}

// Watch for family selection changes
watch(
  () => plantFormData.value.family_id,
  async (newFamilyId) => {
    if (newFamilyId) {
      selectedFamilyId.value = newFamilyId;
      await fetchGenera(newFamilyId);

      // Clear genus and species when family changes
      plantFormData.value.genus_id = undefined;
      plantFormData.value.species_id = undefined;
      selectedGenusId.value = undefined;
    } else {
      // Clear everything when family is cleared
      selectedFamilyId.value = undefined;
      selectedGenusId.value = undefined;
      genusOptions.value = [];
      speciesOptions.value = [];
      plantFormData.value.genus_id = undefined;
      plantFormData.value.species_id = undefined;
    }
  }
);

// Watch for genus selection changes
watch(
  () => plantFormData.value.genus_id,
  (newGenusId) => {
    if (newGenusId && selectedFamilyId.value) {
      selectedGenusId.value = newGenusId;
      fetchSpecies(selectedFamilyId.value, newGenusId);

      // Clear species when genus changes
      plantFormData.value.species_id = undefined;
    } else {
      // Clear species when genus is cleared
      selectedGenusId.value = undefined;
      speciesOptions.value = [];
      plantFormData.value.species_id = undefined;
    }
  }
);
// Save plant changes
async function savePlant(): Promise<void> {
  if (!formPlant.value?.validate()) return;

  saving.value = true;

  try {
    if (!auth.user.value?.id) {
      alert('You must be logged in to edit a plant.');
      router.push('/login');
      return;
    }

    // Use suggested name if plant name is empty and we have taxonomy selection
    const finalPlantName = plantFormData.value.name.trim() || suggestedName.value;

    // Prepare data for API using the new schema
    const plantData = {
      user_id: auth.user.value.id,
      name: finalPlantName,
      species_id: plantFormData.value.species_id,
      family_id: plantFormData.value.family_id,
      genus_id: plantFormData.value.genus_id,
      acquired_date: plantFormData.value.acquired_date,
      image_url: plantFormData.value.image_url,
      notes: plantFormData.value.notes,
      is_favorite: plantFormData.value.is_favorite,
      is_personal: plantFormData.value.is_personal,
      can_sell: plantFormData.value.can_sell,
      common_name: plantFormData.value.common_name,
      variety: plantFormData.value.variety,
      flower_color: plantFormData.value.flower_color,
      light_pref: plantFormData.value.light_pref,
      water_pref: plantFormData.value.water_pref,
      soil_type: plantFormData.value.soil_type,
      plant_use: plantFormData.value.plant_use,
      has_fragrance: plantFormData.value.has_fragrance,
      fragrance_description: plantFormData.value.fragrance_description,
      is_petsafe: plantFormData.value.is_petsafe,
      plant_zones: plantFormData.value.plant_zones,
      personal_count: plantFormData.value.personal_count,
    } as PlantFormData;

    // Update the plant
    await $fetch(`/api/plants/${plantId}`, {
      method: 'PUT',
      body: plantData,
    });

    // Handle personal plant count update
    // if (plantFormData.value.is_personal && plantFormData.value.personal_count > 0) {
    //   try {
    //     await $fetch('/api/personal', {
    //       method: 'POST',
    //       body: {
    //         plant_id: parseInt(plantId),
    //         count: personalCount.value,
    //       },
    //     });
    //   } catch (personalError) {
    //     console.error('Error updating personal plant count:', personalError);
    //     // Don't fail the whole operation
    //   }
    // }

    // Navigate back to plant detail page
    router.push(`/plants/${plantId}`);
  } catch (error) {
    console.error('Error updating plant:', error);
    alert('Failed to update plant. Please try again.');
  } finally {
    saving.value = false;
  }
}

// Load data on component mount
onMounted(async () => {
  await fetchFamilies();
  await fetchPlant();
});
</script>
