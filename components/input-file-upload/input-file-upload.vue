<template>
  <v-card>
    <v-card-text>
      <v-file-input
        ref="fileInput"
        :multiple="multiple"
        :label="label"
        :rules="fileRules"
        accept="image/*"
        :model-value="modelValueFill"
        prepend-icon="mdi-image-multiple"
        show-size
        counter
        variant="outlined"
        density="compact"
        @update:model-value="processModelValueFiles" />

      <!-- Use the list component to display uploaded files -->
      <input-file-upload-list
        v-if="displayFiles.length > 0"
        class="mt-4"
        :files="displayFiles"
        @delete="handleDelete" />
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import InputFileUploadList from './input-file-upload-list.vue';
import { type UploadFile, type ProcessedImageResult, FileState } from '../../types/input-file-upload';
import type { PlantPhotos } from '~/types';

type SelectedFiles = File | File[] | Blob | Blob[] | null;
type ProcessingStatus = {
  [key: string]: string;
};

const props = defineProps({
  multiple: { type: Boolean, default: true },
  label: { type: String, default: 'Select image(s)' },
  maxFileSize: { type: Number, default: 5 * 1024 * 1024 },
  maxWidth: { type: Number, default: 1280 },
  maxHeight: { type: Number, default: 1280 },
  quality: { type: Number, default: 0.7 },
  thumbWidth: { type: Number, default: 200 },
  thumbHeight: { type: Number, default: 200 },
  thumbQuality: { type: Number, default: 0.6 },
  acceptedTypes: { type: Array, default: () => ['image/jpeg', 'image/png', 'image/gif'] },
  modelValue: { type: Array as PropType<PlantPhotos[]>, default: () => [] },
});

const emit = defineEmits<{
  delete: [file: File];
  processed: [files: UploadFile[]];
}>();

const processingStatus = ref<ProcessingStatus>({});
const uploadedFiles = ref<UploadFile[]>([]);
const displayFiles = computed<UploadFile[]>(() => {
  return uploadedFiles.value.filter((file) => !file.markForDelete);
});
const modelValueFill = ref<undefined>();

const fileRules = computed(() => [
  (files: SelectedFiles) => {
    if (!files) return true;
    const fileArray = Array.isArray(files) ? files : [files];
    const tooLarge = fileArray.some((file) => file.size > props.maxFileSize);
    return !tooLarge || `File size should not exceed ${(props.maxFileSize / 1024 / 1024).toFixed(2)} MB`;
  },
]);

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function validateFile(file: File): { status: string; message?: string } {
  if (file.size > props.maxFileSize) {
    return {
      status: 'failure',
      message: `File size exceeds ${(props.maxFileSize / (1024 * 1024)).toFixed(1)}MB limit`,
    };
  }

  if (!props.acceptedTypes.includes(file.type)) {
    return {
      status: 'failure',
      message: `File type ${file.type} not supported`,
    };
  }

  return { status: 'success' };
}

function processFiles() {
  processingStatus.value = {};

  // Process all files that are in the uploadedFiles array and marked as queued or need processing
  const filesToProcess = uploadedFiles.value.filter((item) => item.fileState === FileState.progress) as UploadFile[];

  if (filesToProcess.length === 0) {
    return;
  }

  // Update all files to show they're being processed
  for (const file of filesToProcess) {
    const fileIndex = uploadedFiles.value.findIndex((f) => f.filename === file.filename);
    if (fileIndex !== -1) {
      uploadedFiles.value[fileIndex].isLoading = true;
      uploadedFiles.value[fileIndex].fileState = FileState.progress;
      uploadedFiles.value[fileIndex].message = 'Waiting to process...';
    }
  }

  const processPromises = filesToProcess.map(async (file: UploadFile) => {
    processingStatus.value[file.filename] = 'processing...';
    try {
      const result = await _processSingleFile(file);
      processingStatus.value[file.filename] = 'done';

      return result as ProcessedImageResult;
    } catch (error) {
      processingStatus.value[file.filename] = 'error';
      console.error(`Failed to process ${file.filename}:`, error);

      // Update UI to show error for this file
      const fileIndex = uploadedFiles.value.findIndex((f) => f.filename === file.filename);
      if (fileIndex !== -1) {
        uploadedFiles.value[fileIndex].isLoading = false;
        uploadedFiles.value[fileIndex].fileState = FileState.error;
        uploadedFiles.value[fileIndex].message =
          `Error: ${error instanceof Error ? error.message : 'Processing failed'}`;
      }

      return null;
    }
  });

  Promise.all(processPromises)
    .then((results) => {
      const validResults = results.filter(Boolean) as ProcessedImageResult[];

      // Process the results and add to uploadedFiles
      handleProcessedImages(validResults);

      emit(
        'processed',
        validResults.map((r) => r.originalFile)
      );

      // No need to clear selectedFiles here as we already cleared it in the watch handler
    })
    .catch((error) => {
      console.error('Processing failed:', error);
      // No need to clear selectedFiles here as we already cleared it in the watch handler
    });
}

