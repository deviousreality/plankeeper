<!-- pages/care-schedules/index.vue -->
<template>
  <div>
    <h1 class="text-h3 mb-6">Care Schedule Manager</h1>

    <v-row>
      <v-col
        cols="12"
        lg="4">
        <v-card class="mb-4">
          <v-card-title>Plants</v-card-title>
          <v-card-text>
            <v-text-field
              v-model="search"
              prepend-inner-icon="mdi-magnify"
              label="Search plants"
              clearable
              hide-details
              class="mb-3" />

            <v-list
              v-model:selected="selectedPlant"
              lines="two"
              select-strategy="single-independent">
              <v-list-item
                v-for="plant in filteredPlants"
                :key="plant.id"
                :value="plant.id"
                :title="plant.name"
                :subtitle="plant.common_name || 'Unknown species'">
                <template #prepend>
                  <v-avatar color="grey-lighten-1">
                    <v-img :src="plant.image_url || '/images/default-plant.jpg'" />
                  </v-avatar>
                </template>

                <template #append>
                  <v-chip
                    v-if="getNextTaskInfo(plant).overdue"
                    color="error"
                    size="small">
                    Needs Care
                  </v-chip>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col
        cols="12"
        lg="8">
        <v-card
          v-if="!selectedPlant"
          class="mb-4 d-flex align-center justify-center"
          height="300">
          <div class="text-center pa-4">
            <v-icon
              size="64"
              color="grey-lighten-1">
              mdi-flower
            </v-icon>
            <h3 class="mt-4">Select a plant to manage its care schedule</h3>
          </div>
        </v-card>

        <template v-else>
          <v-card class="mb-4">
            <v-card-title>{{ currentPlant?.name }} Care Schedule</v-card-title>
            <v-card-text>
              <v-row>
                <v-col
                  cols="12"
                  md="6">
                  <v-text-field
                    v-model="careSchedule.wateringInterval"
                    label="Watering Interval (days)"
                    type="number"
                    min="1"
                    :hint="`Water every ${careSchedule.wateringInterval} days`"
                    persistent-hint />
                </v-col>
                <v-col
                  cols="12"
                  md="6">
                  <v-text-field
                    v-model="careSchedule.lastWatered"
                    label="Last Watered"
                    type="date"
                    :hint="lastWateredHint"
                    persistent-hint />
                </v-col>

                <v-col
                  cols="12"
                  md="6">
                  <v-text-field
                    v-model="careSchedule.fertilizingInterval"
                    label="Fertilizing Interval (days)"
                    type="number"
                    min="1"
                    :hint="`Fertilize every ${careSchedule.fertilizingInterval} days`"
                    persistent-hint />
                </v-col>
                <v-col
                  cols="12"
                  md="6">
                  <v-text-field
                    v-model="careSchedule.lastFertilized"
                    label="Last Fertilized"
                    type="date"
                    :hint="lastFertilizedHint"
                    persistent-hint />
                </v-col>

                <v-col cols="12">
                  <v-select
                    v-model="careSchedule.lightNeeds"
                    label="Light Needs"
                    :items="['Low Light', 'Medium Light', 'Bright Indirect Light', 'Full Sun', 'Part Shade']" />
                </v-col>

                <v-col cols="12">
                  <v-btn
                    color="primary"
                    block
                    :loading="savingSchedule"
                    @click="saveCareSchedule">
                    Save Care Schedule
                  </v-btn>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <v-card class="mb-4">
            <v-card-title>Quick Actions</v-card-title>
            <v-card-text>
              <v-row>
                <v-col
                  cols="12"
                  sm="6">
                  <v-btn
                    color="primary"
                    block
                    prepend-icon="mdi-water"
                    :loading="loggingWater"
                    @click="logWatering">
                    Log Watering
                  </v-btn>
                </v-col>
                <v-col
                  cols="12"
                  sm="6">
                  <v-btn
                    color="success"
                    block
                    prepend-icon="mdi-leaf"
                    :loading="loggingFertilizer"
                    @click="logFertilizing">
                    Log Fertilizing
                  </v-btn>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <v-card class="mb-4">
            <v-card-title>
              Care History
              <v-spacer />
              <v-btn
                color="primary"
                variant="text"
                prepend-icon="mdi-plus"
                @click="addLogDialog = true">
                Add Entry
              </v-btn>
            </v-card-title>
            <v-card-text>
              <v-data-table
                :headers="[
                  { title: 'Date', key: 'formattedDate' },
                  { title: 'Action', key: 'action_type' },
                  { title: 'Notes', key: 'notes' },
                ]"
                :items="formattedCareLog"
                :loading="loadingLogs" />
            </v-card-text>
          </v-card>

          <v-card class="mb-4">
            <v-card-title>Upcoming Care Tasks</v-card-title>
            <v-card-text>
              <v-timeline side="end">
                <v-timeline-item
                  v-if="upcomingTasks.watering"
                  :dot-color="getTaskColor(upcomingTasks.watering)"
                  size="small">
                  <template #opposite>
                    <div class="text-caption">
                      {{ formatDate(upcomingTasks.watering.date) }}
                    </div>
                  </template>
                  <div class="d-flex align-center">
                    <v-icon class="me-2"> mdi-water </v-icon>
                    <span>Watering Due</span>
                  </div>
                  <div class="text-caption mt-1">
                    {{ getRelativeDateText(upcomingTasks.watering.date) }}
                  </div>
                </v-timeline-item>

                <v-timeline-item
                  v-if="upcomingTasks.fertilizing"
                  :dot-color="getTaskColor(upcomingTasks.fertilizing)"
                  size="small">
                  <template #opposite>
                    <div class="text-caption">
                      {{ formatDate(upcomingTasks.fertilizing.date) }}
                    </div>
                  </template>
                  <div class="d-flex align-center">
                    <v-icon class="me-2"> mdi-leaf </v-icon>
                    <span>Fertilizing Due</span>
                  </div>
                  <div class="text-caption mt-1">
                    {{ getRelativeDateText(upcomingTasks.fertilizing.date) }}
                  </div>
                </v-timeline-item>
              </v-timeline>
            </v-card-text>
          </v-card>
        </template>
      </v-col>
    </v-row>

    <!-- Add Care Log Dialog -->
    <v-dialog
      v-model="addLogDialog"
      max-width="500px">
      <v-card>
        <v-card-title>Add Care Log Entry</v-card-title>
        <v-card-text>
          <v-row>
            <v-col
              cols="12"
              sm="6">
              <v-select
                v-model="newLog.actionType"
                label="Action Type"
                :items="[
                  { title: 'Watering', value: 'watering' },
                  { title: 'Fertilizing', value: 'fertilizing' },
                  { title: 'Repotting', value: 'repotting' },
                  { title: 'Pruning', value: 'pruning' },
                  { title: 'Pest Treatment', value: 'pest_treatment' },
                  { title: 'Other', value: 'other' },
                ]"
                item-title="title"
                item-value="value"
                required />
            </v-col>
            <v-col
              cols="12"
              sm="6">
              <v-text-field
                v-model="newLog.actionDate"
                label="Date"
                type="date"
                required />
            </v-col>
            <v-col cols="12">
              <v-textarea
                v-model="newLog.notes"
                label="Notes"
                rows="3" />
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="primary"
            variant="text"
            @click="addLogDialog = false">
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            :loading="addingLog"
            @click="addCareLogEntry">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import type { Plant, CareLog } from '~/types/database';

