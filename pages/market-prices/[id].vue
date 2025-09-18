<template>
  <div>
    <v-btn
      color="primary"
      variant="outlined"
      prepend-icon="mdi-arrow-left"
      to="/market-prices"
      class="mb-6">
      Back to Price List
    </v-btn>

    <v-row>
      <v-col
        cols="12"
        md="6">
        <v-card>
          <v-card-title class="text-h4">
            {{ plant?.name }}
          </v-card-title>
          <v-card-subtitle>
            {{ plant?.species_id ? `Species ID: ${plant.species_id}` : 'Unknown Species' }}
          </v-card-subtitle>

          <v-img
            :src="'/images/default-plant.jpg'"
            height="200"
            cover />

          <v-card-text>
            <div class="d-flex align-center mb-2">
              <v-icon
                color="success"
                class="me-2">
                mdi-trending-up
              </v-icon>
              <span class="text-subtitle-1"
                >Current Price: <strong>{{ currentPrice }}</strong></span
              >
            </div>
            <div
              v-if="priceDifference !== null"
              class="d-flex align-center">
              <v-icon
                :color="priceDifference >= 0 ? 'success' : 'error'"
                class="me-2">
                {{ priceDifference >= 0 ? 'mdi-arrow-up-bold' : 'mdi-arrow-down-bold' }}
              </v-icon>
              <span class="text-subtitle-1">
                {{ priceDifference >= 0 ? 'Up' : 'Down' }}
                {{ Math.abs(priceDifference).toFixed(2) }} ({{ priceChangePercent }}%) from previous
              </span>
            </div>
          </v-card-text>
        </v-card>

        <v-card class="mt-4">
          <v-card-title>Add New Price</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="6">
                <v-text-field
                  v-model="newPrice.price"
                  label="Price"
                  type="number"
                  prefix="$"
                  step="0.01"
                  min="0"
                  required />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-model="newPrice.dateChecked"
                  label="Date"
                  type="date"
                  required />
              </v-col>
            </v-row>
            <v-btn
              color="primary"
              block
              :loading="saving"
              :disabled="!newPrice.price"
              @click="addNewPrice">
              Add Price Record
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col
        cols="12"
        md="6">
        <v-card>
          <v-card-title>Price History</v-card-title>
          <v-card-text v-if="loading">
            <v-progress-circular
              indeterminate
              class="ma-4" />
          </v-card-text>
          <v-card-text v-else>
            <div
              id="price-chart"
              class="pa-2"
              style="height: 300px" />
          </v-card-text>
        </v-card>

        <v-card class="mt-4">
          <v-card-title>Price Records</v-card-title>
          <v-data-table
            :headers="[
              { title: 'Date', key: 'formattedDate' },
              { title: 'Price', key: 'formattedPrice' },
              { title: 'Actions', key: 'actions', sortable: false },
            ]"
            :items="formattedPriceHistory"
            :loading="loading">
            <template #item.actions="{ item }">
              <v-btn
                color="error"
                variant="text"
                size="small"
                icon
                @click="confirmDeletePrice(item)">
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>

    <!-- Delete Confirmation Dialog -->
    <v-dialog
      v-model="deleteDialog"
      max-width="400px">
      <v-card>
        <v-card-title class="text-h5"> Confirm Delete </v-card-title>
        <v-card-text> Are you sure you want to delete this price record? This action cannot be undone. </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="primary"
            variant="text"
            @click="deleteDialog = false">
            Cancel
          </v-btn>
          <v-btn
            color="error"
            :loading="deleting"
            @click="deletePrice">
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { Chart } from 'chart.js/auto';
import type { Plant, MarketPrice } from '~/types';

definePageMeta({
  middleware: 'auth',
});

const route = useRoute();
const plantId = parseInt(route.params['id'] as string);
const auth = useAuth();

const plant = ref<Plant | null>(null);
const priceHistory = ref<MarketPrice[]>([]);
const loading = ref<boolean>(true);
const saving = ref<boolean>(false);
const deleting = ref<boolean>(false);
const deleteDialog = ref<boolean>(false);
const selectedPrice = ref<MarketPrice | null>(null);
let chart: Chart | null = null;

const newPrice = ref<{
  price: string;
  dateChecked: string;
}>({
  price: '',
  dateChecked: new Date().toISOString().substr(0, 10),
});

