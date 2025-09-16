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
      v-model="plantFormData"
      @submit="savePlant"
      @images="handleUpdateProcessedImages"
      @cancel="$router.push('/plants')" />
  </div>
</template>

<script setup lang="ts">
import type { LocationQueryValue } from 'vue-router';
import FormPlant from '~/components/form-plant.vue';
import type { UploadFile } from '~/types/input-file-upload';
import type { PlantModelPost } from '~/types/plant-models';

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

// Form reference and data
const plantFormData = ref<PlantModelPost | undefined>(undefined);
const plantImages = ref<UploadFile[]>([]);

// Fetch plant data
async function fetchPlant(): Promise<void> {
  loading.value = true;
  error.value = null;

  try {
    const plantData = await $fetch(`/api/plants/${plantId}`);
    plantFormData.value = plantData as PlantModelPost;
  } catch (err: unknown) {
    console.error('Error fetching plant:', err);
    error.value = err instanceof Error ? err.message : 'Failed to load plant data';
  } finally {
    loading.value = false;
  }
}

async function savePlant(): Promise<void> {
  // saving.value = true;

  try {
    if (!auth.user.value?.id) {
      alert('You must be logged in to edit a plant.');
      router.push('/login');
      return;
    }

    // Use suggested name if plant name is empty and we have taxonomy selection
    // const finalPlantName = plantFormData.value.name.trim() || suggestedName.value;

    // Prepare data for API using the new schema
    const plantData = {
      id: Number(plantId),
      user_id: auth.user.value?.id,
      name: plantFormData?.value?.name,
      species_id: plantFormData?.value?.species_id,
      family_id: plantFormData?.value?.family_id,
      genus_id: plantFormData?.value?.genus_id,
      acquired_date: plantFormData?.value?.acquired_date,
      image_url: plantFormData?.value?.image_url,
      notes: plantFormData?.value?.notes,
      is_favorite: plantFormData?.value?.is_favorite,
      is_personal: plantFormData?.value?.is_personal,
      can_sell: plantFormData?.value?.can_sell,
      common_name: plantFormData?.value?.common_name,
      variety: plantFormData?.value?.variety,
      flower_color: plantFormData?.value?.flower_color,
      light_pref: plantFormData?.value?.light_pref,
      water_pref: plantFormData?.value?.water_pref,
      soil_type: plantFormData?.value?.soil_type,
      plant_use: plantFormData?.value?.plant_use,
      has_fragrance: plantFormData?.value?.has_fragrance,
      fragrance_description: plantFormData?.value?.fragrance_description,
      is_petsafe: plantFormData?.value?.is_petsafe,
      plant_zones: plantFormData?.value?.plant_zones,
      personal_count: plantFormData?.value?.personal_count,
    } as PlantModelPost;

    // Update the plant
    await $fetch(`/api/plants/${plantId}`, {
      method: 'PUT',
      body: plantData,
    });

    if (plantImages.value.length > 0) {
      await uploadAllImages(Number(plantId));
    }

    // Navigate back to plant detail page
    router.push(`/plants/${plantId}`);
  } catch (error) {
    console.error('Error updating plant:', error);
    alert('Failed to update plant. Please try again.');
  } finally {
    saving.value = false;
  }
}

function handleUpdateProcessedImages(images: UploadFile[]) {
  plantImages.value = images;
}

// Function to upload all images
async function uploadAllImages(plantId: number) {
  const errors = [];

  // Upload each image one by one, collecting results
  for (const [index, image] of plantImages.value.entries()) {
    try {
      const imageObject = image as UploadFile;
      await uploadSingleImage(imageObject, plantId, index + 1);
    } catch (error) {
      errors.push(error);
      console.error(`Error uploading image ${index + 1}:`, error);
    }
  }

  // If any uploads failed, throw an error to prevent redirect
  if (errors.length > 0) {
    throw new Error(`Failed to upload ${errors.length} images. Please check the upload status and try again.`);
  }
}

// Function to upload a single image
async function uploadSingleImage(imageObject: UploadFile, plantId: number, position: number) {
  // Get the file name safely, with fallbacks
  let fileName = '';

  if (imageObject.filename) {
    fileName = imageObject.filename;
  } else {
    // Generate a fallback name if no name can be found
    fileName = `image-${position}.jpg`;
  }

  try {
    if (!imageObject.file) return;

    // Update status
    imageObject.filestatus = 'Uploading...';

    console.log(`Uploading image ${fileName} for plant ${plantId}`);

    // Create a FormData object
    const formData = new FormData();
    formData.append('plant_id', plantId.toString());

    // Add the file - either from base64 data or original file
    formData.append('file', imageObject.file);

    // Debug the form data
    console.log('FormData entries:');
    for (let [key, value] of formData.entries()) {
      console.log(`${key}: ${value instanceof File ? `File(${value.name}, ${value.type}, ${value.size}B)` : value}`);
    }

    // POST to the plant_photos endpoint
    const response = await $fetch('/api/plant_photos', {
      method: 'POST',
      body: formData,
    });

    imageObject.filestatus = 'Complete';
    console.log(`Image ${fileName} uploaded successfully:`, response);

    return response;
  } catch (error) {
    imageObject.filestatus = 'Failed';
    console.error(`Error uploading image ${fileName}:`, error);
    throw error;
  }
}

// Load data on component mount
onMounted(async () => {
  await fetchPlant();
});
</script>
