<!-- pages/market-prices/add.vue -->
<template>
  <div>
    <div class="d-flex justify-space-between align-center mb-6">
      <h1 class="text-h3">Add Market Price</h1>
      <v-btn
        color="primary"
        variant="outlined"
        prepend-icon="mdi-arrow-left"
        to="/market-prices">
        Back to Price List
      </v-btn>
    </div>

    <v-form
      ref="form"
      @submit.prevent="savePrice">
      <v-card>
        <v-card-text>
          <v-row>
            <v-col
              cols="12"
              md="6">
              <h2 class="text-h5 mb-4">Price Details</h2>

              <v-autocomplete
                v-model="marketPrice.plantId"
                autocomplete="off"
                label="Plant*"
                hint="Select a plant to add a price for"
                :items="plantOptions"
                item-title="title"
                item-value="id"
                :rules="[(v) => !!v || 'Plant is required']"
                required
                class="mb-3">
                <template #append>
                  <v-btn 
                    variant="text" 
                    icon 
                    @click="showTaxonomyDialog = true">
                    <v-icon>mdi-leaf</v-icon>
                  </v-btn>
                </template>
              </v-autocomplete>

              <v-text-field
                v-model="marketPrice.price"
                type="number"
                step="0.01"
                label="Price*"
                prefix="$"
                :rules="[(v) => !!v || 'Price is required', (v) => v > 0 || 'Price must be greater than 0']"
                required
                class="mb-3" />

              <v-text-field
                v-model="marketPrice.location"
                label="Location"
                hint="Where did you see this price? (e.g., Store name, Online marketplace)"
                class="mb-3" />

              <v-text-field
                v-model="marketPrice.size"
                label="Size"
                hint="Size of the plant (e.g., 4-inch pot, 1 gallon)"
                class="mb-3" />

              <v-dialog
                v-model="dateDialog"
                width="290px">
                <template #activator="{ props }">
                  <v-text-field
                    v-model="formattedDate"
                    label="Date Checked*"
                    readonly
                    :rules="[(v) => !!marketPrice.dateChecked || 'Date is required']"
                    required
                    prepend-icon="mdi-calendar"
                    v-bind="props"
                    @click="dateDialog = true" />
                </template>
                <v-date-picker
                  v-model="marketPrice.dateChecked"
                  scrollable>
                  <v-spacer />
                  <v-btn
                    variant="text"
                    color="primary"
                    @click="dateDialog = false">
                    Cancel
                  </v-btn>
                  <v-btn
                    variant="text"
                    color="primary"
                    @click="confirmDate">
                    OK
                  </v-btn>
                </v-date-picker>
              </v-dialog>
            </v-col>

            <v-col
              cols="12"
              md="6">
              <div
                v-if="selectedPlant"
                class="mb-4">
                <h3 class="text-h6 mb-2">Selected Plant</h3>
                <v-card>
                  <v-img
                    :src="selectedPlant.image_url || '/images/default-plant.jpg'"
                    height="200"
                    cover
                    class="align-end" />
                  <v-card-title>{{ selectedPlant.name }}</v-card-title>
                  <v-card-subtitle>
                    {{ selectedPlant.species_id ? `Species ID: ${selectedPlant.species_id}` : 'Unknown Species' }}
                  </v-card-subtitle>
                </v-card>
              </div>
              <div v-else>
                <v-alert
                  type="info"
                  variant="tonal"
                  border="start"
                  class="mb-4">
                  <div class="d-flex flex-column align-center pa-4">
                    <v-icon
                      size="48"
                      class="mb-2">
                      mdi-flower
                    </v-icon>
                    <div class="text-body-1">Select a plant to see its details</div>
                  </div>
                </v-alert>
              </div>

              <div
                v-if="selectedPlant && priceHistory.length > 0"
                class="mt-4">
                <h3 class="text-h6 mb-2">Previous Prices</h3>
                <v-list lines="two">
                  <v-list-item
                    v-for="(price, index) in priceHistory"
                    :key="index">
                    <template #prepend>
                      <v-icon :color="getPriceChangeColor(price, index)">
                        {{ getPriceChangeIcon(price, index) }}
                      </v-icon>
                    </template>
                    <v-list-item-title>
                      ${{ price.price.toFixed(2) }}
                      <span
                        v-if="price.location"
                        class="text-caption text-grey"
                        >({{ price.location }})</span
                      >
                    </v-list-item-title>
                    <v-list-item-subtitle>
                      {{ formatDate(price.dateChecked) }}
                      <span
                        v-if="price.size"
                        class="text-caption ml-2"
                        >Size: {{ price.size }}</span
                      >
                    </v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </div>
            </v-col>
          </v-row>
        </v-card-text>

        <v-divider />

        <v-card-actions>
          <v-spacer />
          <v-btn
            color="primary"
            type="submit"
            :loading="loading">
            Save Price Record
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-form>
    
    <!-- Taxonomy Search Dialog -->
    <v-dialog
      v-model="showTaxonomyDialog"
      max-width="600px">
      <v-card>
        <v-card-title>
          Find Plant by Taxonomy
          <v-spacer />
          <v-btn
            icon
            variant="text"
            @click="showTaxonomyDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-text-field
            v-model="taxonomySearch"
            label="Search taxonomy (family, genus, species)"
            variant="outlined"
            append-icon="mdi-magnify"
            @update:model-value="searchTaxonomy"
            @click:append="searchTaxonomy(taxonomySearch)" />

          <v-list>
            <v-list-item
              v-for="(item, index) in taxonomyOptions"
              :key="index"
              :title="item.title"
              @click="selectTaxonomyItem(item)">
              <template #prepend>
                <v-icon>
                  {{ 
                    item.type === 'family' 
                      ? 'mdi-flower' 
                      : item.type === 'genus' 
                        ? 'mdi-sprout'
                        : 'mdi-leaf'
                  }}
                </v-icon>
              </template>
            </v-list-item>
            
            <v-list-item v-if="taxonomyOptions.length === 0 && taxonomySearch.length >= 2">
              <v-list-item-title>No results found</v-list-item-title>
            </v-list-item>
            
            <v-list-item v-if="taxonomySearch.length < 2">
              <v-list-item-title>Type at least 2 characters to search</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { useAuth } from '~/composables/useAuth';
