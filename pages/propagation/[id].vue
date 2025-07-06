<!-- pages/propagation/[id].vue -->
<template>
  <div>
    <v-row v-if="loading">
      <v-col
        cols="12"
        class="text-center"
      >
        <v-progress-circular indeterminate />
        <div class="mt-3">
          Loading propagation details...
        </div>
      </v-col>
    </v-row>

    <div
      v-else-if="error"
      class="text-center pa-5"
    >
      <v-alert
        type="error"
        title="Error Loading Propagation Record"
      >
        {{ error }}
      </v-alert>
      <v-btn
        class="mt-4"
        color="primary"
        to="/propagation"
      >
        Back to Propagation Manager
      </v-btn>
    </div>

    <template v-else>
      <!-- Back button and actions bar -->
      <div class="d-flex justify-space-between align-center mb-6">
        <v-btn
          color="primary"
          variant="outlined"
          prepend-icon="mdi-arrow-left"
          to="/propagation"
        >
          Back to Propagation Manager
        </v-btn>
        <div>
          <v-btn
            color="primary"
            class="me-2"
            @click="openEditDialog"
          >
            <v-icon>mdi-pencil</v-icon>
            Edit
          </v-btn>
          <v-btn
            color="error"
            @click="confirmDelete = true"
          >
            <v-icon>mdi-delete</v-icon>
            Delete
          </v-btn>
        </div>
      </div>

      <v-row>
        <!-- Plant and Propagation Info -->
        <v-col
          cols="12"
          md="6"
        >
          <v-card class="mb-4">
            <div class="d-flex align-center pa-4">
              <div>
                <v-avatar
                  size="80"
                  class="me-4"
                >
                  <v-img
                    :src="plant?.image_url || '/images/default-plant.jpg'"
                    alt="Plant Image"
                  />
                </v-avatar>
              </div>
              <div>
                <h2 class="text-h5 mb-1">
                  {{ plant?.name || 'Unknown Plant' }}
                </h2>
                <p class="text-subtitle-1 text-medium-emphasis mb-0">
                  {{ plant?.species || 'Species Unknown' }}
                </p>
              </div>
            </div>

            <v-card-text>
              <v-chip
                color="primary"
                class="mb-4"
              >
                {{ getPropTypeName(propagation.propType) }}
              </v-chip>

              <v-list>
                <v-list-item>
                  <template #prepend>
                    <v-icon>mdi-calendar</v-icon>
                  </template>
                  <v-list-item-title>Propagation Date</v-list-item-title>
                  <v-list-item-subtitle>
                    {{ formatDate(propagation.propDate) }}
                  </v-list-item-subtitle>
                </v-list-item>

                <v-list-item v-if="propagation.transplantDate">
                  <template #prepend>
                    <v-icon>mdi-tree</v-icon>
                  </template>
                  <v-list-item-title>Transplant Date</v-list-item-title>
                  <v-list-item-subtitle>
                    {{ formatDate(propagation.transplantDate) }}
                  </v-list-item-subtitle>
                </v-list-item>

                <v-list-item v-if="propagation.initialCount !== undefined">
                  <template #prepend>
                    <v-icon>mdi-seed</v-icon>
                  </template>
                  <v-list-item-title>Initial Count</v-list-item-title>
                  <v-list-item-subtitle>
                    {{ propagation.initialCount }}
                  </v-list-item-subtitle>
                </v-list-item>

                <v-list-item v-if="propagation.currentCount !== undefined">
                  <template #prepend>
                    <v-icon>mdi-sprout</v-icon>
                  </template>
                  <v-list-item-title>Current Count</v-list-item-title>
                  <v-list-item-subtitle>
                    <v-chip
                      :color="getSuccessRateColor()"
                      text-color="white"
                    >
                      {{ propagation.currentCount }} ({{ getSuccessRateText() }})
                    </v-chip>
                  </v-list-item-subtitle>
                </v-list-item>

                <v-list-item v-if="propagation.propType === 1 && propagation.seedSource">
                  <template #prepend>
                    <v-icon>mdi-seed-outline</v-icon>
                  </template>
                  <v-list-item-title>Seed Source</v-list-item-title>
                  <v-list-item-subtitle>
                    {{ propagation.seedSource }}
                  </v-list-item-subtitle>
                </v-list-item>

                <v-list-item v-if="propagation.propType === 2 && propagation.cuttingSource">
                  <template #prepend>
                    <v-icon>mdi-content-cut</v-icon>
                  </template>
                  <v-list-item-title>Cutting Source</v-list-item-title>
                  <v-list-item-subtitle>
                    {{ propagation.cuttingSource }}
                  </v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Notes and Timeline -->
        <v-col
          cols="12"
          md="6"
        >
          <v-card class="mb-4">
            <v-card-title>Notes</v-card-title>
            <v-card-text>
              <div
                v-if="propagation.notes"
                class="mb-4"
              >
                <p v-html="formatNotes(propagation.notes)" />
              </div>
              <p
                v-else
                class="text-medium-emphasis"
              >
                No notes available.
              </p>
            </v-card-text>
          </v-card>

          <!-- Failed Propagation Notes -->
          <v-card
            v-if="propagation.currentCount === 0 && propagation.zeroCoutNotes"
            class="mb-4"
            color="error"
          >
            <v-card-title class="text-white">
              Failure Notes
            </v-card-title>
            <v-card-text class="text-white">
              <p v-html="formatNotes(propagation.zeroCoutNotes)" />
            </v-card-text>
          </v-card>

          <!-- Timeline -->
          <v-card>
            <v-card-title>Timeline</v-card-title>
            <v-card-text>
              <v-timeline align="start">
                <v-timeline-item
                  dot-color="primary"
                  :icon="getPropTypeIcon()"
                  size="small"
                >
                  <div class="mb-2">
                    <strong>Started Propagation</strong>
                  </div>
                  <div>{{ formatDate(propagation.propDate) }}</div>
                  <div
                    v-if="propagation.initialCount"
                    class="text-caption"
                  >
                    Initial count: {{ propagation.initialCount }}
                  </div>
                </v-timeline-item>

                <v-timeline-item
                  v-if="propagation.transplantDate"
                  dot-color="success"
                  icon="mdi-tree"
                  size="small"
                >
                  <div class="mb-2">
                    <strong>Transplanted</strong>
                  </div>
                  <div>{{ formatDate(propagation.transplantDate) }}</div>
                </v-timeline-item>

                <v-timeline-item
                  v-if="propagation.currentCount === 0"
                  dot-color="error"
                  icon="mdi-alert-circle"
                  size="small"
                >
                  <div class="mb-2">
                    <strong>Failed Propagation</strong>
                  </div>
                  <div
                    v-if="propagation.zeroCoutNotes"
                    class="text-caption"
                  >
                    {{ propagation.zeroCoutNotes }}
                  </div>
                </v-timeline-item>
              </v-timeline>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <!-- Edit Propagation Dialog -->
    <v-dialog
      v-model="editDialog"
      max-width="600px"
    >
      <v-card>
        <v-card-title>
          <span class="text-h5">Edit Propagation Record</span>
        </v-card-title>
        <v-card-text>
          <v-form
            ref="form"
            v-model="valid"
            @submit.prevent="savePropagation"
          >
            <v-select
              v-model="editPropagation.plantId"
              :items="plantsOptions"
              label="Plant"
              required
              :rules="[v => !!v || 'Plant is required']"
            />
            
            <v-select
              v-model="editPropagation.propType"
              :items="propTypeOptions"
              label="Propagation Type"
              required
              :rules="[v => !!v || 'Propagation type is required']"
            />
            
            <v-text-field
              v-if="editPropagation.propType === 1"
              v-model="editPropagation.seedSource"
              Seed
              label="Seed Source"
              hint="Where did you get the seeds from?"
            />
            
            <v-text-field
              v-if="editPropagation.propType === 2"
              v-model="editPropagation.cuttingSource"
              Cutting
              label="Cutting Source"
              hint="Where did you get the cutting from?"
            />
            
            <v-text-field
              v-model="editPropagation.propDate"
              type="date"
              label="Propagation Date"
              required
              :rules="[v => !!v || 'Propagation date is required']"
            />
            
            <v-text-field
              v-model.number="editPropagation.initialCount"
              type="number"
              label="Initial Count"
              hint="How many plants/seeds did you start with?"
            />
            
            <v-text-field
              v-model.number="editPropagation.currentCount"
              type="number"
              label="Current Count"
              hint="How many plants survived/are growing?"
            />
            
            <v-text-field
              v-model="editPropagation.transplantDate"
              type="date"
              label="Transplant Date"
              hint="When did you transplant (if applicable)?"
            />
            
            <v-textarea
              v-model="editPropagation.notes"
              label="Notes"
              hint="Any additional information about this propagation"
              rows="3"
            />
            
            <v-textarea
              v-if="editPropagation.currentCount === 0"
              v-model="editPropagation.zeroCoutNotes"
              label="Failure Notes"
              hint="What happened to the propagation?"
              rows="3"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="blue-darken-1"
            variant="text"
            @click="closeEditDialog"
          >
            Cancel
          </v-btn>
          <v-btn
            color="blue-darken-1"
            variant="text"
            :disabled="!valid"
            @click="savePropagation"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog
      v-model="confirmDelete"
      max-width="500px"
    >
      <v-card>
        <v-card-title class="text-h5">
          Confirm Delete
        </v-card-title>
        <v-card-text>
          Are you sure you want to delete this propagation record?
          This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="blue-darken-1"
            variant="text"
            @click="confirmDelete = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            variant="text"
            @click="deletePropagation"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { PropagationType, type PlantPropagation, type PlantDetails } from '~/types/plant-models';