definePageMeta({
  middleware: 'auth',
});

// Types for the component
type CareScheduleForm = {
  wateringInterval: number | string;
  fertilizingInterval: number | string;
  lastWatered: string;
  lastFertilized: string;
  lightNeeds: string;
};

type CareLogForm = {
  actionType: string;
  actionDate: string;
  notes: string;
};

type FormattedCareLog = {
  formattedDate: string;
} & CareLog;

type TaskInfo = {
  date: Date | null;
  overdue: boolean;
};

type UpcomingTasks = {
  watering: TaskInfo | null;
  fertilizing: TaskInfo | null;
};

type PlantWithNextTask = {
  next_task_date?: string;
} & Plant;

const auth = useAuth();
const search = ref<string>('');
const plants = ref<PlantWithNextTask[]>([]);
const loading = ref<boolean>(true);
const selectedPlant = ref<number | null>(null);
const currentPlant = ref<PlantWithNextTask | null>(null);
const careSchedule = ref<CareScheduleForm>({
  wateringInterval: 7,
  fertilizingInterval: 30,
  lastWatered: new Date().toISOString().substring(0, 10),
  lastFertilized: new Date().toISOString().substring(0, 10),
  lightNeeds: 'Medium Light',
});
const savingSchedule = ref<boolean>(false);
const loggingWater = ref<boolean>(false);
const loggingFertilizer = ref<boolean>(false);
const careLog = ref<CareLog[]>([]);
const loadingLogs = ref<boolean>(false);

// Dialog state
const addLogDialog = ref<boolean>(false);
const newLog = ref<CareLogForm>({
  actionType: 'watering',
  actionDate: new Date().toISOString().substring(0, 10),
  notes: '',
});
const addingLog = ref<boolean>(false);