import type { MarketPrice } from '~/types/index';
import type { Plant } from '~/types/database';
import { debounce } from 'lodash-es';

definePageMeta({
  middleware: 'auth',
});

const router = useRouter();
const auth = useAuth();
const userId = computed(() => auth.user.value?.id);

// Form and data
const form = ref();
const loading = ref(false);
const dateDialog = ref(false);
const showTaxonomyDialog = ref(false);
const plantOptions = ref<Array<{ title: string; id: number }>>([]);
const taxonomyOptions = ref<Array<{ 
  title: string; 
  id: number; 
  type: 'family' | 'genus' | 'species';
  family_name?: string;
  genus_name?: string;
}>>([]);
const selectedPlant = ref<Plant | null>(null);
const priceHistory = ref<MarketPrice[]>([]);
const taxonomySearch = ref('');

// Initialize market price data
const marketPrice = reactive({
  plantId: null as number | null,
  price: null as number | null,
  dateChecked: new Date().toISOString().split('T')[0],
  location: '',
  size: '',
});

// Computed property for formatted date
const formattedDate = computed(() => {
  if (!marketPrice.dateChecked) return '';
  return new Date(marketPrice.dateChecked).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
});

// Search taxonomy database
const searchTaxonomy = async (search: string) => {
  if (!search || search.length < 2) {
    taxonomyOptions.value = [];
    return;
  }
  
  try {
    const results = await $fetch(`/api/taxonomy/search?q=${encodeURIComponent(search)}`);
    taxonomyOptions.value = results.map((item: any) => ({
      title: formatTaxonomyTitle(item),
      id: item.id,
      type: item.type,
      family_name: item.family_name,
      genus_name: item.genus_name,
    }));
  } catch (error) {
    console.error('Error searching taxonomy:', error);
    taxonomyOptions.value = [];
  }
};

// Format taxonomy result for display
const formatTaxonomyTitle = (item: any) => {
  if (item.type === 'family') {
    return `Family: ${item.name}`;
  } else if (item.type === 'genus') {
    return `Genus: ${item.name} (Family: ${item.family_name})`;
  } else if (item.type === 'species') {
    return `Species: ${item.name} (${item.genus_name} family: ${item.family_name})`;
  }
  return item.name;
};

// Load plants for dropdown
const loadPlants = async () => {
  if (!userId.value) {
    console.error('User ID not available');
    return;
  }

  try {
    loading.value = true;
    const plants = await $fetch<Plant[]>(`/api/plants?userId=${userId.value}`);
    plantOptions.value = plants.map((plant) => ({
      title: plant.name,
      id: plant.id,
    }));
  } catch (error) {
    console.error('Error fetching plants:', error);
  } finally {
    loading.value = false;
  }
};

