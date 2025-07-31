<!-- pages/care-tips.vue -->
<template>
  <div>
    <h1 class="text-h3 mb-6">Plant Care Tips</h1>

    <v-card class="mb-6">
      <v-card-text>
        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          label="Search plant species or tip content"
          clearable
          hide-details
          @update:model-value="searchTips" />
      </v-card-text>
    </v-card>

    <div
      v-if="loading"
      class="text-center pa-5">
      <v-progress-circular indeterminate />
      <div class="mt-3">Loading care tips...</div>
    </div>

    <div v-else>
      <v-tabs
        v-model="activeSpecies"
        show-arrows
        centered>
        <v-tab
          v-for="species in groupedTips.keys()"
          :key="species"
          :value="species">
          {{ species }}
        </v-tab>
      </v-tabs>

      <v-window
        v-model="activeSpecies"
        class="mt-4">
        <v-window-item
          v-for="[species, tips] in groupedTips"
          :key="species"
          :value="species">
          <v-card>
            <v-card-title class="d-flex justify-space-between align-center">
              <span>{{ species }} Care Guide</span>
              <v-btn
                v-if="isAdmin"
                size="small"
                color="primary"
                prepend-icon="mdi-plus"
                @click="openTipDialog(species)">
                Add Tip
              </v-btn>
            </v-card-title>

            <v-divider />

            <v-list lines="two">
              <v-list-item
                v-for="(tip, index) in tips"
                :key="`${species}-${index}`">
                <template #prepend>
                  <v-icon color="green"> mdi-leaf </v-icon>
                </template>

                <v-list-item-title>
                  {{ tip.tip }}
                </v-list-item-title>

                <v-list-item-subtitle v-if="tip.source"> Source: {{ tip.source }} </v-list-item-subtitle>

                <template
                  v-if="isAdmin"
                  #append>
                  <v-btn
                    icon="mdi-delete"
                    variant="text"
                    size="small"
                    color="error"
                    @click="deleteTip(tip.id)" />
                </template>
              </v-list-item>
            </v-list>
          </v-card>
        </v-window-item>
      </v-window>

      <div
        v-if="!groupedTips.size"
        class="text-center pa-5">
        <v-icon
          size="64"
          color="grey"
          class="mb-4">
          mdi-leaf-off
        </v-icon>
        <h3 class="text-h5 mb-3">No Care Tips Found</h3>
        <p class="mb-4">
          {{ search ? 'Try a different search term.' : 'No care tips available yet.' }}
        </p>
        <v-btn
          v-if="isAdmin"
          color="primary"
          @click="openTipDialog()">
          Add The First Tip
        </v-btn>
      </div>
    </div>

    <!-- Add/Edit Dialog -->
    <v-dialog
      v-model="showTipDialog"
      max-width="600px">
      <v-card>
        <v-card-title>
          {{ currentTip.id ? 'Edit Care Tip' : 'Add New Care Tip' }}
        </v-card-title>

        <v-card-text>
          <v-form ref="tipForm">
            <v-text-field
              v-model="currentTip.species"
              label="Plant Species*"
              required
              :rules="[(v) => !!v || 'Species is required']" />

            <v-textarea
              v-model="currentTip.tip"
              label="Care Tip*"
              required
              :rules="[(v) => !!v || 'Tip content is required']"
              auto-grow />

            <v-text-field
              v-model="currentTip.source"
              label="Source"
              hint="Where this tip came from (optional)" />
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn
            color="primary"
            variant="text"
            @click="showTipDialog = false">
            Cancel
          </v-btn>
          <v-btn
            color="success"
            :loading="savingTip"
            @click="saveTip">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Confirm Delete Dialog -->
    <v-dialog
      v-model="showDeleteDialog"
      max-width="400px">
      <v-card>
        <v-card-title>Delete Care Tip</v-card-title>
        <v-card-text> Are you sure you want to delete this care tip? This action cannot be undone. </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="primary"
            variant="text"
            @click="showDeleteDialog = false">
            Cancel
          </v-btn>
          <v-btn
            color="error"
            :loading="deletingTip"
            @click="confirmDeleteTip">
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import type { CareTip } from '~/types/database';

definePageMeta({
  middleware: 'auth',
});

