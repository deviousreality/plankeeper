<template>
  <div>
    <h1 class="text-h3 mb-6">Market Price Tracker</h1>

    <v-card class="mb-6">
      <v-card-text>
        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          label="Search plants"
          clearable
          hide-details
          class="mb-3" />
      </v-card-text>
    </v-card>

    <v-data-table
      :headers="headers"
      :items="filteredPlants"
      :loading="loading"
      class="elevation-1"
      :search="search">
      <template #item.priceHistory="{ item }">
        <v-btn
          color="primary"
          size="small"
          variant="text"
          :to="`/market-prices/${item.id}`"
          prepend-icon="mdi-chart-line">
          View History
        </v-btn>
      </template>

      <template #item.actions="{ item }">
        <v-btn
          color="primary"
          size="small"
          variant="text"
          prepend-icon="mdi-currency-usd"
          @click="openPriceDialog(item)">
          Add Price
        </v-btn>
      </template>

      <template #bottom>
        <div class="text-center pt-2 pb-2">
          <v-btn
            color="primary"
            prepend-icon="mdi-refresh"
            @click="loadPlants">
            Refresh
          </v-btn>
        </div>
      </template>
    </v-data-table>

    <!-- Add Price Dialog -->
    <v-dialog
      v-model="dialog"
      max-width="500px">
      <v-card>
        <v-card-title class="text-h5"> Add Price Record </v-card-title>
        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12">
                <h3 class="text-h6">
                  {{ selectedPlant?.name }}
                </h3>
                <p class="text-subtitle-1">
                  {{ selectedPlant?.common_name || 'Unknown Species' }}
                </p>
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="priceRecord.price"
                  label="Price"
                  type="number"
                  prefix="$"
                  step="0.01"
                  min="0"
                  required />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="priceRecord.dateChecked"
                  label="Date Checked"
                  type="date"
                  required />
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="error"
            variant="text"
            @click="closeDialog">
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            :loading="saving"
            @click="savePriceRecord">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import type { Plant, MarketPrice } from '~/types/database';

definePageMeta({
  middleware: 'auth',
});

// Types for the component
interface PlantWithPrice extends Plant {
  latestPrice?: MarketPrice;
}

interface PlantDisplay extends Plant {
  latestPrice: string;
  lastPriceUpdate: string;
}

interface PriceRecordForm {
  price: number | string;
  dateChecked: string;
}

const auth = useAuth();
const loading = ref<boolean>(true);
const saving = ref<boolean>(false);
const plants = ref<PlantWithPrice[]>([]);
const search = ref<string>('');
const dialog = ref<boolean>(false);
const selectedPlant = ref<PlantDisplay | null>(null);

const priceRecord = ref<PriceRecordForm>({
  price: 0,
  dateChecked: new Date().toISOString().substr(0, 10),
});

const headers = [
  { title: 'Name', key: 'name' },
  { title: 'Species', key: 'common_name' },
  { title: 'Latest Price', key: 'latestPrice' },
  { title: 'Last Updated', key: 'lastPriceUpdate' },
  { title: 'Price History', key: 'priceHistory' },
  { title: 'Actions', key: 'actions', sortable: false },
];

const filteredPlants = computed<PlantDisplay[]>(() => {
  if (!plants.value) return [];

  return plants.value.map((plant) => {
    const latest = plant.latestPrice ? `$${plant.latestPrice.price.toFixed(2)}` : 'No data';

    const lastUpdate = plant.latestPrice ? formatDate(plant.latestPrice.date_checked) : 'Never';

    return {
      ...plant,
      latestPrice: latest,
      lastPriceUpdate: lastUpdate,
    } as PlantDisplay;
  });
});

function formatDate(dateString: string): string {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

async function loadPlants(): Promise<void> {
  loading.value = true;
  try {
    if (!auth.user.value?.id) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(`/api/market-prices?userId=${auth.user.value.id}`);

    if (!response.ok) {
      throw new Error('Failed to fetch plants');
    }

    const data = await response.json();
    plants.value = data;
  } catch (err) {
    console.error('Error loading plants:', err);
  } finally {
    loading.value = false;
  }
}

function openPriceDialog(plant: PlantDisplay): void {
  selectedPlant.value = plant;
  priceRecord.value = {
    price: 0,
    dateChecked: new Date().toISOString().substr(0, 10),
  };
  dialog.value = true;
}

function closeDialog(): void {
  dialog.value = false;
  selectedPlant.value = null;
}

async function savePriceRecord(): Promise<void> {
  if (!selectedPlant.value || !priceRecord.value.price) {
    return;
  }

  saving.value = true;
  try {
    const response = await fetch(`/api/market-prices/${selectedPlant.value.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        price: Number(priceRecord.value.price),
        dateChecked: priceRecord.value.dateChecked,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save price record');
    }

    // Refresh the plant list to show the new price
    await loadPlants();
    closeDialog();
  } catch (err) {
    console.error('Error saving price record:', err);
  } finally {
    saving.value = false;
  }
}

// Load plants when the component is mounted
onMounted(() => {
  loadPlants();
});
</script>
