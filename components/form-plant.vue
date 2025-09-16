<!-- components/form-plant.vue -->
<template>
  <v-form ref="form">
    <v-row>
      <!-- Left Column - Basic Plant Info -->
      <v-col
        cols="12"
        md="6">
        <h2 class="text-h5 mb-4">Plant Details</h2>
      </v-col>
    </v-row>
    <v-row>
      <v-col
        cols="4"
        md="2">
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
      <v-col
        cols="4"
        md="2">
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
      <v-col
        cols="4"
        md="2">
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
      <v-col
        cols="0"
        md="6">
        <div>potential duplicate placeholder/reminder</div>
      </v-col>
    </v-row>

    <v-row>
      <v-col
        cols="12"
        md="6"
        sm="12">
        <v-text-field
          v-model="plant.name"
          :label="nameFieldLabel"
          :required="isNameRequired"
          :rules="nameValidationRules"
          :placeholder="suggestedName || 'Enter a custom name for your plant'" />
      </v-col>
      <v-col
        v-if="!isQuickAdd"
        cols="12"
        md="6"
        sm="12">
        <v-text-field
          v-model="plant.common_name"
          label="Common Name"
          hint="Popular or colloquial name for the plant"
          placeholder="e.g., Swiss Cheese Plant, Snake Plant" />
      </v-col>
    </v-row>

    <v-row>
      <v-col
        cols="12"
        md="6"
        sm="12">
        <v-text-field
          v-model="plant.variety"
          label="Variety"
          hint="Specific cultivar or variety"
          placeholder="e.g., 'Variegata', 'Thai Constellation'" />
      </v-col>
      <v-col
        cols="12"
        md="6"
        sm="12">
        <v-text-field
          v-model="plant.flower_color"
          label="Flower Color"
          hint="Primary color of the plant"
          placeholder="e.g., Green, Variegated" />
      </v-col>
    </v-row>

    <v-row>
      <v-col
        :cols="plant.is_personal ? 6 : 12"
        :md="plant.is_personal ? 3 : 6"
        :sm="plant.is_personal ? 6 : 12">
        <v-switch
          v-model="plant.is_personal"
          color="info"
          label="Personal plant"
          prepend-icon="mdi-account" />
      </v-col>
      <v-col
        v-if="plant.is_personal"
        cols="6"
        md="3"
        sm="6">
        <v-text-field
          v-model="plant.personal_count"
          label="Personal Count"
          type="number"
          min="0"
          hint="Number of plants in your personal collection" />
      </v-col>

      <v-col
        cols="6"
        md="3"
        sm="6">
        <v-switch
          v-model="plant.is_favorite"
          color="warning"
          label="Favorites"
          prepend-icon="mdi-star" />
      </v-col>
      <v-col
        cols="6"
        md="3"
        sm="6">
        <v-dialog
          ref="dialog"
          v-model="datePickerModal"
          :close-on-content-click="false"
          width="auto">
          <template #activator="{ props: activatorProps }">
            <v-text-field
              v-model="formattedDate"
              label="Date Acquired"
              prepend-icon="mdi-calendar"
              readonly
              v-bind="activatorProps"
              clearable
              @click:clear="plant.acquired_date = ''" />
          </template>
          <v-date-picker
            v-model="plant.acquired_date"
            @update:model-value="datePickerModal = false" />
        </v-dialog>
      </v-col>
    </v-row>

    <v-row>
      <v-col
        cols="12"
        md="6">
        <v-textarea
          v-model="plant.notes"
          label="Notes"
          hint="Any additional information about your plant"
          auto-grow
          rows="3" />
      </v-col>
      <v-col
        cols="12"
        md="6">
        <input-file-upload
          :max-file-size="2000000"
          :max-width="1024"
          :max-height="1024"
          :thumb-width="100"
          :thumb-height="100"
          :model-value="existingPhotos"
          @processed="handleProcessedImages" />
      </v-col>
    </v-row>

    <template v-if="!isQuickAdd">
      <v-row>
        <v-col
          cols="12"
          md="3"
          sm="6">
          <v-select
            v-model="plant.light_pref"
            label="Light Preference"
            :items="lightOptions"
            hint="Preferred lighting conditions"
            clearable />
        </v-col>
        <v-col
          cols="12"
          md="3"
          sm="6">
          <v-select
            v-model="plant.water_pref"
            label="Water Preference"
            :items="waterOptions"
            hint="Watering frequency needs"
            clearable />
        </v-col>
        <v-col
          cols="12"
          md="3"
          sm="6">
          <v-text-field
            v-model="plant.soil_type"
            label="Soil Type"
            hint="Preferred soil composition"
            placeholder="e.g., Well-draining, Succulent mix" />
        </v-col>
        <v-col
          cols="12"
          md="3"
          sm="6">
          <v-text-field
            v-model.number="plant.plant_zones"
            label="Plant Zones"
            type="number"
            hint="USDA Hardiness Zone (1-13)"
            min="1"
            max="13" />
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12">
          <v-text-field
            v-model="plant.plant_use"
            label="Plant Use"
            hint="How you use this plant"
            placeholder="e.g., Houseplant, Garden border, Cooking" />
        </v-col>
      </v-row>
      <v-row>
        <v-col
          :cols="plant.has_fragrance ? 6 : 12"
          :md="plant.has_fragrance ? 3 : 6"
          :sm="plant.has_fragrance ? 6 : 12">
          <v-switch
            v-model="plant.has_fragrance"
            color="purple"
            label="Has fragrance"
            prepend-icon="mdi-flower" />
        </v-col>
        <v-col
          v-if="plant.has_fragrance"
          cols="6"
          md="3"
          sm="6">
          <v-text-field
            v-model="plant.fragrance_description"
            label="Fragrance Description"
            hint="Describe the scent"
            placeholder="e.g., Sweet, Citrusy, Floral" />
        </v-col>

        <v-col
          cols="6"
          md="3">
          <v-switch
            v-model="plant.is_petsafe"
            color="green"
            label="Pet safe"
            prepend-icon="mdi-paw" />
        </v-col>
        <v-col
          cols="6"
          md="3">
          <v-switch
            v-model="plant.can_sell"
            color="orange"
            label="Can sell"
            prepend-icon="mdi-currency-usd" />
        </v-col>
      </v-row>
    </template>
  </v-form>