// Computed properties
const filteredPlants = computed<PlantWithNextTask[]>(() => {
  if (!plants.value) return [];

  return plants.value.filter((plant) => {
    // Search filter
    if (
      search.value &&
      !plant.name.toLowerCase().includes(search.value.toLowerCase()) &&
      !plant.common_name?.toLowerCase().includes(search.value.toLowerCase())
    ) {
      return false;
    }
    return true;
  });
});

const formattedCareLog = computed<FormattedCareLog[]>(() => {
  return careLog.value.map((log) => ({
    ...log,
    formattedDate: formatDate(log.action_date),
  }));
});

const upcomingTasks = computed<UpcomingTasks>(() => {
  if (!currentPlant.value) return { watering: null, fertilizing: null };

  const tasks: UpcomingTasks = { watering: null, fertilizing: null };

  // Calculate next watering date
  if (careSchedule.value.lastWatered && careSchedule.value.wateringInterval) {
    const lastWatered = new Date(careSchedule.value.lastWatered);
    const nextWatering = new Date(lastWatered);
    nextWatering.setDate(lastWatered.getDate() + Number(careSchedule.value.wateringInterval));

    tasks.watering = {
      date: nextWatering,
      overdue: nextWatering <= new Date(),
    };
  }

  // Calculate next fertilizing date
  if (careSchedule.value.lastFertilized && careSchedule.value.fertilizingInterval) {
    const lastFertilized = new Date(careSchedule.value.lastFertilized);
    const nextFertilizing = new Date(lastFertilized);
    nextFertilizing.setDate(lastFertilized.getDate() + Number(careSchedule.value.fertilizingInterval));

    tasks.fertilizing = {
      date: nextFertilizing,
      overdue: nextFertilizing <= new Date(),
    };
  }

  return tasks;
});

const lastWateredHint = computed<string>(() => {
  if (!careSchedule.value.lastWatered) return 'No watering recorded';

  const days = daysSince(careSchedule.value.lastWatered);
  return `Last watered ${days} days ago`;
});

const lastFertilizedHint = computed<string>(() => {
  if (!careSchedule.value.lastFertilized) return 'No fertilizing recorded';

  const days = daysSince(careSchedule.value.lastFertilized);
  return `Last fertilized ${days} days ago`;
});

// Helper functions
function formatDate(date: string | Date | null): string {
  if (!date) return 'N/A';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(dateObj);
}