import { formatDate } from '~/utils/format';

// Route params
const route = useRoute();
const propagationId = computed(() => Number(route.params.id));

// State
const propagation = ref<PlantPropagation>({} as PlantPropagation);
const plant = ref<PlantDetails | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const editDialog = ref(false);
const confirmDelete = ref(false);
const valid = ref(false);
const form = ref(null);
const editPropagation = ref<PlantPropagation>({} as PlantPropagation);
const plantsOptions = ref<Array<{ title: string, value: number }>>([]);

// Props options
const propTypeOptions = [
  { title: 'Seed', value: PropagationType.Seed },
  { title: 'Cutting', value: PropagationType.Cutting },
  { title: 'Division', value: PropagationType.Division },
  { title: 'Offsets', value: PropagationType.Offsets },
  { title: 'Layering', value: PropagationType.Layering },
  { title: 'Other', value: PropagationType.Other },
];

// Methods
function openEditDialog() {
  editPropagation.value = { ...propagation.value };
  editDialog.value = true;
}

function closeEditDialog() {
  editDialog.value = false;
}

async function savePropagation() {
  if (form.value && !form.value.validate()) return;

  try {
    await $fetch(`/api/propagation/${propagation.value.id}`, {
      method: 'PUT',
      body: editPropagation.value
    });
    
    closeEditDialog();
    fetchPropagationDetails();
  } catch (error) {
    console.error('Error updating propagation record:', error);
    // Show error notification
  }
}

