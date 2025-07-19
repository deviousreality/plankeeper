<template>
  <div>
    <h1 class="text-h3 mb-6">Plant Taxonomy Manager</h1>

    <v-row>
      <v-col
        cols="12"
        md="4">
        <v-card class="mb-4">
          <v-card-title>Families</v-card-title>
          <v-card-text>
            <v-text-field
              v-model="newFamily"
              label="New Family"
              placeholder="Enter family name"
              append-inner-icon="mdi-plus"
              @click:append-inner="addFamily"
              @keyup.enter="addFamily" />

            <v-list lines="two">
              <v-list-item
                v-for="family in familyList"
                :key="family.id"
                :title="family.name">
                <template #append>
                  <v-btn
                    icon="mdi-pencil"
                    variant="text"
                    size="small"
                    @click="editItem('family', family)" />
                  <v-btn
                    icon="mdi-delete"
                    variant="text"
                    color="error"
                    size="small"
                    @click="confirmDelete('family', family)" />
                </template>
              </v-list-item>
              <v-list-item v-if="!familyList.length">
                <v-list-item-title>No families found</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col
        cols="12"
        md="4">
        <v-card class="mb-4">
          <v-card-title>Genera</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="8">
                <v-text-field
                  v-model="newGenus"
                  label="New Genus"
                  placeholder="Enter genus name"
                  @keyup.enter="addGenus" />
              </v-col>
              <v-col cols="4">
                <v-select
                  v-model="newGenusFamilyId"
                  label="Family"
                  :items="familyOptions" />
              </v-col>
            </v-row>
            <v-btn
              color="primary"
              block
              prepend-icon="mdi-plus"
              :disabled="!newGenus || !newGenusFamilyId"
              @click="addGenus">
              Add Genus
            </v-btn>

            <v-divider class="my-4" />

            <v-list lines="two">
              <v-list-item
                v-for="genus in genusList"
                :key="genus.id"
                :title="genus.name"
                :subtitle="getFamilyNameById(genus.familyId)">
                <template #append>
                  <v-btn
                    icon="mdi-pencil"
                    variant="text"
                    size="small"
                    @click="editItem('genus', genus)" />
                  <v-btn
                    icon="mdi-delete"
                    variant="text"
                    color="error"
                    size="small"
                    @click="confirmDelete('genus', genus)" />
                </template>
              </v-list-item>
              <v-list-item v-if="!genusList.length">
                <v-list-item-title>No genera found</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col
        cols="12"
        md="4">
        <v-card class="mb-4">
          <v-card-title>Species</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="8">
                <v-text-field
                  v-model="newSpecies"
                  label="New Species"
                  placeholder="Enter species name"
                  @keyup.enter="addSpecies" />
              </v-col>
              <v-col cols="4">
                <v-select
                  v-model="newSpeciesGenusId"
                  label="Genus"
                  :items="genusOptions" />
              </v-col>
            </v-row>
            <v-btn
              color="primary"
              block
              prepend-icon="mdi-plus"
              :disabled="!newSpecies || !newSpeciesGenusId"
              @click="addSpecies">
              Add Species
            </v-btn>

            <v-divider class="my-4" />

            <v-list lines="two">
              <v-list-item
                v-for="species in speciesList"
                :key="species.id"
                :title="species.name"
                :subtitle="getGenusNameById(species.genusId)">
                <template #append>
                  <v-btn
                    icon="mdi-pencil"
                    variant="text"
                    size="small"
                    @click="editItem('species', species)" />
                  <v-btn
                    icon="mdi-delete"
                    variant="text"
                    color="error"
                    size="small"
                    @click="confirmDelete('species', species)" />
                </template>
              </v-list-item>
              <v-list-item v-if="!speciesList.length">
                <v-list-item-title>No species found</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Relationship Diagram Card -->
    <v-card class="mt-4">
      <v-card-title>Taxonomy Relationships</v-card-title>
      <v-card-text>
        <div class="taxonomy-diagram">
          <v-alert
            v-if="!familyList.length && !genusList.length && !speciesList.length"
            color="info"
            text="Add some taxonomy entries to see relationships visualized here" />
          <div
            v-else
            class="taxonomy-tree">
            <div
              v-for="family in familyList"
              :key="`family-${family.id}`"
              class="family-node">
              <div class="taxonomy-label family">Family: {{ family.name }}</div>
              <div
                v-for="genus in getGeneraByFamily(family.id)"
                :key="`genus-${genus.id}`"
                class="genus-node">
                <div class="taxonomy-label genus">Genus: {{ genus.name }}</div>
                <div
                  v-for="species in getSpeciesByGenus(genus.id)"
                  :key="`species-${species.id}`"
                  class="species-node">
                  <div class="taxonomy-label species">Species: {{ species.name }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- Edit Dialog -->
    <v-dialog
      v-model="editDialog"
      max-width="500">
      <v-card>
        <v-card-title>Edit {{ editingType }}</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="editingItem['name']"
            :label="`${editingType} Name`"
            required />

          <v-select
            v-if="editingType === 'genus'"
            v-model="editingItem['familyId']"
            label="Family"
            :items="familyOptions" />

          <v-select
            v-if="editingType === 'species'"
            v-model="editingItem['genusId']"
            label="Genus"
            :items="genusOptions" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="primary"
            variant="text"
            @click="editDialog = false">
            Cancel
          </v-btn>
          <v-btn
            color="success"
            @click="saveEdit">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog
      v-model="deleteDialog"
      max-width="400">
      <v-card>
        <v-card-title>Confirm Delete</v-card-title>
        <v-card-text>
          Are you sure you want to delete this {{ deletingType }}?
          <strong class="d-block mt-2">{{ deletingItem?.name }}</strong>
          <v-alert
            v-if="isItemInUse(deletingType, deletingItem)"
            type="warning"
            class="mt-3"
            text="Warning: This item is referenced by other taxonomy entries. Deleting it may affect those relationships." />
        </v-card-text>
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
            @click="deleteItem">
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import type { Species, Genus, Family } from '~/types/database';

definePageMeta({
  middleware: 'auth',
});

const loading = ref<boolean>(true);

// Data
const familyList = ref<Family[]>([]);
const genusList = ref<Genus[]>([]);
const speciesList = ref<Species[]>([]);

// Form inputs
const newFamily = ref<string>('');
const newGenus = ref<string>('');
const newGenusFamilyId = ref<number | null>(null);
const newSpecies = ref<string>('');
const newSpeciesGenusId = ref<number | null>(null);

// Edit dialog
const editDialog = ref<boolean>(false);
const editingType = ref<string>('');
const editingItem = ref<Record<string, unknown>>({});

// Delete dialog
const deleteDialog = ref<boolean>(false);
const deletingType = ref<string>('');
const deletingItem = ref<Species | Genus | Family | null>(null);

// Computed properties
const familyOptions = computed(() => {
  return familyList.value.map((family) => ({
    title: family.name,
    value: family.id,
  }));
});

const genusOptions = computed(() => {
  return genusList.value.map((genus) => ({
    title: genus.name,
    value: genus.id,
  }));
});

// Helper functions
function getFamilyNameById(id: number | null | undefined): string {
  if (!id) return '';
  const family = familyList.value.find((f) => f.id === id);
  return family ? family.name : '';
}

function getGenusNameById(id: number | null | undefined): string {
  if (!id) return '';
  const genus = genusList.value.find((g) => g.id === id);
  return genus ? genus.name : '';
}

function getGeneraByFamily(familyId: number): Genus[] {
  return genusList.value.filter((genus) => genus.familyId === familyId);
}

function getSpeciesByGenus(genusId: number): Species[] {
  return speciesList.value.filter((species) => species.genusId === genusId);
}

function isItemInUse(type: string, item: Species | Genus | Family | null): boolean {
  if (!item) return false;

  switch (type) {
    case 'family':
      return genusList.value.some((g) => g.familyId === item.id);
    case 'genus':
      return speciesList.value.some((s) => s.genusId === item.id);
    case 'species':
      return false; // Species is the bottom of the hierarchy
    default:
      return false;
  }
}

// Data loading
async function loadData() {
  loading.value = true;
  try {
    const [familyRes, genusRes, speciesRes] = await Promise.all([
      fetch('/api/taxonomy/family'),
      fetch('/api/taxonomy/genus'),
      fetch('/api/taxonomy/species'),
    ]);

    familyList.value = (await familyRes.json()) as Family[];
    genusList.value = (await genusRes.json()) as Genus[];
    speciesList.value = (await speciesRes.json()) as Species[];
  } catch (error) {
    console.error('Error loading taxonomy data:', error);
  } finally {
    loading.value = false;
  }
}

// CRUD operations
async function addFamily() {
  if (!newFamily.value.trim()) return;

  try {
    const response = await fetch('/api/taxonomy/family', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: newFamily.value.trim(),
      }),
    });

    const result = await response.json();
    if (response.ok) {
      familyList.value.push(result as Family);
      newFamily.value = '';
    }
  } catch (error) {
    console.error('Error adding family:', error);
  }
}

