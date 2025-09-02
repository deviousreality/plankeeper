<template>
  <v-container
    v-if="props.files && props.files.length > 0"
    class="pa-0">
    <div class="image-list-container">
      <div
        v-for="item in props.files"
        :key="item.name"
        class="image-item">
        <div
          class="thumbnail-container"
          :class="{
            'error-border': item.filestatus === 'error' || item.filestatus === 'failure',
          }">
          <img
            :src="item.thumb || ''"
            class="thumbnail"
            :title="item.name"
            :alt="item.name" />

          <!-- Status indicator chip -->
          <v-chip
            v-if="item.filestatus === 'error'"
            class="status-chip"
            :color="getStatusColor(item.filestatus)"
            size="x-small"
            variant="elevated">
            {{ item.filestatus }}
          </v-chip>

          <!-- Loading overlay -->
          <div
            v-if="item.isLoading"
            class="loading-backdrop">
            <v-progress-circular
              indeterminate
              color="primary"
              class="loading-overlay"></v-progress-circular>
          </div>

          <!-- Delete button overlay - only show when not loading -->
          <div
            v-if="!item.isLoading"
            class="delete-overlay">
            <v-btn
              icon
              size="default"
              color="error"
              variant="elevated"
              density="compact"
              @click.stop="removeFile(item)">
              <v-icon size="default">mdi-delete</v-icon>
            </v-btn>
          </div>

          <!-- File info overlay (shown on hover) -->
          <div class="file-info-overlay">
            <div class="file-name text-truncate">{{ item.name }}</div>
            <div class="file-size">{{ item.size }}</div>
            <div
              v-if="item.message && (item.filestatus === 'failure' || item.filestatus === 'error')"
              class="error-message">
              {{ item.message }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state - only shown when there are no files -->
    <div
      v-if="props.files.length === 0"
      class="empty-state">
      <v-icon
        icon="mdi-image-multiple-outline"
        size="large"
        color="grey-lighten-1"></v-icon>
      <div class="text-caption text-grey">No images added yet</div>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';

// Import the shared interface
import type { UploadFile } from '../../types/input-file-upload';

const props = defineProps({
  files: { type: Array as () => UploadFile[], default: () => [] },
});

const emit = defineEmits(['delete']);

function removeFile(file: UploadFile): void {
  // Emit only the delete event for parent components to handle
  emit('delete', file);
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'success':
      return 'success';
    case 'error':
    case 'failure':
      return 'error';
    case 'loading':
    case 'optimizing':
    case 'queued':
    case 'processing':
      return 'info';
    default:
      return 'default';
  }
}
</script>

<style scoped>
.image-list-container {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 8px 0;
}

.image-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.thumbnail-container {
  position: relative;
  width: 100px;
  height: 100px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.thumbnail-container:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.thumbnail-container:hover .delete-overlay,
.thumbnail-container:hover .file-info-overlay {
  opacity: 1;
}

.thumbnail-container:hover .thumbnail {
  filter: brightness(0.8);
}

.error-border {
  border-color: #ff5252;
  box-shadow: 0 0 8px rgba(255, 82, 82, 0.5);
}

.success-border {
  border-color: #4caf50;
  box-shadow: 0 0 8px rgba(76, 175, 80, 0.3);
}

.thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: filter 0.3s ease;
}

.status-chip {
  position: absolute;
  top: 6px;
  left: 6px;
  z-index: 3;
  font-size: 9px;
  opacity: 0.9;
}

.delete-overlay {
  position: absolute;
  bottom: 6px;
  right: 6px;
  opacity: 0;
  transition: opacity 0.3s ease;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 4px;
  padding: 2px;
  z-index: 5;
}

.file-info-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0));
  padding: 20px 6px 6px 6px;
  color: white;
  font-size: 0.7rem;
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 2;
}

.file-name {
  font-weight: bold;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  max-width: 88px;
}

.file-size {
  font-size: 0.65rem;
  opacity: 0.8;
}

.loading-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.7);
  z-index: 9;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-overlay {
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  padding: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.error-message {
  color: #ffaaaa;
  font-size: 0.65rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 88px;
  margin-top: 2px;
  font-style: italic;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background-color: #f5f5f5;
  border-radius: 8px;
  margin: 10px 0;
  min-height: 100px;
  gap: 8px;
}
</style>