function daysSince(dateString: string): number {
  const date = new Date(dateString);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - date.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function getNextTaskInfo(plant: PlantWithNextTask): { date: Date | null; days: number | null; overdue: boolean } {
  const today = new Date();

  // Default if no schedule
  if (!plant.next_task_date) {
    return { date: null, days: null, overdue: false };
  }

  const nextTaskDate = new Date(plant.next_task_date);
  const diffTime = nextTaskDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return {
    date: nextTaskDate,
    days: diffDays,
    overdue: diffDays <= 0,
  };
}

function getTaskColor(task: TaskInfo | null): string {
  if (!task) return 'grey';

  if (task.overdue) {
    return 'error';
  }

  if (!task.date) return 'grey';

  // Calculate days until due
  const diffDays = Math.ceil((task.date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 2) {
    return 'warning';
  }

  return 'success';
}

function getRelativeDateText(date: Date | null): string {
  if (!date) return '';

  const today = new Date();
  const diffTime = date.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`;
  } else if (diffDays === 0) {
    return 'Due today';
  } else {
    return `Due in ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  }
}

// API functions
async function loadPlants(): Promise<void> {
  loading.value = true;
  try {
    if (!auth.user.value?.id) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(`/api/plants?userId=${auth.user.value.id}`);

    if (!response.ok) {
      throw new Error('Failed to fetch plants');
    }

    plants.value = await response.json();
  } catch (error) {
    console.error('Error loading plants:', error);
  } finally {
    loading.value = false;
  }
}

async function loadPlantCareSchedule(plantId: number): Promise<void> {
  if (!plantId) return;

  try {
    const response = await fetch(`/api/care-schedules/${plantId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch care schedule');
    }

    const schedule = await response.json();

    // Set current plant
    currentPlant.value = plants.value.find((p) => p.id === plantId) || null;

    // Set care schedule
    if (schedule) {
      careSchedule.value = {
        wateringInterval: schedule.watering_interval || 7,
        fertilizingInterval: schedule.fertilizing_interval || 30,
        lastWatered: schedule.last_watered || new Date().toISOString().substring(0, 10),
        lastFertilized: schedule.last_fertilized || new Date().toISOString().substring(0, 10),
        lightNeeds: schedule.light_needs || 'Medium Light',
      };
    } else {
      // Default values
      careSchedule.value = {
        wateringInterval: 7,
        fertilizingInterval: 30,
        lastWatered: new Date().toISOString().substring(0, 10),
        lastFertilized: new Date().toISOString().substring(0, 10),
        lightNeeds: 'Medium Light',
      };
    }

    // Load care logs
    loadCareLogs(plantId);
  } catch (error) {
    console.error('Error loading care schedule:', error);
  }
}

async function loadCareLogs(plantId: number): Promise<void> {
  loadingLogs.value = true;
  try {
    const response = await fetch(`/api/care-logs/${plantId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch care logs');
    }

    careLog.value = await response.json();
  } catch (error) {
    console.error('Error loading care logs:', error);
  } finally {
    loadingLogs.value = false;
  }
}

async function saveCareSchedule(): Promise<void> {
  if (!currentPlant.value) return;

  savingSchedule.value = true;

  try {
    const response = await fetch(`/api/care-schedules/${currentPlant.value.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        wateringInterval: Number(careSchedule.value.wateringInterval) || null,
        fertilizingInterval: Number(careSchedule.value.fertilizingInterval) || null,
        lastWatered: careSchedule.value.lastWatered || null,
        lastFertilized: careSchedule.value.lastFertilized || null,
        lightNeeds: careSchedule.value.lightNeeds || null,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save care schedule');
    }

    // Reload plants list to get updated next_task_date
    await loadPlants();
  } catch (error) {
    console.error('Error saving care schedule:', error);
  } finally {
    savingSchedule.value = false;
  }
}

async function logWatering(): Promise<void> {
  if (!currentPlant.value) return;

  loggingWater.value = true;

  try {
    // Log the watering
    await addCareLog({
      actionType: 'watering',
      actionDate: new Date().toISOString().substring(0, 10),
      notes: 'Regular watering',
    });

    // Update the care schedule
    careSchedule.value.lastWatered = new Date().toISOString().substring(0, 10);
    await saveCareSchedule();
  } catch (error) {
    console.error('Error logging watering:', error);
  } finally {
    loggingWater.value = false;
  }
}

async function logFertilizing(): Promise<void> {
  if (!currentPlant.value) return;

  loggingFertilizer.value = true;

  try {
    // Log the fertilizing
    await addCareLog({
      actionType: 'fertilizing',
      actionDate: new Date().toISOString().substring(0, 10),
      notes: 'Regular fertilizing',
    });

    // Update the care schedule
    careSchedule.value.lastFertilized = new Date().toISOString().substring(0, 10);
    await saveCareSchedule();
  } catch (error) {
    console.error('Error logging fertilizing:', error);
  } finally {
    loggingFertilizer.value = false;
  }
}

async function addCareLog(log: CareLogForm): Promise<void> {
  if (!currentPlant.value) return;

  try {
    const response = await fetch(`/api/care-logs/${currentPlant.value.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        actionType: log.actionType,
        actionDate: log.actionDate,
        notes: log.notes,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to add care log');
    }

    // Reload care logs
    await loadCareLogs(currentPlant.value.id);
  } catch (error) {
    console.error('Error adding care log:', error);
  }
}

async function addCareLogEntry(): Promise<void> {
  if (!currentPlant.value || !newLog.value.actionType || !newLog.value.actionDate) {
    return;
  }

  addingLog.value = true;

  try {
    await addCareLog(newLog.value);

    // Update care schedule if it's a watering or fertilizing entry
    if (newLog.value.actionType === 'watering') {
      careSchedule.value.lastWatered = newLog.value.actionDate;
      await saveCareSchedule();
    } else if (newLog.value.actionType === 'fertilizing') {
      careSchedule.value.lastFertilized = newLog.value.actionDate;
      await saveCareSchedule();
    }

    // Reset and close dialog
    newLog.value = {
      actionType: 'watering',
      actionDate: new Date().toISOString().substring(0, 10),
      notes: '',
    };

    addLogDialog.value = false;
  } catch (error) {
    console.error('Error adding care log entry:', error);
  } finally {
    addingLog.value = false;
  }
}

// Watchers
watch(selectedPlant, (newValue) => {
  if (newValue) {
    loadPlantCareSchedule(newValue);
  } else {
    currentPlant.value = null;
  }
});

// Load data when component mounts
onMounted(() => {
  loadPlants();
});
</script>