async function addGenus() {
  if (!newGenus.value.trim() || !newGenusFamilyId.value) return;

  try {
    const response = await fetch('/api/taxonomy/genus', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: newGenus.value.trim(),
        familyId: newGenusFamilyId.value,
      }),
    });

    const result = await response.json();
    if (response.ok) {
      genusList.value.push(result as Genus);
      newGenus.value = '';
      newGenusFamilyId.value = null;
    }
  } catch (error) {
    console.error('Error adding genus:', error);
  }
}

async function addSpecies() {
  if (!newSpecies.value.trim() || !newSpeciesGenusId.value) return;

  try {
    const response = await fetch('/api/taxonomy/species', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: newSpecies.value.trim(),
        genusId: newSpeciesGenusId.value,
      }),
    });

    const result = await response.json();
    if (response.ok) {
      speciesList.value.push(result as Species);
      newSpecies.value = '';
      newSpeciesGenusId.value = null;
    }
  } catch (error) {
    console.error('Error adding species:', error);
  }
}

function editItem(type: string, item: Species | Genus | Family) {
  editingType.value = type;
  editingItem.value = { ...item };
  editDialog.value = true;
}

async function saveEdit() {
  const name = editingItem.value['name'];
  if (!name || typeof name !== 'string' || !name.trim()) {
    editDialog.value = false;
    return;
  }

  try {
    const response = await fetch(`/api/taxonomy/${editingType.value}/${editingItem.value['id']}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(editingItem.value),
    });

    if (response.ok) {
      const result = await response.json();
      // Update local data
      if (editingType.value === 'family') {
        const index = familyList.value.findIndex((f) => f.id === editingItem.value['id']);
        if (index >= 0) familyList.value[index] = result as Family;
      } else if (editingType.value === 'genus') {
        const index = genusList.value.findIndex((g) => g.id === editingItem.value['id']);
        if (index >= 0) genusList.value[index] = result as Genus;
      } else if (editingType.value === 'species') {
        const index = speciesList.value.findIndex((s) => s.id === editingItem.value['id']);
        if (index >= 0) speciesList.value[index] = result as Species;
      }
    }
  } catch (error) {
    console.error(`Error updating ${editingType.value}:`, error);
  } finally {
    editDialog.value = false;
  }
}

function confirmDelete(type: string, item: Species | Genus | Family) {
  deletingType.value = type;
  deletingItem.value = item;
  deleteDialog.value = true;
}

async function deleteItem() {
  if (!deletingItem.value) {
    deleteDialog.value = false;
    return;
  }

  try {
    const response = await fetch(`/api/taxonomy/${deletingType.value}/${deletingItem.value.id}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      // Update local data
      if (deletingType.value === 'family' && deletingItem.value) {
        familyList.value = familyList.value.filter((f) => f.id !== deletingItem.value!.id);
      } else if (deletingType.value === 'genus' && deletingItem.value) {
        genusList.value = genusList.value.filter((g) => g.id !== deletingItem.value!.id);
      } else if (deletingType.value === 'species' && deletingItem.value) {
        speciesList.value = speciesList.value.filter((s) => s.id !== deletingItem.value!.id);
      }
    }
  } catch (error) {
    console.error(`Error deleting ${deletingType.value}:`, error);
  } finally {
    deleteDialog.value = false;
  }
}

// Load data when component mounts
onMounted(() => {
  loadData();
});
</script>

<style scoped>
.taxonomy-diagram {
  min-height: 200px;
  padding: 16px;
}

.taxonomy-tree {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.family-node,
.genius-node,
.species-node {
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 8px;
}

.family-node {
  background-color: rgba(var(--v-theme-primary), 0.1);
  border: 1px solid rgba(var(--v-theme-primary), 0.3);
}

.genius-node {
  background-color: rgba(var(--v-theme-secondary), 0.1);
  border: 1px solid rgba(var(--v-theme-secondary), 0.3);
  margin-left: 16px;
}

.species-node {
  background-color: rgba(var(--v-theme-success), 0.1);
  border: 1px solid rgba(var(--v-theme-success), 0.3);
  margin-left: 16px;
}

.standalone {
  margin-left: 0;
}

.taxonomy-label {
  font-weight: 500;
  padding: 4px;
}

.family {
  color: var(--v-theme-primary);
}

.genius {
  color: var(--v-theme-secondary);
}

.species {
  color: var(--v-theme-success);
}
</style>
