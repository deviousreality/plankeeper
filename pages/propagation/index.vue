<!-- pages/propagation/index.vue -->
<template>
  <div>
    <div class="d-flex justify-space-between align-center mb-6">
      <h1 class="text-h3">Propagation Manager</h1>
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        @click="openNewPropagationDialog">
        New Propagation
      </v-btn>
    </div>

    <v-card
      v-if="loading"
      class="text-center pa-5">
      <v-progress-circular indeterminate />
      <div class="mt-3">Loading propagation records...</div>
    </v-card>

    <template v-else>
      <!-- Search and filters -->
      <v-card class="mb-6">
        <v-card-text>
          <v-text-field
            v-model="search"
            prepend-inner-icon="mdi-magnify"
            label="Search propagation records"
            clearable
            hide-details
            class="mb-3" />

          <v-expansion-panels variant="accordion">
            <v-expansion-panel title="Filters">
              <template #text>
                <v-row>
                  <v-col
                    cols="12"
                    sm="6"
                    md="4">
                    <v-select
                      v-model="filters.propType"
                      :items="propTypeOptions"
                      label="Propagation Type"
                      clearable />
                  </v-col>
                  <v-col
                    cols="12"
                    sm="6"
                    md="4">
                    <v-select
                      v-model="filters.dateRange"
                      :items="dateRangeOptions"
                      label="Date Range" />
                  </v-col>
                  <v-col
                    cols="12"
                    sm="6"
                    md="4">
                    <v-select
                      v-model="filters.plantSpecies"
                      :items="speciesOptions"
                      label="Plant Species"
                      clearable />
                  </v-col>
                </v-row>
              </template>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-card-text>
      </v-card>

      <!-- No propagation records message -->
      <v-card
        v-if="!filteredPropagations.length"
        class="text-center pa-5">
        <v-icon
          size="64"
          color="grey"
          class="mb-4">
          mdi-sprout-outline
        </v-icon>
        <h2 class="text-h5 mb-2">No Propagation Records Found</h2>
        <p class="mb-4">
          {{ propagations.length ? 'Try changing your filters.' : 'Start by adding your first propagation record!' }}
        </p>
        <v-btn
          color="primary"
          @click="openNewPropagationDialog">
          New Propagation
        </v-btn>
      </v-card>

      <!-- Propagation records table -->
      <v-card v-else>
        <v-data-table
          :headers="headers"
          :items="filteredPropagations"
          :search="search"
          class="elevation-1">
          <template #item.propType="{ item }">
            {{ getPropTypeName(item.propType) }}
          </template>
          <template #item.propDate="{ item }">
            {{ formatDate(item.propDate) }}
          </template>
          <template #item.transplantDate="{ item }">
            {{ item.transplantDate ? formatDate(item.transplantDate) : 'N/A' }}
          </template>
          <template #item.currentCount="{ item }">
            <v-chip
              :color="getCountColor(item)"
              text-color="white">
              {{ item.currentCount }}
            </v-chip>
          </template>
          <template #item.actions="{ item }">
            <div class="d-flex justify-end">
              <v-btn
                icon
                variant="text"
                density="compact"
                color="primary"
                :to="`/propagation/${item.id}`"
                title="View Details">
                <v-icon>mdi-eye</v-icon>
              </v-btn>
              <v-btn
                icon
                variant="text"
                density="compact"
                color="warning"
                title="Edit"
                @click="editPropagation(item)">
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
              <v-btn
                icon
                variant="text"
                density="compact"
                color="error"
                title="Delete"
                @click="deletePropagation(item)">
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </div>
          </template>
        </v-data-table>
      </v-card>
    </template>

    <!-- New/Edit Propagation Dialog -->
    <v-dialog
      v-model="propagationDialog"
      max-width="600px">
      <v-card>
        <v-card-title>
          <span class="text-h5">{{ editMode ? 'Edit Propagation Record' : 'New Propagation Record' }}</span>
        </v-card-title>
        <v-card-text>
          <v-form
            ref="form"
            v-model="valid"
            @submit.prevent="savePropagation">
            <v-select
              v-model="currentPropagation.plantId"
              :items="plantsOptions"
              label="Plant"
              required
              :rules="[(v) => !!v || 'Plant is required']" />

            <v-select
              v-model="currentPropagation.propType"
              :items="propTypeOptions"
              label="Propagation Type"
              required
              :rules="[(v) => !!v || 'Propagation type is required']" />

            <v-text-field
              v-if="currentPropagation.propType === 1"
              v-model="currentPropagation.seedSource"
              label="Seed Source"
              hint="Where did you get the seeds from?" />

            <v-text-field
              v-if="currentPropagation.propType === 2"
              v-model="currentPropagation.cuttingSource"
              label="Cutting Source"
              hint="Where did you get the cutting from?" />

            <v-text-field
              v-model="currentPropagation.propDate"
              type="date"
              label="Propagation Date"
              required
              :rules="[(v) => !!v || 'Propagation date is required']" />

            <v-text-field
              v-model.number="currentPropagation.initialCount"
              type="number"
              label="Initial Count"
              hint="How many plants/seeds did you start with?" />

            <v-text-field
              v-model.number="currentPropagation.currentCount"
              type="number"
              label="Current Count"
              hint="How many plants survived/are growing?" />

            <v-text-field
              v-model="currentPropagation.transplantDate"
              type="date"
              label="Transplant Date"
              hint="When did you transplant (if applicable)?" />

            <v-textarea
              v-model="currentPropagation.notes"
              label="Notes"
              hint="Any additional information about this propagation"
              rows="3" />

            <v-textarea
              v-if="currentPropagation.currentCount === 0"
              v-model="currentPropagation.zeroCoutNotes"
              label="Failure Notes"
              hint="What happened to the propagation?"
              rows="3" />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="blue-darken-1"
            variant="text"
            @click="closePropagationDialog">
            Cancel
          </v-btn>
          <v-btn
            color="blue-darken-1"
            variant="text"
            :disabled="!valid"
            @click="savePropagation">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog
      v-model="deleteDialog"
      max-width="500px">
      <v-card>
        <v-card-title class="text-h5"> Confirm Delete </v-card-title>
        <v-card-text>
          Are you sure you want to delete this propagation record? This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="blue-darken-1"
            variant="text"
            @click="deleteDialog = false">
            Cancel
          </v-btn>
          <v-btn
            color="error"
            variant="text"
            @click="confirmDelete">
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { PropagationType, type PlantPropagation } from '~/types/plant-models';

