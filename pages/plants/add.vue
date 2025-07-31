<!-- pages/plants/add.vue -->
<template>
  <div>
    <div class="d-flex justify-space-between align-center mb-6">
      <h1 class="text-h3">{{ isQuickAdd ? 'Quick Add Plant' : 'Add New Plant' }}</h1>
      <v-btn
        color="primary"
        variant="outlined"
        prepend-icon="mdi-arrow-left"
        to="/plants">
        Back to Plants
      </v-btn>
    </div>

    <FormPlant
      ref="formPlant"
      v-model:plant="plantFormData"
      :is-quick-add="isQuickAdd"
      :loading="loading"
      :family-options="familyOptions"
      :genus-options="genusOptions"
      :species-options="speciesOptions"
      @submit="savePlant"
      @cancel="$router.push('/plants')" />
  </div>
</template>

<script lang="ts" setup>
import type { Plant } from '~/types/database';
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
  personal_count?: number; // For personal plant count
};

definePageMeta({
  middleware: 'auth',
});

const router = useRouter();
const route = useRoute();
const auth = useAuth();
const loading = ref(false);

// Quick add mode based on query parameter
const isQuickAdd = computed(() => route.query.quick === 'true');

// Taxonomy data
const speciesOptions = ref<SpeciesOptions[]>([]);
const familyOptions = ref<FamilyOptions[]>([]);
const genusOptions = ref<GenusOptions[]>([]);

// Track selected taxonomy IDs for API calls
const selectedFamilyId = ref<number | undefined>(undefined);
const selectedGenusId = ref<number | undefined>(undefined);

// Plant data - using the correct Plant type from database
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
  personal_count: undefined, // For personal plant count
});

// Personal plant count for the personal table
const personalCount = ref<number>(1);

// Form reference for validation
const formPlant = ref();

// Form options
// const lightOptions = ["Low Light", "Medium Light", "Bright Indirect Light", "Full Sun"];

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

// Save plant to database
async function savePlant(): Promise<void> {
  if (!formPlant.value?.validate()) return;

  loading.value = true;

  try {
    if (!auth.user.value?.id) {
      alert('You must be logged in to add a plant.');
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
      personal_count: plantFormData.value.personal_count, // Use personal count if provided
    } as PlantFormData;

    // Save the plant
    const response = await $fetch('/api/plants', {
      method: 'POST',
      body: plantData,
    });

    console.log('Received response:', response);

    // Redirect to the new plant's page
    const plantId = response?.id;
    if (!plantId) {
      console.error('No plant ID in response:', response);
      throw new Error('No plant ID returned from server');
    }

    // Create personal plant entry if is_personal is checked
    if (plantFormData.value.is_personal && personalCount.value > 0) {
      try {
        const personalData = {
          plant_id: plantId,
          count: personalCount.value,
        };

        await $fetch('/api/personal', {
          method: 'POST',
          body: personalData,
        });

        console.log('Personal plant entry created successfully');
      } catch (personalError) {
        console.error('Error creating personal plant entry:', personalError);
        // Don't fail the whole operation, just log the error
      }
    }

    router.push(`/plants/${plantId}`);
  } catch (error) {
    console.error('Error saving plant:', error);
    alert('Failed to save plant. Please try again.');
  } finally {
    loading.value = false;
  }
}

// Fetch data when component mounts
onMounted(() => {
  fetchFamilies();
});
</script>
