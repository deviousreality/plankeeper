<template>
  <div>
    <h1 class="text-h3 mb-6">Plant Taxonomy Manager</h1>

    <v-row>
      <v-col cols="12" md="4">
        <v-card class="mb-4">
          <v-card-title>Species</v-card-title>
          <v-card-text>
            <v-text-field
              v-model="newSpecies"
              label="New Species"
              placeholder="Enter species name"
              append-inner-icon="mdi-plus"
              @click:append-inner="addSpecies"
              @keyup.enter="addSpecies" />

            <v-list lines="two">
              <v-list-item v-for="species in speciesList" :key="species.id" :title="species.name">
                <template #append>
                  <v-btn icon="mdi-pencil" variant="text" size="small" @click="editItem('species', species)" />
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

      <v-col cols="12" md="4">
        <v-card class="mb-4">
          <v-card-title>Genus</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="8">
                <v-text-field
                  v-model="newGenius"
                  label="New Genus"
                  placeholder="Enter genus name"
                  @keyup.enter="addGenius" />
              </v-col>
              <v-col cols="4">
                <v-select v-model="newGeniusSpeciesId" label="Species" :items="speciesOptions" />
              </v-col>
            </v-row>
            <v-btn color="primary" block prepend-icon="mdi-plus" :disabled="!newGenius" @click="addGenius">
              Add Genus
            </v-btn>

            <v-divider class="my-4" />

            <v-list lines="two">
              <v-list-item
                v-for="genius in geniusList"
                :key="genius.id"
                :title="genius.name"
                :subtitle="getSpeciesNameById(genius.speciesId)">
                <template #append>
                  <v-btn icon="mdi-pencil" variant="text" size="small" @click="editItem('genius', genius)" />
                  <v-btn
                    icon="mdi-delete"
                    variant="text"
                    color="error"
                    size="small"
                    @click="confirmDelete('genius', genius)" />
                </template>
              </v-list-item>
              <v-list-item v-if="!geniusList.length">
                <v-list-item-title>No genus entries found</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card class="mb-4">
          <v-card-title>Family</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="newFamily"
                  label="New Family"
                  placeholder="Enter family name"
                  @keyup.enter="addFamily" />
              </v-col>
              <v-col cols="6">
                <v-select v-model="newFamilyGeniusId" label="Genus" :items="geniusOptions" />
              </v-col>
              <v-col cols="6">
                <v-select v-model="newFamilySpeciesId" label="Species" :items="speciesOptions" />
              </v-col>
            </v-row>
            <v-btn color="primary" block prepend-icon="mdi-plus" :disabled="!newFamily" @click="addFamily">
              Add Family
            </v-btn>

            <v-divider class="my-4" />

            <v-list lines="two">
              <v-list-item
                v-for="family in familyList"
                :key="family.id"
                :title="family.name"
                :subtitle="`Genus: ${getGeniusNameById(family.geniusId) || 'None'}, Species: ${
                  getSpeciesNameById(family.speciesId) || 'None'
                }`">
                <template #append>
                  <v-btn icon="mdi-pencil" variant="text" size="small" @click="editItem('family', family)" />
                  <v-btn
                    icon="mdi-delete"
                    variant="text"
                    color="error"
                    size="small"
                    @click="confirmDelete('family', family)" />
                </template>
              </v-list-item>
              <v-list-item v-if="!familyList.length">
                <v-list-item-title>No family entries found</v-list-item-title>
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
          <!-- Simple visualization will go here -->
          <v-alert
            v-if="!familyList.length && !geniusList.length && !speciesList.length"
            color="info"
            text="Add some taxonomy entries to see relationships visualized here" />
          <div v-else class="taxonomy-tree">
            <div v-for="family in familyList" :key="`family-${family.id}`" class="family-node">
              <div class="taxonomy-label family">Family: {{ family.name }}</div>
              <v-divider />
              <div v-if="family.geniusId" class="genius-node">
                <div class="taxonomy-label genius">Genus: {{ getGeniusNameById(family.geniusId) }}</div>
                <v-divider />
                <div v-if="getGeniusByIdWithSpecies(family.geniusId)?.speciesId" class="species-node">
                  <div class="taxonomy-label species">
                    Species:
                    {{ getSpeciesNameById(getGeniusByIdWithSpecies(family.geniusId)?.speciesId) }}
                  </div>
                </div>
              </div>
              <div v-if="family.speciesId && !family.geniusId" class="species-node">
                <div class="taxonomy-label species">Species: {{ getSpeciesNameById(family.speciesId) }}</div>
              </div>
            </div>

            <!-- Show genus not in families -->
            <div v-for="genius in geniusNotInFamily" :key="`genus-${genius.id}`" class="genius-node standalone">
              <div class="taxonomy-label genius">Genus: {{ genius.name }}</div>
              <v-divider v-if="genius.speciesId" />
              <div v-if="genius.speciesId" class="species-node">
                <div class="taxonomy-label species">Species: {{ getSpeciesNameById(genius.speciesId) }}</div>
              </div>
            </div>

            <!-- Show species not in genus or family -->
            <div
              v-for="species in speciesNotInGenusOrFamily"
              :key="`species-${species.id}`"
              class="species-node standalone">
              <div class="taxonomy-label species">Species: {{ species.name }}</div>
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- Edit Dialog -->
    <v-dialog v-model="editDialog" max-width="500">
      <v-card>
        <v-card-title>Edit {{ editingType }}</v-card-title>
        <v-card-text>
          <v-text-field v-model="editingItem.name" :label="`${editingType} Name`" required />

          <v-select
            v-if="editingType === 'genius'"
            v-model="editingItem.speciesId"
            label="Species"
            :items="speciesOptions" />

          <template v-if="editingType === 'family'">
            <v-select v-model="editingItem.geniusId" label="Genus" :items="geniusOptions" />
            <v-select v-model="editingItem.speciesId" label="Species" :items="speciesOptions" />
          </template>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" variant="text" @click="editDialog = false"> Cancel </v-btn>
          <v-btn color="success" @click="saveEdit"> Save </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400">
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
          <v-btn color="primary" variant="text" @click="deleteDialog = false"> Cancel </v-btn>
          <v-btn color="error" @click="deleteItem"> Delete </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import type {Species, Genus, Family} from "~/types/database";

definePageMeta({
  middleware: "auth",
});

const loading = ref<boolean>(true);

// Data
const speciesList = ref<Species[]>([]);
const geniusList = ref<Genus[]>([]);
const familyList = ref<Family[]>([]);

// Form inputs
const newSpecies = ref<string>("");
const newGenius = ref<string>("");
const newGeniusSpeciesId = ref<number | null>(null);
const newFamily = ref<string>("");
const newFamilyGeniusId = ref<number | null>(null);
const newFamilySpeciesId = ref<number | null>(null);

// Edit dialog
const editDialog = ref<boolean>(false);
const editingType = ref<string>("");
const editingItem = ref<any>({});

// Delete dialog
const deleteDialog = ref<boolean>(false);
const deletingType = ref<string>("");
const deletingItem = ref<Species | Genus | Family | null>(null);

// Computed properties
const speciesOptions = computed(() => {
  return speciesList.value.map((species) => ({
    title: species.name,
    value: species.id,
  }));
});

const geniusOptions = computed(() => {
  return geniusList.value.map((genius) => ({
    title: genius.name,
    value: genius.id,
  }));
});

const geniusNotInFamily = computed(() => {
  return geniusList.value.filter((genius) => !familyList.value.some((family) => family.geniusId === genius.id));
});

const speciesNotInGenusOrFamily = computed(() => {
  const speciesInGenius = geniusList.value.filter((g) => g.speciesId).map((g) => g.speciesId);

  const speciesInFamily = familyList.value.filter((f) => f.speciesId).map((f) => f.speciesId);

  const usedSpeciesIds = new Set([...speciesInGenius, ...speciesInFamily]);

  return speciesList.value.filter((species) => !usedSpeciesIds.has(species.id));
});

// Helper functions
function getSpeciesNameById(id: number | null | undefined): string {
  if (!id) return "";
  const species = speciesList.value.find((s) => s.id === id);
  return species ? species.name : "";
}

function getGeniusNameById(id: number | null | undefined): string {
  if (!id) return "";
  const genius = geniusList.value.find((g) => g.id === id);
  return genius ? genius.name : "";
}

function getGeniusByIdWithSpecies(id: number | null | undefined): Genus | null {
  if (!id) return null;
  return geniusList.value.find((g) => g.id === id) || null;
}

function isItemInUse(type: string, item: Species | Genus | Family | null): boolean {
  if (!item) return false;

  switch (type) {
    case "species":
      return (
        geniusList.value.some((g) => g.speciesId === item.id) || familyList.value.some((f) => f.speciesId === item.id)
      );
    case "genius":
      return familyList.value.some((f) => f.geniusId === item.id);
    default:
      return false;
  }
}

// Data loading
async function loadData() {
  loading.value = true;
  try {
    const [speciesRes, geniusRes, familyRes] = await Promise.all([
      fetch("/api/taxonomy/species"),
      fetch("/api/taxonomy/genius"),
      fetch("/api/taxonomy/family"),
    ]);

    speciesList.value = (await speciesRes.json()) as Species[];
    geniusList.value = (await geniusRes.json()) as Genus[];
    familyList.value = (await familyRes.json()) as Family[];
  } catch (error) {
    console.error("Error loading taxonomy data:", error);
  } finally {
    loading.value = false;
  }
}

// CRUD operations
async function addSpecies() {
  if (!newSpecies.value.trim()) return;

  try {
    const response = await fetch("/api/taxonomy/species", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: newSpecies.value.trim(),
      }),
    });

    const result = await response.json();
    if (response.ok) {
      speciesList.value.push(result as Species);
      newSpecies.value = "";
    }
  } catch (error) {
    console.error("Error adding species:", error);
  }
}

async function addGenius() {
  if (!newGenius.value.trim()) return;

  try {
    const response = await fetch("/api/taxonomy/genius", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: newGenius.value.trim(),
        speciesId: newGeniusSpeciesId.value,
      }),
    });

    const result = await response.json();
    if (response.ok) {
      geniusList.value.push(result as Genus);
      newGenius.value = "";
      newGeniusSpeciesId.value = null;
    }
  } catch (error) {
    console.error("Error adding genus:", error);
  }
}

async function addFamily() {
  if (!newFamily.value.trim()) return;

  try {
    const response = await fetch("/api/taxonomy/family", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: newFamily.value.trim(),
        geniusId: newFamilyGeniusId.value,
        speciesId: newFamilySpeciesId.value,
      }),
    });

    const result = await response.json();
    if (response.ok) {
      familyList.value.push(result as Family);
      newFamily.value = "";
      newFamilyGeniusId.value = null;
      newFamilySpeciesId.value = null;
    }
  } catch (error) {
    console.error("Error adding family:", error);
  }
}

function editItem(type: string, item: Species | Genus | Family) {
  editingType.value = type;
  editingItem.value = {...item};
  editDialog.value = true;
}

async function saveEdit() {
  if (!editingItem.value.name.trim()) {
    editDialog.value = false;
    return;
  }

  try {
    const response = await fetch(`/api/taxonomy/${editingType.value}/${editingItem.value.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(editingItem.value),
    });

    if (response.ok) {
      // Update local data
      if (editingType.value === "species") {
        const index = speciesList.value.findIndex((s) => s.id === editingItem.value.id);
        if (index >= 0) speciesList.value[index] = {...editingItem.value};
      } else if (editingType.value === "genius") {
        const index = geniusList.value.findIndex((g) => g.id === editingItem.value.id);
        if (index >= 0) geniusList.value[index] = {...editingItem.value};
      } else if (editingType.value === "family") {
        const index = familyList.value.findIndex((f) => f.id === editingItem.value.id);
        if (index >= 0) familyList.value[index] = {...editingItem.value};
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
      method: "DELETE",
    });

    if (response.ok) {
      // Update local data
      if (deletingType.value === "species" && deletingItem.value) {
        speciesList.value = speciesList.value.filter((s) => s.id !== deletingItem.value!.id);
      } else if (deletingType.value === "genius" && deletingItem.value) {
        geniusList.value = geniusList.value.filter((g) => g.id !== deletingItem.value!.id);
      } else if (deletingType.value === "family" && deletingItem.value) {
        familyList.value = familyList.value.filter((f) => f.id !== deletingItem.value!.id);
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