// State
const propagations = ref<PlantPropagation[]>([]);
const loading = ref(true);
const search = ref('');
const propagationDialog = ref(false);
const deleteDialog = ref(false);
const valid = ref(false);
const editMode = ref(false);
const form = ref(null);
const propagationToDelete = ref<PlantPropagation | null>(null);

const currentPropagation = ref<Partial<PlantPropagation>>({
  propType: PropagationType.Seed,
  propDate: new Date().toISOString().split('T')[0],
  initialCount: 1,
  currentCount: 1,
});

// Filters
const filters = ref({
  propType: null as PropagationType | null,
  dateRange: 'all',
  plantSpecies: null as string | null,
});

// Table headers
const headers = [
  { title: 'Plant', key: 'plantName' },
  { title: 'Type', key: 'propType' },
  { title: 'Date', key: 'propDate' },
  { title: 'Initial Count', key: 'initialCount' },
  { title: 'Current Count', key: 'currentCount' },
  { title: 'Transplant Date', key: 'transplantDate' },
  { title: 'Actions', key: 'actions', sortable: false },
];

// Options
const propTypeOptions = [
  { title: 'Seed', value: PropagationType.Seed },
  { title: 'Cutting', value: PropagationType.Cutting },
  { title: 'Division', value: PropagationType.Division },
  { title: 'Offsets', value: PropagationType.Offsets },
  { title: 'Layering', value: PropagationType.Layering },
  { title: 'Other', value: PropagationType.Other },
];

const dateRangeOptions = [
  { title: 'All Time', value: 'all' },
  { title: 'Last 30 Days', value: '30days' },
  { title: 'Last 3 Months', value: '3months' },
  { title: 'Last 6 Months', value: '6months' },
  { title: 'This Year', value: 'year' },
];

const plantsOptions = ref<Array<{ title: string; value: number }>>([]);
const speciesOptions = ref<Array<{ title: string; value: string }>>([]);

