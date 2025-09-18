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
          @click="cancel">
          Cancel
        </v-btn>
        <v-btn
          color="success"
          type="submit"
          :loading="isLoading || isSaving"
          @click="savePlant('POST')">
          {{ isSaving ? 'Saving...' : 'Save Plant' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script lang="ts" setup>
import FormPlant from '~/components/form-plant.vue';
import { useFormPlant } from '~/composables/useFormPlant';

definePageMeta({
  middleware: 'auth',
});

const route = useRoute();
const router = useRouter();
const { isLoading, isSaving, formPlant, handleImages, plantFormData, savePlant } = useFormPlant();
const isQuickAdd = computed(() => route.query.quick === 'true');

function cancel() {
  // Navigate back to plant detail page
  router.push(`/plants`);
}
</script>
