<!-- components/form-plant.vue -->
<template>
  <v-form
    ref="form"
    @submit.prevent="$emit('submit')">
    <v-card>
      <v-card-text>
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
            <v-text-field
              v-model="plant.image_url"
              label="Image URL"
              hint="Link to a photo of your plant"
              placeholder="https://example.com/image.jpg" />
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
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-spacer />
        <v-btn
          color="primary"
          @click="$emit('cancel')">
          Cancel
        </v-btn>
        <v-btn
          color="success"
          type="submit"
          :loading="loading">
          Save Plant
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-form>
</template>
<script lang="ts" setup>
import type { Plant } from '~/types/database';

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

// Props
type Props = {
  isQuickAdd?: boolean;
  plant: PlantFormData;
  loading?: boolean;
  familyOptions: FamilyOptions[];
  genusOptions: GenusOptions[];
  speciesOptions: SpeciesOptions[];
};

const props = withDefaults(defineProps<Props>(), {
  isQuickAdd: false,
  loading: false,
});

// Emits
const emit = defineEmits<{
  submit: [];
  cancel: [];
  'update:plant': [plant: PlantFormData];
  // 'update:personalCount': [count: number];
}>();

// Local reactive data for v-model
const plant = computed({
  get: () => props.plant,
  set: (value) => emit('update:plant', value),
});

// const personalCount = computed({
//   get: () => props.personalCount,
//   set: (value) => emit('update:personalCount', value),
// });

// Form reference
const form = ref();
const datePickerModal = ref(false);

// Form options
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

// Smart name generation and validation
const suggestedName = computed(() => {
  // Get the selected taxonomy names
  const selectedFamily = props.familyOptions.find((f) => f.id === plant.value.family_id);
  const selectedGenus = props.genusOptions.find((g) => g.id === plant.value.genus_id);
  const selectedSpecies = props.speciesOptions.find((s) => s.id === plant.value.species_id);

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

const hasTaxonomySelection = computed(() => {
  return !!(plant.value.family_id ?? plant.value.genus_id ?? plant.value.species_id);
});

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

// Expose form validation method
const validate = () => {
  return form.value?.validate() ?? false;
};

defineExpose({
  validate,
});
</script>