</template>
<script lang="ts" setup>
import type { PlantPhotos } from '~/types';
import type { UploadFile } from '~/types/input-file-upload';
import type { PlantModelPost } from '~/types/plant-models';

// Props
type Props = {
  isQuickAdd?: boolean;
  modelValue: PlantModelPost;
  loading?: boolean;
};
const lightOptions = [
  'Low Light',
  'Medium Light',
  'Bright Indirect Light',
  'Direct Sun',
  'Full Sun',
  'Partial Shade',
  'Full Shade',
];

const waterOptions = ['Low Water', 'Moderate Water', 'High Water', 'Drought Tolerant', 'Wet Soil', 'Moist Soil'];

const props = withDefaults(defineProps<Props>(), {
  isQuickAdd: false,
  loading: false,
});

// Emits
const emit = defineEmits<{
  cancel: [];
  images: [images: UploadFile[]];
  submit: [];
  'update:modelValue': [plant: PlantModelPost];
}>();

const form = ref();
const modelValueProxy = ref<PlantModelPost | undefined>(undefined);

// Local reactive data for v-model
const plant = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const {
  speciesOptions,
  familyOptions,
  fetchFamilies,
  fetchGenera,
  fetchSpecies,
  genusOptions,
  hasTaxonomySelection,
  suggestedName,
} = useTaxonomy(toRef(plant));

// Form reference
const datePickerModal = ref(false);

const isNameRequired = computed(() => {
  return !hasTaxonomySelection.value;
});

const nameFieldLabel = computed(() => {
  if (hasTaxonomySelection.value) {
    return 'Plant Name (optional)';
  }
  return 'Plant Name*';
});

const nameValidationRules = computed(() => {
  if (isNameRequired.value) {
    return [(v: string) => !!v || 'Name is required when no taxonomy is selected'];
  }
  return [];
});

// Format date for display
const formattedDate = computed(() => {
  if (!plant.value.acquired_date) return '';

  return new Date(plant.value.acquired_date).toLocaleDateString();
});

// Store existing photos from the database
const existingPhotos = ref<PlantPhotos[]>([]);

// Function to fetch existing photos for a plant
async function fetchExistingPhotos(plantId: number) {
  try {
    // This endpoint properly converts Buffer to base64
    const photos = await $fetch<PlantPhotos[]>(`/api/plant_photos/plants/${plantId}`);
    existingPhotos.value = photos || [];
  } catch (error) {
    console.error('Failed to fetch existing photos:', error);
  }
}
const processedImages = ref<UploadFile[]>([]);
const handleProcessedImages = (images: UploadFile[]) => {
  processedImages.value = images;
  emit('images', processedImages.value);
};

// Handle image deletion from the upload component
// function handleImageDelete(imageData: File) {
//   // Find the image in the processedImages array by file name
//   const fileName = imageData.name;

//   // Find the image in the processedImages array
//   const index = processedImages.value.findIndex((img) => img.name === fileName);

//   if (index !== -1) {
//     // Remove the image from the processed images array
//     processedImages.value.splice(index, 1);
//     console.log(`Removed image ${fileName} from processedImages`);

//     // Also clean up the upload status if it exists
//     if (uploadStatus.value[fileName]) {
//       delete uploadStatus.value[fileName];
//     }
//   }
// }

// Track the saving process state
// const isSaving = ref(false);
// const uploadStatus = ref<{ [key: string]: string }>({});

// Helper function to determine upload status chip color
// function getUploadStatusColor(fileName: string): string {
//   const status = uploadStatus.value[fileName];
//   if (!status) return 'default';

//   switch (status) {
//     case 'Complete':
//       return 'success';
//     case 'Failed':
//       return 'error';
//     case 'Uploading...':
//       return 'info';
//     default:
//       return 'default';
//   }
// }

// Function to convert database photos to the format expected by input-file-upload-list
// function convertToUploadFiles(photos: any[]) {
//   if (!photos || photos.length === 0) return [];

//   return photos.map((photo) => ({
//     file: new File([], photo.filename || 'existing-image.jpg'), // Placeholder File object
//     name: photo.filename,
//     size: 'From database',
//     filetype: photo.mime_type || 'image/jpeg',
//     thumb: photo.image, // Base64 image data
//     isLoading: false,
//     filestatus: 'success',
//     message: 'Existing image',
//     id: photo.id, // Database ID
//     isExisting: true, // Mark as existing
//   }));
// }

// const finalPlantName = plantFormData.value.name.trim() || suggestedName.value;

// Main function to save the plant and its images

// Fetch data when component mounts
onMounted(async () => {
  modelValueProxy.value = props.modelValue;
  await fetchFamilies();
  await fetchGenera(modelValueProxy?.value.family_id);
  await fetchSpecies(modelValueProxy?.value.family_id, modelValueProxy?.value.genus_id);
  if (plant.value.id) {
    await fetchExistingPhotos(plant.value.id);
  }
});

const validate = () => {
  return form.value?.validate() ?? false;
};

defineExpose({
  validate,
});
</script>
