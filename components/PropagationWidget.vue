<!-- components/PropagationWidget.vue -->
<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <v-icon class="mr-2">mdi-sprout</v-icon>
      Propagation History
      <v-spacer></v-spacer>
      <v-btn
        color="primary"
        size="small"
        variant="outlined"
        @click="openNewPropagationDialog"
        v-if="plantId"
      >
        <v-icon size="small">mdi-plus</v-icon>
        New Propagation
      </v-btn>
    </v-card-title>

    <v-card-text>
      <div v-if="loading" class="text-center">
        <v-progress-circular indeterminate size="24"></v-progress-circular>
        <div class="mt-2">Loading propagation records...</div>
      </div>

      <div v-else-if="!propagations.length" class="text-center py-4">
        <v-icon size="40" color="grey" class="mb-2">mdi-sprout-outline</v-icon>
        <div>No propagation records found</div>
        <v-btn
          v-if="plantId"
          color="primary"
          class="mt-3"
          variant="text"
          @click="openNewPropagationDialog"
        >
          Add Propagation Record
        </v-btn>
      </div>

      <v-timeline v-else density="compact" align="start">
        <v-timeline-item
          v-for="prop in propagations"
          :key="prop.id"
          :dot-color="getPropStatusColor(prop)"
          :icon="getPropTypeIcon(prop.propType)"
          size="small"
        >
          <div class="d-flex justify-space-between align-center">
            <div>
              <div class="text-subtitle-2 font-weight-medium">
                {{ getPropTypeName(prop.propType) }}
              </div>
              <div class="text-caption">
                {{ formatDate(prop.propDate) }}
              </div>
            </div>
            <div>
              <v-btn
                icon
                variant="text"
                density="compact"
                size="x-small"
                :to="`/propagation/${prop.id}`"
                color="primary"
                title="View Details"
              >
                <v-icon size="small">mdi-eye</v-icon>
              </v-btn>
            </div>
          </div>

          <div class="text-body-2 mt-1">
            <template
              v-if="prop.initialCount && prop.currentCount !== undefined"
            >
              <v-chip
                size="x-small"
                :color="getCountColor(prop)"
                class="mr-2"
                label
                text-color="white"
              >
                {{ prop.currentCount }}/{{ prop.initialCount }}
              </v-chip>
            </template>
            <span v-if="prop.notes" class="text-truncate">
              {{ truncateText(prop.notes, 60) }}
            </span>
          </div>
        </v-timeline-item>
      </v-timeline>
    </v-card-text>

    <v-card-actions v-if="propagations.length">
      <v-spacer></v-spacer>
      <v-btn
        color="primary"
        variant="text"
        :to="`/propagation?plantId=${plantId}`"
        v-if="plantId"
      >
        View All
        <v-icon end>mdi-arrow-right</v-icon>
      </v-btn>
    </v-card-actions>

    <!-- New Propagation Dialog -->
    <v-dialog v-model="propagationDialog" max-width="600px">
      <v-card>
        <v-card-title>
          <span class="text-h5">New Propagation Record</span>
        </v-card-title>
        <v-card-text>
          <v-form ref="form" v-model="valid" @submit.prevent="savePropagation">
            <v-select
              v-model="newPropagation.propType"
              :items="propTypeOptions"
              label="Propagation Type"
              required
              :rules="[(v) => !!v || 'Propagation type is required']"
            ></v-select>

            <v-text-field
              v-if="newPropagation.propType === 1"
              v-model="newPropagation.seedSource"
              label="Seed Source"
              hint="Where did you get the seeds from?"
            ></v-text-field>

            <v-text-field
              v-if="newPropagation.propType === 2"
              v-model="newPropagation.cuttingSource"
              label="Cutting Source"
              hint="Where did you get the cutting from?"
            ></v-text-field>

            <v-text-field
              type="date"
              v-model="newPropagation.propDate"
              label="Propagation Date"
              required
              :rules="[(v) => !!v || 'Propagation date is required']"
            ></v-text-field>

            <v-text-field
              type="number"
              v-model.number="newPropagation.initialCount"
              label="Initial Count"
              hint="How many plants/seeds did you start with?"
            ></v-text-field>

            <v-text-field
              type="number"
              v-model.number="newPropagation.currentCount"
              label="Current Count"
              hint="How many plants survived/are growing?"
            ></v-text-field>

            <v-textarea
              v-model="newPropagation.notes"
              label="Notes"
              hint="Any additional information about this propagation"
              rows="3"
            ></v-textarea>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="blue-darken-1"
            variant="text"
            @click="propagationDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="blue-darken-1"
            variant="text"
            @click="savePropagation"
            :disabled="!valid"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup lang="ts">
  import { PropagationType, type PlantPropagation } from "~/types/plant-models";
  import { formatDate } from "~/utils/format";

  const props = defineProps({
    plantId: {
      type: Number,
      required: false,
    },
  });

  const emit = defineEmits(["update", "propagation-added"]);

  // State
  const propagations = ref<PlantPropagation[]>([]);
  const loading = ref(true);
  const propagationDialog = ref(false);
  const valid = ref(false);
  const form = ref(null);

  const newPropagation = ref<Partial<PlantPropagation>>({
    plantId: props.plantId,
    propType: PropagationType.Seed,
    propDate: new Date().toISOString().split("T")[0],
    initialCount: 1,
    currentCount: 1,
  });

  // Options
  const propTypeOptions = [
    { title: "Seed", value: PropagationType.Seed },
    { title: "Cutting", value: PropagationType.Cutting },
    { title: "Division", value: PropagationType.Division },
    { title: "Offsets", value: PropagationType.Offsets },
    { title: "Layering", value: PropagationType.Layering },
    { title: "Other", value: PropagationType.Other },
  ];

  // Methods
  function openNewPropagationDialog() {
    newPropagation.value = {
      plantId: props.plantId,
      propType: PropagationType.Seed,
      propDate: new Date().toISOString().split("T")[0],
      initialCount: 1,
      currentCount: 1,
    };
    propagationDialog.value = true;
  }

  async function savePropagation() {
    if (form.value && !form.value.validate()) return;

    try {
      await $fetch("/api/propagation", {
        method: "POST",
        body: newPropagation.value,
      });

      propagationDialog.value = false;
      fetchPropagations();
      emit("propagation-added");
    } catch (error) {
      console.error("Error saving propagation record:", error);
      // Show error notification
    }
  }

  function getPropTypeName(type?: PropagationType): string {
    if (!type) return "Unknown";

    const found = propTypeOptions.find((option) => option.value === type);
    return found ? found.title : "Unknown";
  }

  function getPropTypeIcon(type?: PropagationType): string {
    if (!type) return "mdi-sprout-outline";

    switch (type) {
      case PropagationType.Seed:
        return "mdi-seed";
      case PropagationType.Cutting:
        return "mdi-content-cut";
      case PropagationType.Division:
        return "mdi-card-bulleted-outline";
      case PropagationType.Offsets:
        return "mdi-flower";
      case PropagationType.Layering:
        return "mdi-layers";
      default:
        return "mdi-sprout-outline";
    }
  }

  function getPropStatusColor(prop: PlantPropagation): string {
    if (!prop.initialCount || prop.currentCount === undefined) {
      return "grey";
    }

    if (prop.currentCount === 0) {
      return "red";
    }

    const successRate = (prop.currentCount / prop.initialCount) * 100;

    if (successRate < 25) return "red-darken-1";
    if (successRate < 50) return "orange";
    if (successRate < 75) return "amber";
    return "green";
  }

  function getCountColor(prop: PlantPropagation): string {
    if (!prop.initialCount || prop.currentCount === undefined) {
      return "grey";
    }

    const successRate = (prop.currentCount / prop.initialCount) * 100;

    if (successRate === 0) return "red";
    if (successRate < 25) return "red-darken-1";
    if (successRate < 50) return "orange";
    if (successRate < 75) return "amber";
    return "green";
  }

  function truncateText(text?: string, maxLength = 50): string {
    if (!text) return "";
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  }

  // Fetch propagations for this plant
  async function fetchPropagations() {
    if (!props.plantId) {
      loading.value = false;
      return;
    }

    loading.value = true;

    try {
      const response = await $fetch(
        `/api/propagation?plantId=${props.plantId}`
      );
      propagations.value = response.data;
    } catch (error) {
      console.error("Error fetching propagation records:", error);
    } finally {
      loading.value = false;
    }
  }

  // Watch for plant ID changes
  watch(
    () => props.plantId,
    (newValue) => {
      if (newValue) {
        newPropagation.value.plantId = newValue;
        fetchPropagations();
      }
    }
  );

  // Lifecycle hooks
  onMounted(() => {
    if (props.plantId) {
      fetchPropagations();
    } else {
      loading.value = false;
    }
  });
</script>