// Watch for taxonomy search changes and search after a delay
watch(
  () => taxonomySearch.value,
  debounce(async (newSearch: string) => {
    if (newSearch && newSearch.length >= 2) {
      await searchTaxonomy(newSearch);
    }
  }, 300)
);

// Watch for plant selection to load details and price history
watch(
  () => marketPrice.plantId,
  async (newPlantId) => {
    if (!newPlantId) {
      selectedPlant.value = null;
      priceHistory.value = [];
      return;
    }

    try {
      loading.value = true;
      // Load plant details
      selectedPlant.value = await $fetch(`/api/plants/${newPlantId}`);
      // Load price history
      priceHistory.value = await $fetch(`/api/market-prices/${newPlantId}`);
      priceHistory.value.sort((a, b) => new Date(b.dateChecked).getTime() - new Date(a.dateChecked).getTime());
    } catch (error) {
      console.error('Error fetching plant details or price history:', error);
    } finally {
      loading.value = false;
    }
  }
);

// Save the price record
const savePrice = async () => {
  // Form validation
  const { valid } = await form.value.validate();

  if (!valid) return;

  try {
    loading.value = true;

    const payload = {
      price: parseFloat(marketPrice.price as unknown as string),
      dateChecked: marketPrice.dateChecked,
      location: marketPrice.location || null,
      size: marketPrice.size || null,
    };

    await $fetch(`/api/market-prices/${marketPrice.plantId}`, {
      method: 'POST',
      body: payload,
    });

    // Success notification
    // You can implement your notification system here

    // Redirect to the price history page
    router.push(`/market-prices/${marketPrice.plantId}`);
  } catch (error) {
    console.error('Error saving price record:', error);
    // Error notification
    // You can implement your notification system here
  } finally {
    loading.value = false;
  }
};

// Helper functions
const confirmDate = () => {
  dateDialog.value = false;
};

// Handle selecting an item from taxonomy search
const selectTaxonomyItem = async (item: { 
  id: number; 
  type: 'family' | 'genus' | 'species';
  title: string;
}) => {
  try {
    loading.value = true;
    
    // Close the dialog
    showTaxonomyDialog.value = false;
    
    // Based on the selected type, get plants that match the taxonomy
    const taxonomyId = item.id;
    const taxonomyType = item.type;
    
    let response: Plant[];
    
    if (!userId.value) {
      throw new Error('User ID not available');
    }
    
    // Filter plants by taxonomy item
    if (taxonomyType === 'species') {
      response = await $fetch<Plant[]>(`/api/plants?userId=${userId.value}&speciesId=${taxonomyId}`);
    } else if (taxonomyType === 'genus') {
      response = await $fetch<Plant[]>(`/api/plants?userId=${userId.value}&genusId=${taxonomyId}`);
    } else { // family
      response = await $fetch<Plant[]>(`/api/plants?userId=${userId.value}&familyId=${taxonomyId}`);
    }
    
    // Update the plant options
    plantOptions.value = response.map(plant => ({
      title: plant.name,
      id: plant.id
    }));
    
    // If only one plant matches, select it automatically
    if (plantOptions.value.length === 1) {
      marketPrice.plantId = plantOptions.value[0].id;
    }
    
  } catch (error) {
    console.error('Error filtering plants by taxonomy:', error);
  } finally {
    loading.value = false;
  }
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const getPriceChangeIcon = (price: MarketPrice, index: number): string => {
  if (index === priceHistory.value.length - 1) return 'mdi-currency-usd';

  const nextPrice = priceHistory.value[index + 1];
  if (price.price > nextPrice.price) {
    return 'mdi-arrow-up-bold';
  } else if (price.price < nextPrice.price) {
    return 'mdi-arrow-down-bold';
  } else {
    return 'mdi-minus';
  }
};

const getPriceChangeColor = (price: MarketPrice, index: number): string => {
  if (index === priceHistory.value.length - 1) return 'primary';

  const nextPrice = priceHistory.value[index + 1];
  if (price.price > nextPrice.price) {
    return 'success';
  } else if (price.price < nextPrice.price) {
    return 'error';
  } else {
    return 'grey';
  }
};

// Load plants on component mount
onMounted(() => {
  // Make sure we have a userId before loading plants
  if (userId.value) {
    loadPlants();
  } else {
    // If user is not authenticated, redirect to login
    console.warn('User not authenticated, redirecting to login');
    router.push('/login');
  }
});
</script>