// Types for the component
type CareTipForm = {
  id?: number;
  species: string;
  tip: string;
  source: string;
};

const auth = useAuth();
const tips = ref<CareTip[]>([]);
const loading = ref<boolean>(true);
const search = ref<string>('');
const activeSpecies = ref<string | null>(null);
const tipForm = ref<{ validate: () => boolean } | null>(null);

// Dialog controls
const showTipDialog = ref<boolean>(false);
const showDeleteDialog = ref<boolean>(false);
const savingTip = ref<boolean>(false);
const deletingTip = ref<boolean>(false);
const tipToDelete = ref<number | null>(null);

// Current tip for editing/adding
const currentTip = ref<CareTipForm>({
  species: '',
  tip: '',
  source: '',
});

// Check if user is an admin (for this demo purpose, let's add admin capability to user with ID 1)
const isAdmin = computed<boolean>(() => {
  return auth.user.value?.id === 1;
});

// Group tips by species
const groupedTips = computed<Map<string, CareTip[]>>(() => {
  const grouped = new Map<string, CareTip[]>();

  tips.value.forEach((tip) => {
    if (!grouped.has(tip.species)) {
      grouped.set(tip.species, []);
    }
    grouped.get(tip.species)!.push(tip);
  });

  // Convert to a sorted Map
  return new Map([...grouped.entries()].sort());
});

// Set active species tab based on available data
watchEffect(() => {
  if (groupedTips.value.size && !activeSpecies.value) {
    const firstKey = [...groupedTips.value.keys()][0];
    activeSpecies.value = firstKey || null;
  }
});

// Fetch care tips
async function fetchTips(): Promise<void> {
  loading.value = true;

  try {
    tips.value = await $fetch<CareTip[]>('/api/care-tips');
  } catch (error) {
    console.error('Error fetching care tips:', error);
  } finally {
    loading.value = false;
  }
}

// Search tips
function searchTips(): void {
  if (!search.value.trim()) {
    fetchTips(); // Reset to all tips
    return;
  }

  loading.value = true;

  $fetch<CareTip[]>(`/api/care-tips?search=${encodeURIComponent(search.value)}`)
    .then((result) => {
      tips.value = result;
    })
    .catch((error) => {
      console.error('Error searching tips:', error);
    })
    .finally(() => {
      loading.value = false;
    });
}

// Open dialog to add/edit tip
function openTipDialog(species = ''): void {
  currentTip.value = {
    species: species,
    tip: '',
    source: '',
  };
  showTipDialog.value = true;
}

// Save tip
async function saveTip(): Promise<void> {
  if (!tipForm.value?.validate()) return;

  savingTip.value = true;

  try {
    const response = await $fetch<CareTip>('/api/care-tips', {
      method: 'POST',
      body: currentTip.value,
    });

    // Add the new tip to our list
    if (currentTip.value.id) {
      // Update existing tip
      const index = tips.value.findIndex((t) => t.id === currentTip.value.id);
      if (index !== -1) {
        tips.value[index] = response;
      }
    } else {
      // Add new tip
      tips.value.push(response);
    }

    showTipDialog.value = false;
    activeSpecies.value = currentTip.value.species;
  } catch (error) {
    console.error('Error saving care tip:', error);
    alert('Failed to save care tip. Please try again.');
  } finally {
    savingTip.value = false;
  }
}

// Delete tip
function deleteTip(tipId: number): void {
  tipToDelete.value = tipId;
  showDeleteDialog.value = true;
}

// Confirm delete tip
async function confirmDeleteTip(): Promise<void> {
  if (!tipToDelete.value) return;

  deletingTip.value = true;

  try {
    await $fetch(`/api/care-tips/${tipToDelete.value}`, {
      method: 'DELETE',
    });

    // Remove tip from our list
    tips.value = tips.value.filter((t) => t.id !== tipToDelete.value);
    showDeleteDialog.value = false;
  } catch (error) {
    console.error('Error deleting care tip:', error);
    alert('Failed to delete care tip. Please try again.');
  } finally {
    deletingTip.value = false;
    tipToDelete.value = null;
  }
}

// Load tips on component mount
onMounted(() => {
  fetchTips();
});
</script>