function handleProcessedImages(processedFiles: ProcessedImageResult[]): void {
  for (const processedFile of processedFiles) {
    const file = processedFile.originalFile.file;
    if (!file) continue;

    const validationResult = validateFile(file);

    // Check if we already have this file in our list from the preview
    const existingFileIndex = uploadedFiles.value.findIndex((f) => f.filename === file.name);

    if (existingFileIndex !== -1) {
      // Update the existing entry with optimized thumbnail
      uploadedFiles.value[existingFileIndex].thumb = processedFile.thumbnail.base64;

      // Keep loading state true until we're ready to switch it off
      // (don't update isLoading here)

      // Update status and message but don't change loading state yet
      if (validationResult.status === 'success') {
        uploadedFiles.value[existingFileIndex].fileState = FileState.progress;
        uploadedFiles.value[existingFileIndex].message = 'Almost done...';
      } else {
        uploadedFiles.value[existingFileIndex].fileState = FileState.done;
        uploadedFiles.value[existingFileIndex].message = validationResult.message;
      }
    } else {
      // Create a new entry if it doesn't exist (rare case if file wasn't in the preview)
      const newUploadFile: UploadFile = {
        file: file,
        filename: file.name,
        size: formatFileSize(file.size),
        filetype: file.type,
        thumb: processedFile.thumbnail.base64,
        isLoading: true,
        fileState: FileState.progress,
        markForDelete: false,
        message: validationResult.status === 'success' ? 'Processing...' : validationResult.message,
      };

      // Add to the upload list
      uploadedFiles.value.push(newUploadFile);
    }

    // Use Promise.resolve().then() to ensure UI updates before removing loading indicator
    // Wait a little longer to make the loading state visible to the user
    Promise.resolve().then(() => {
      setTimeout(() => {
        const fileIndex = uploadedFiles.value.findIndex((f) => f.filename === file.name);
        if (fileIndex !== -1) {
          // Update loading state and final status together
          uploadedFiles.value[fileIndex].isLoading = false;
          uploadedFiles.value[fileIndex].fileState = FileState.done;
          uploadedFiles.value[fileIndex].message = validationResult.message;
        }
      }, 1200); // Slightly longer delay for better UX feedback
    });
  }
}

function handleDelete(file: UploadFile): void {
  // Remove file from local array
  const index = uploadedFiles.value.findIndex((f) => f.guid === file.guid);
  if (index !== -1) {
    uploadedFiles.value[index].markForDelete = true;
    // Update processed files list
    emit('processed', uploadedFiles.value);
  }
}

async function _processSingleFile(uploadFile: UploadFile): Promise<ProcessedImageResult> {
  return new Promise((resolve, reject) => {
    // Update the file status in the UI to show more detailed processing status
    const updateFileStatus = (message: string) => {
      const fileIndex = uploadedFiles.value.findIndex((f) => f.filename === uploadFile.filename);
      if (fileIndex !== -1) {
        uploadedFiles.value[fileIndex].message = message;
      }
    };

    // Start by updating the status
    updateFileStatus('Reading file...');

    const reader = new FileReader();
    reader.readAsDataURL(new Blob([uploadFile.file as File], { type: uploadFile.file?.type }));

    reader.onload = (readerEvent) => {
      updateFileStatus('Creating optimized version...');

      const image = new window.Image();
      if (typeof readerEvent.target?.result === 'string') {
        image.src = readerEvent.target.result;
      } else {
        updateFileStatus('Error: Could not read file');
        reject(new Error('FileReader result is not a string'));
        return;
      }

      image.onload = () => {
        // For full-size image processing - maintains aspect ratio with max dimensions
        const createCanvas = (w: number, h: number, q: number) => {
          updateFileStatus(`Resizing image (${w}×${h})...`);

          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const ratio = Math.min(w / image.width, h / image.height);
          canvas.width = image.width * (ratio < 1 ? ratio : 1);
          canvas.height = image.height * (ratio < 1 ? ratio : 1);

          if (ctx) {
            ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
          } else {
            updateFileStatus('Error: Canvas context not available');
            throw new Error('Could not get 2D context from canvas');
          }

          return canvas.toDataURL('image/jpeg', q);
        };

        // Special function for thumbnail that uses max dimension instead of fixed dimensions
        const createThumbnailCanvas = (maxDimension: number, q: number) => {
          updateFileStatus(`Creating thumbnail (max ${maxDimension}px)...`);

          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          // Calculate dimensions while maintaining aspect ratio
          let thumbWidth = image.width;
          let thumbHeight = image.height;

          // Determine which dimension is larger and scale accordingly
          if (thumbWidth > thumbHeight) {
            // Width is larger, so set it to maxDimension
            const ratio = maxDimension / thumbWidth;
            thumbWidth = maxDimension;
            thumbHeight = Math.round(thumbHeight * ratio);
          } else {
            // Height is larger or equal, so set it to maxDimension
            const ratio = maxDimension / thumbHeight;
            thumbHeight = maxDimension;
            thumbWidth = Math.round(thumbWidth * ratio);
          }

          // Don't upscale small images
          if (image.width < maxDimension && image.height < maxDimension) {
            thumbWidth = image.width;
            thumbHeight = image.height;
          }

          canvas.width = thumbWidth;
          canvas.height = thumbHeight;

          if (ctx) {
            ctx.drawImage(image, 0, 0, thumbWidth, thumbHeight);
          } else {
            updateFileStatus('Error: Canvas context not available');
            throw new Error('Could not get 2D context from canvas');
          }

          return canvas.toDataURL('image/jpeg', q);
        };

        updateFileStatus('Creating main image...');
        const mainBase64 = createCanvas(props.maxWidth, props.maxHeight, props.quality);

        updateFileStatus('Creating thumbnail...');
        // Use the new thumbnail function with max dimension of 200px
        const thumbBase64 = createThumbnailCanvas(200, props.thumbQuality);

        const getKbSize = (base64: string) => (base64.length * (3 / 4)) / 1024;

        updateFileStatus('Finalizing...');
        resolve({
          originalFile: uploadFile,
          main: {
            base64: mainBase64,
            sizeKB: getKbSize(mainBase64),
          },
          thumbnail: {
            base64: thumbBase64,
            sizeKB: getKbSize(thumbBase64),
          },
        } as ProcessedImageResult);
      };

      image.onerror = (e) => {
        updateFileStatus('Error: Failed to process image');
        reject(e);
      };
    };

    reader.onerror = (e) => {
      updateFileStatus('Error: Failed to read file');
      reject(e);
    };
  });
}

