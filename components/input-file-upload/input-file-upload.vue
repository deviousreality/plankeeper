<template>
  <v-card outlined>
    <v-card-text>
      <v-file-input
        v-model="selectedFiles"
        :multiple="false"
        :label="label"
        :rules="fileRules"
        accept="image/*"
        prepend-icon="mdi-image-multiple"
        show-size
        counter
        outlined
        dense></v-file-input>

      <v-list
        v-if="selectedFiles.length > 0"
        dense>
        <v-list-subheader>FILES TO PROCESS</v-list-subheader>
        <v-list-item
          v-for="file in selectedFiles"
          :key="file.name">
          <template #prepend>
            <v-icon>mdi-file-image-outline</v-icon>
          </template>

          <v-list-item-title>{{ file.name }}</v-list-item-title>
          <v-list-item-subtitle>{{ (file.size / 1024).toFixed(2) }} KB</v-list-item-subtitle>
          <v-list-item-action>
            <v-chip
              v-if="processingStatus[file.name]"
              :color="getStatusColor(processingStatus[file.name])"
              small
              dark>
              {{ processingStatus[file.name] }}
            </v-chip>
          </v-list-item-action>
        </v-list-item>
      </v-list>
    </v-card-text>

    <v-card-actions class="px-4 pb-4">
      <v-btn
        :disabled="selectedFiles.length === 0 || isProcessing"
        :loading="isProcessing"
        color="primary"
        block
        x-large
        @click="processFiles">
        <v-icon left>mdi-sync</v-icon>
        Process {{ selectedFiles.length }} File(s)
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
/*
bluesky info about uploading
uses com.atproto.repo.uploadBlob and uploads images as "blobs"
the blob returns the metadata object which is embedded in the response
strip image metadata before uploading
*/
type SelectedFiles = File | File[] | null;

const props = defineProps({
  multiple: { type: Boolean, default: true },
  label: { type: String, default: 'Select image(s)' },
  maxFileSize: { type: Number, default: 5 * 1024 * 1024 },
  maxWidth: { type: Number, default: 1280 },
  maxHeight: { type: Number, default: 1280 },
  quality: { type: Number, default: 0.7 },
  thumbWidth: { type: Number, default: 150 },
  thumbHeight: { type: Number, default: 150 },
  thumbQuality: { type: Number, default: 0.6 },
});

const emit = defineEmits(['processed']);

const selectedFiles = ref<SelectedFiles>(null);
const isProcessing = ref(false);
const processingStatus = ref({});

const fileRules = computed(() => [
  (files: SelectedFiles) => {
    if (!files) return true;
    const fileArray = Array.isArray(files) ? files : [files];
    const tooLarge = fileArray.some((file) => file.size > props.maxFileSize);
    return !tooLarge || `File size should not exceed ${(props.maxFileSize / 1024 / 1024).toFixed(2)} MB`;
  },
]);

function getStatusColor(status) {
  if (status === 'done') return 'green';
  if (status === 'error') return 'red';
  return 'blue-grey';
}

function _processSingleFile(file: File): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (readerEvent) => {
      const image = new window.Image();
      if (typeof readerEvent.target?.result === 'string') {
        image.src = readerEvent.target.result;
      } else {
        reject(new Error('FileReader result is not a string'));
        return;
      }

      image.onload = () => {
        const createCanvas = (w: number, h: number, q: number) => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const ratio = Math.min(w / image.width, h / image.height);
          canvas.width = image.width * (ratio < 1 ? ratio : 1);
          canvas.height = image.height * (ratio < 1 ? ratio : 1);
          if (ctx) {
            ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
          } else {
            throw new Error('Could not get 2D context from canvas');
          }
          return canvas.toDataURL('image/jpeg', q);
        };
        const mainBase64 = createCanvas(props.maxWidth, props.maxHeight, props.quality);
        const thumbBase64 = createCanvas(props.thumbWidth, props.thumbHeight, props.thumbQuality);
        const getKbSize = (base64: string) => (base64.length * (3 / 4)) / 1024;
        resolve({
          originalFile: file,
          main: {
            base64: mainBase64,
            sizeKB: getKbSize(mainBase64),
          },
          thumbnail: {
            base64: thumbBase64,
            sizeKB: getKbSize(thumbBase64),
          },
        });
      };
      image.onerror = (e) => reject(e);
    };
    reader.onerror = (e) => reject(e);
  });
}

import { watch } from 'vue';

// Store processed files (base64 and new File)
const processedSelectedFiles = ref<any[]>([]);

// Helper to convert base64 to File
function base64ToFile(base64: string, filename: string, mime = 'image/jpeg') {
  const arr = base64.split(','),
    bstr = atob(arr[1]),
    n = bstr.length,
    u8arr = new Uint8Array(n);
  for (let i = 0; i < n; i++) u8arr[i] = bstr.charCodeAt(i);
  return new File([u8arr], filename, { type: mime });
}

// Watch for changes to selectedFiles and process immediately
watch(
  selectedFiles,
  async (files) => {
    if (!files) return;
    const fileArray = Array.isArray(files) ? files : [files];
    isProcessing.value = true;
    processingStatus.value = {};
    processedSelectedFiles.value = [];
    const processPromises = fileArray.map(async (file: File) => {
      processingStatus.value[file.name] = 'processing...';
      try {
        const result: any = await _processSingleFile(file);
        // Create new File from base64
        const resizedFile = base64ToFile(result.main.base64, file.name);
        processedSelectedFiles.value.push({
          originalFile: file,
          resizedFile,
          base64: result.main.base64,
          sizeKB: result.main.sizeKB,
          thumbnail: result.thumbnail,
        });
        processingStatus.value[file.name] = 'done';
      } catch (error) {
        processingStatus.value[file.name] = 'error';
        console.error(`Failed to process ${file.name}:`, error);
      }
    });
    await Promise.all(processPromises);
    isProcessing.value = false;
    // Emit update:modelValue and processedSelectedFiles
    emit(
      'update:modelValue',
      processedSelectedFiles.value.map((f) => f.resizedFile)
    );
    emit('processedSelectedFiles', processedSelectedFiles.value);
  },
  { immediate: false }
);
</script>