async function deletePropagation() {
  try {
    await $fetch(`/api/propagation/${propagation.value.id}`, {
      method: 'DELETE'
    });
    navigateTo('/propagation');
  } catch (error) {
    console.error('Error deleting propagation record:', error);
    // Show error notification
  }
}

function getPropTypeName(type?: PropagationType): string {
  if (!type) return 'Unknown';
  
  const found = propTypeOptions.find(option => option.value === type);
  return found ? found.title : 'Unknown';
}

function getPropTypeIcon(): string {
  if (!propagation.value.propType) return 'mdi-sprout-outline';
  
  switch (propagation.value.propType) {
    case PropagationType.Seed:
      return 'mdi-seed';
    case PropagationType.Cutting:
      return 'mdi-content-cut';
    case PropagationType.Division:
      return 'mdi-card-bulleted-outline';
    case PropagationType.Offsets:
      return 'mdi-flower';
    case PropagationType.Layering:
      return 'mdi-layers';
    default:
      return 'mdi-sprout-outline';
  }
}

function getSuccessRateText(): string {
  const initial = propagation.value.initialCount || 0;
  const current = propagation.value.currentCount || 0;
  
  if (initial === 0) return 'N/A';
  
  const rate = Math.round((current / initial) * 100);
  return `${rate}% success`;
}

function getSuccessRateColor(): string {
  const initial = propagation.value.initialCount || 0;
  const current = propagation.value.currentCount || 0;
  
  if (initial === 0) return 'grey';
  
  const rate = (current / initial) * 100;
  
  if (rate === 0) return 'red';
  if (rate < 25) return 'red-darken-1';
  if (rate < 50) return 'orange';
  if (rate < 75) return 'amber';
  return 'green';
}

function formatNotes(notes?: string): string {
  if (!notes) return '';
  // Simple formatting - convert line breaks to HTML breaks
  return notes.replace(/\n/g, '<br>');
}

// Fetch plants for dropdown
async function fetchPlants() {
  try {
    const response = await $fetch('/api/plants');
    plantsOptions.value = response.data.map((plant: any) => ({
      title: plant.name,
      value: plant.id
    }));
  } catch (error) {
    console.error('Error fetching plants:', error);
  }
}

// Fetch propagation details
async function fetchPropagationDetails() {
  loading.value = true;
  error.value = null;
  
  try {
    const response = await $fetch(`/api/propagation/${propagationId.value}`);
    propagation.value = response.data;
    
    // Fetch plant details
    if (propagation.value.plantId) {
      const plantResponse = await $fetch(`/api/plants/${propagation.value.plantId}`);
      plant.value = plantResponse.data;
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to load propagation details';
    console.error('Error fetching propagation details:', err);
  } finally {
    loading.value = false;
  }
}

// Lifecycle hooks
onMounted(async () => {
  await Promise.all([
    fetchPlants(),
    fetchPropagationDetails()
  ]);
});
</script>