const fileInput = ref();
async function processModelValueFiles(files: SelectedFiles): Promise<void> {
  const fileArray = Array.isArray(files) ? files : [files];
  if (fileArray.length === 0) return;

  let previewsGenerated = 0;
  const totalFiles = fileArray.length;

  function addFileToUploadList(file: File, thumb: string, fileState: FileState, message: string, isLoading: boolean) {
    uploadedFiles.value.push({
      file,
      filename: file.name,
      size: formatFileSize(file.size),
      filetype: file.type,
      thumb,
      isLoading,
      fileState: fileState,
      markForDelete: false,
      message,
    });
  }

  function previewDone() {
    previewsGenerated++;
    if (previewsGenerated === totalFiles) {
      setTimeout(() => processFiles(), 100);
    }
  }

  for (const file of fileArray as File[]) {
    // Check if already exists
    if (uploadedFiles.value.some((f) => f.filename === file.name)) {
      previewDone();
      continue;
    }
    const validationResult = validateFile(file);
    if (validationResult.status !== 'success') {
      addFileToUploadList(file, '', FileState.error, validationResult.message ?? 'Invalid file', false);
      previewDone();
      continue;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === 'string') {
        addFileToUploadList(file, e.target.result, FileState.progress, 'Preparing for optimization...', true);
      } else {
        addFileToUploadList(file, '', FileState.error, 'Failed to generate preview', false);
      }
      previewDone();
    };
    reader.onerror = () => {
      addFileToUploadList(file, '', FileState.error, 'Failed to generate preview', false);
      previewDone();
    };
    reader.readAsDataURL(file);
  }

  modelValueFill.value = undefined;
  await fileInput.value?.reset();
  await fileInput.value?.resetValidation();
  // Fallback: ensure processFiles runs even if some previews hang
  setTimeout(() => {
    if (previewsGenerated < totalFiles) {
      console.warn(`Not all previews were generated (${previewsGenerated}/${totalFiles}), proceeding anyway`);
      processFiles();
    }
  }, 2000);
}

async function processModelValuePlantPhotos(plantPhotos: PlantPhotos[]): Promise<UploadFile[]> {
  return plantPhotos.map((photo) => {
    return {
      id: photo.id,
      file64: photo.image,
      filename: photo.filename,
      size: formatFileSize(photo.size_type),
      filetype: photo.mime_type,
      thumb: '', // No preview available
      isLoading: false,
      fileState: FileState.done,
      message: 'Preparing for upload...',
      guid: photo.guid,
    } as UploadFile;
  });
}

// Watch for changes to selectedFiles and automatically process them
watch(
  () => props.modelValue,
  async (newFiles) => {
    if (!newFiles) return;
    uploadedFiles.value = await processModelValuePlantPhotos(newFiles);
  }
);

onMounted(async () => {
  // Initial processing if modelValue is pre-filled
  if (props.modelValue) {
    uploadedFiles.value = await processModelValuePlantPhotos(props.modelValue);
  }
});
</script>
