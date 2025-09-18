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

    <v-card>
      <v-card-text>
        <FormPlant
          ref="formPlant"
          v-model="plantFormData"
          @images="handleImages" />
      </v-card-text>

      <v-divider />
      <v-card-actions>
        <v-spacer />
        <v-btn
          color="primary"
          :disabled="isSaving"
          @click="cancel">
          Cancel
        </v-btn>
        <v-btn
          color="success"
          type="submit"
          :loading="isLoading || isSaving"
          @click="savePlant('PUT')">
          {{ isSaving ? 'Saving...' : 'Save Plant' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import FormPlant from '~/components/form-plant.vue';
import { useFormPlant } from '~/composables/useFormPlant';

definePageMeta({
  middleware: 'auth',
});

const route = useRoute();
const router = useRouter();

const plantId = parseInt(route.params['id'] as string);
const { isLoading, isSaving, fetchPlant, formPlant, handleImages, plantFormData, savePlant } = useFormPlant(plantId);

function cancel() {
  // Navigate back to plant detail page
  router.push(`/plants/${plantId}`);
}

// Load data on component mount
onMounted(async () => {
  await fetchPlant();
});
</script>