// Computed
const filteredPropagations = computed(() => {
  let result = [...propagations.value];

  // Apply propagation type filter
  if (filters.value.propType) {
    result = result.filter((p) => p.propType === filters.value.propType);
  }

  // Apply date range filter
  if (filters.value.dateRange !== 'all') {
    const now = new Date();
    let cutoffDate: Date;

    switch (filters.value.dateRange) {
      case '30days':
        cutoffDate = new Date(now.setDate(now.getDate() - 30));
        break;
      case '3months':
        cutoffDate = new Date(now.setMonth(now.getMonth() - 3));
        break;
      case '6months':
        cutoffDate = new Date(now.setMonth(now.getMonth() - 6));
        break;
      case 'year':
        cutoffDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        cutoffDate = new Date(0); // Beginning of time
    }

    result = result.filter((p) => {
      if (!p.propDate) return false;
      return new Date(p.propDate) >= cutoffDate;
    });
  }

  // Apply plant species filter
  if (filters.value.plantSpecies) {
    result = result.filter((p) => p.species === filters.value.plantSpecies);
  }

  return result;
});

// Methods
function openNewPropagationDialog() {
  editMode.value = false;
  currentPropagation.value = {
    propType: PropagationType.Seed,
    propDate: new Date().toISOString().split('T')[0],
    initialCount: 1,
    currentCount: 1,
  };
  propagationDialog.value = true;
}

function editPropagation(item: PlantPropagation) {
  editMode.value = true;
  currentPropagation.value = { ...item };
  propagationDialog.value = true;
}

function closePropagationDialog() {
  propagationDialog.value = false;
}

async function savePropagation() {
  if (form.value && !form.value.validate()) return;

  try {
    if (editMode.value && currentPropagation.value.id) {
      await $fetch(`/api/propagation/${currentPropagation.value.id}`, {
        method: 'PUT',
        body: currentPropagation.value,
      });
    } else {
      await $fetch('/api/propagation', {
        method: 'POST',
        body: currentPropagation.value,
      });
    }

    closePropagationDialog();
    fetchPropagationRecords();
  } catch (error) {
    console.error('Error saving propagation record:', error);
    // Show error notification
  }
}

function deletePropagation(item: PlantPropagation) {
  propagationToDelete.value = item;
  deleteDialog.value = true;
}

async function confirmDelete() {
  if (!propagationToDelete.value) return;

  try {
    await $fetch(`/api/propagation/${propagationToDelete.value.id}`, {
      method: 'DELETE',
    });
    deleteDialog.value = false;
    fetchPropagationRecords();
  } catch (error) {
    console.error('Error deleting propagation record:', error);
    // Show error notification
  }
}

function getPropTypeName(type?: PropagationType): string {
  if (!type) return 'Unknown';

  const found = propTypeOptions.find((option) => option.value === type);
  return found ? found.title : 'Unknown';
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString();
}

function getCountColor(item: PlantPropagation): string {
  if (!item.initialCount || !item.currentCount) return 'grey';

  const successRate = (item.currentCount / item.initialCount) * 100;

  if (successRate === 0) return 'red';
  if (successRate < 25) return 'red-darken-1';
  if (successRate < 50) return 'orange';
  if (successRate < 75) return 'amber';
  return 'green';
}

// Fetch plants for dropdown
async function fetchPlants() {
  try {
    const response = await $fetch('/api/plants');
    plantsOptions.value = response.data.map((plant: any) => ({
      title: plant.name,
      value: plant.id,
    }));

    // Build species options for filter
    const uniqueSpecies = new Set<string>();
    response.data.forEach((plant: any) => {
      if (plant.species) uniqueSpecies.add(plant.species);
    });

    speciesOptions.value = Array.from(uniqueSpecies).map((species) => ({
      title: species,
      value: species,
    }));
  } catch (error) {
    console.error('Error fetching plants:', error);
  }
}

// Fetch propagation records
async function fetchPropagationRecords() {
  loading.value = true;
  try {
    const response = await $fetch('/api/propagation');
    propagations.value = response.data;
  } catch (error) {
    console.error('Error fetching propagation records:', error);
  } finally {
    loading.value = false;
  }
}

// Lifecycle hooks
onMounted(async () => {
  await Promise.all([fetchPlants(), fetchPropagationRecords()]);
});
</script>