// Computed properties
const formattedPriceHistory = computed(() => {
  return priceHistory.value.map((record) => ({
    ...record,
    formattedDate: formatDate(record.dateChecked),
    formattedPrice: `$${record.price.toFixed(2)}`,
  }));
});

const currentPrice = computed(() => {
  const latest = priceHistory.value[0];
  return latest ? `$${latest.price.toFixed(2)}` : 'No data';
});

const priceDifference = computed(() => {
  if (priceHistory.value.length < 2) return null;

  const latest = priceHistory.value[0];
  const previous = priceHistory.value[1];

  if (!latest || !previous) return null;

  return latest.price - previous.price;
});

const priceChangePercent = computed(() => {
  if (!priceDifference.value || priceHistory.value.length < 2) return '0';

  const previous = priceHistory.value[1];
  if (!previous) return '0';

  return ((priceDifference.value / previous.price) * 100).toFixed(1);
});

// Functions
function formatDate(dateString: string | undefined): string {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

async function loadPlantData() {
  loading.value = true;
  try {
    // Load plant data
    const plantResponse = await fetch(`/api/plants/${plantId}?userId=${auth.user.value?.id}`);
    if (!plantResponse.ok) throw new Error('Failed to load plant');
    plant.value = await plantResponse.json();

    // Load price history
    const pricesResponse = await fetch(`/api/market-prices/${plantId}`);
    if (!pricesResponse.ok) throw new Error('Failed to load price history');

    const data = await pricesResponse.json();
    priceHistory.value = (data as MarketPrice[]).sort(
      (a: MarketPrice, b: MarketPrice) =>
        new Date(b.dateChecked || '').getTime() - new Date(a.dateChecked || '').getTime()
    );

    // Render chart after data is loaded
    renderChart();
  } catch (error) {
    console.error('Error loading data:', error);
  } finally {
    loading.value = false;
  }
}

function renderChart() {
  if (chart) {
    chart.destroy();
  }

  if (priceHistory.value.length === 0) return;

  // Sort by date for the chart (oldest to newest)
  const sortedData = [...priceHistory.value].sort(
    (a, b) => new Date(a.dateChecked || '').getTime() - new Date(b.dateChecked || '').getTime()
  );

  const chartData = {
    labels: sortedData.map((record) => formatDate(record.dateChecked)),
    datasets: [
      {
        label: 'Price',
        data: sortedData.map((record) => record.price),
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 2,
        tension: 0.1,
      },
    ],
  };

  const canvas = document.getElementById('price-chart');
  if (!canvas) return;

  chart = new Chart(canvas, {
    type: 'line',
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value: any) => `$${value}`,
          },
        },
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: (context: any) => `Price: $${context.raw.toFixed(2)}`,
          },
        },
      },
    },
  });
}

async function addNewPrice() {
  if (!newPrice.value.price || !newPrice.value.dateChecked) {
    return;
  }

  saving.value = true;
  try {
    const response = await fetch(`/api/market-prices/${plantId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        price: parseFloat(newPrice.value.price),
        dateChecked: newPrice.value.dateChecked,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save price record');
    }

    // Reset the form and reload data
    newPrice.value = {
      price: '',
      dateChecked: new Date().toISOString().substr(0, 10),
    };

    await loadPlantData();
  } catch (error) {
    console.error('Error saving price:', error);
  } finally {
    saving.value = false;
  }
}

function confirmDeletePrice(priceRecord: MarketPrice) {
  selectedPrice.value = priceRecord;
  deleteDialog.value = true;
}

async function deletePrice() {
  if (!selectedPrice.value) return;

  deleting.value = true;
  try {
    const response = await fetch(`/api/market-prices/${plantId}/${selectedPrice.value.id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete price record');
    }

    // Close dialog and reload data
    deleteDialog.value = false;
    selectedPrice.value = null;
    await loadPlantData();
  } catch (error) {
    console.error('Error deleting price record:', error);
  } finally {
    deleting.value = false;
  }
}

onMounted(() => {
  loadPlantData();
});

// Clean up the chart when the component is unmounted
onBeforeUnmount(() => {
  if (chart) {
    chart.destroy();
  }
});
</script>
