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
    <v-card>
      <v-card-text>
        <FormPlant
          ref="formPlant"
          v-model="plantFormData"
          :is-quick-add="isQuickAdd"
          @images="handleImages" />
      </v-card-text>
      <v-divider />
      <v-card-actions>
        <v-spacer />
        <v-btn
          color="primary"
          :disabled="isSaving"
          @click="$emit('cancel')">
          Cancel
        </v-btn>
        <v-btn
          color="success"
          type="submit"
          :loading="loading || isSaving"
          @click="savePlant">
          {{ isSaving ? 'Saving...' : 'Save Plant' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script lang="ts" setup>
import FormPlant from '~/components/form-plant.vue';
import type { UploadFile } from '~/types/input-file-upload';
import type { PlantModelPost } from '~/types/plant-models';

definePageMeta({
  middleware: 'auth',
});

const router = useRouter();
const route = useRoute();
const auth = useAuth();
const loading = ref(false);
const isSaving = ref(false);
const formPlant = ref<InstanceType<typeof FormPlant>>();
// Quick add mode based on query parameter
const isQuickAdd = computed(() => route.query.quick === 'true');

// Plant data - using the correct Plant type from database
const plantFormData = ref<PlantModelPost>({
  user_id: auth.user.value?.id as number,
  id: undefined,
  name: '',
  species_id: undefined,
  family_id: undefined,
  genus_id: undefined,
  acquired_date: new Date().toISOString().split('T')[0],
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
  created_at: '',
  updated_at: '',
});
const imageFormData = ref<UploadFile[]>([]);

function handleImages(uploadFiles: UploadFile[]): void {
  imageFormData.value = uploadFiles;
}

async function savePlant(): Promise<void> {
  try {
    if (!auth.user.value?.id) {
      alert('You must be logged in to add a plant.');
      router.push('/login');
      return;
    }

    if (formPlant.value?.validate()) {
      isSaving.value = true;
    } else {
      alert('Please fix the errors in the form before saving.');
      return;
    }
    // Prepare data for API using the new schema
    const plantData = {
      user_id: auth.user.value?.id,
      name: plantFormData.value.name.trim(),
      species_id: plantFormData.value.species_id,
      family_id: plantFormData.value.family_id,
      genus_id: plantFormData.value.genus_id,
      acquired_date: plantFormData.value.acquired_date,
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
    } as PlantModelPost;

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
    if (plantFormData.value.is_personal && plantFormData?.value?.personal_count) {
      try {
        const personalData = {
          plant_id: plantId,
          count: plantFormData.value.personal_count,
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

    if (imageFormData.value.length > 0) {
      for (const file of imageFormData.value) {
        try {
          if (!(file.file instanceof File) && file.guid && file.markForDelete) {
            await $fetch(`/api/plant_photos/plants/${plantId}/${file.guid}`, {
              method: 'DELETE',
            });
          } else {
            const formData = new FormData();
            formData.append('plant_id', plantId.toString());
            formData.append('image', file.file as File);

            await $fetch(`/api/plant_photos`, {
              method: 'POST',
              body: formData,
            });
            console.log(`Image ${file.file?.name} uploaded successfully`);
          }
        } catch (imageError) {
          console.error(`Error uploading image ${file.file?.name}:`, imageError);
        }
      }
    }
    router.push(`/plants/${plantId}`);
  } catch (error) {
    console.error('Error saving plant:', error);
    alert('Failed to save plant. Please try again.');
  } finally {
    isSaving.value = false;
  }
}
</script>
