<template>
  <v-card>
    <v-card-text>
      <v-file-input
        v-model="selectedFiles"
        :multiple="multiple"
        :label="label"
        :rules="fileRules"
        accept="image/*"
        prepend-icon="mdi-image-multiple"
        show-size
        counter
        variant="outlined"
        density="compact"></v-file-input>

      <!-- Use the list component to display uploaded files -->
      <input-file-upload-list
        :files="uploadedFiles"
        @delete="handleDelete" />
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import InputFileUploadList from './input-file-upload-list.vue';
import type { UploadFile, ProcessedImageResult } from '../../types/input-file-upload';

type SelectedFiles = File | File[] | null;
interface ProcessingStatus {
  [key: string]: string;
}

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
});

const emit = defineEmits(['processed', 'delete']);

const selectedFiles = ref<SelectedFiles>(null);
const isProcessing = ref(false);
const processingStatus = ref<ProcessingStatus>({});
const uploadedFiles = ref<UploadFile[]>([]);

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
  const filesToProcess = uploadedFiles.value
    .filter((item) => item.filestatus === 'queued' || item.filestatus === 'processing')
    .map((item) => item.file);

  if (filesToProcess.length === 0) {
    return;
  }

  // Update UI to show global processing state
  const totalFiles = filesToProcess.length;
  let completedFiles = 0;

  // Update all files to show they're being processed
  for (const file of filesToProcess) {
    const fileIndex = uploadedFiles.value.findIndex((f) => f.name === file.name);
    if (fileIndex !== -1) {
      uploadedFiles.value[fileIndex].isLoading = true;
      uploadedFiles.value[fileIndex].filestatus = 'processing';
      uploadedFiles.value[fileIndex].message = 'Waiting to process...';
    }
  }

  const processPromises = filesToProcess.map(async (file: File) => {
    processingStatus.value[file.name] = 'processing...';
    try {
      const result = await _processSingleFile(file);
      processingStatus.value[file.name] = 'done';

      // Update progress count
      completedFiles++;

      return result as ProcessedImageResult;
    } catch (error) {
      processingStatus.value[file.name] = 'error';
      console.error(`Failed to process ${file.name}:`, error);

      // Update UI to show error for this file
      const fileIndex = uploadedFiles.value.findIndex((f) => f.name === file.name);
      if (fileIndex !== -1) {
        uploadedFiles.value[fileIndex].isLoading = false;
        uploadedFiles.value[fileIndex].filestatus = 'error';
        uploadedFiles.value[fileIndex].message =
          `Error: ${error instanceof Error ? error.message : 'Processing failed'}`;
      }

      // Update progress count
      completedFiles++;

      return null;
    }
  });

  Promise.all(processPromises)
    .then((results) => {
      const validResults = results.filter(Boolean) as ProcessedImageResult[];

      // Process the results and add to uploadedFiles
      handleProcessedImages(validResults);

      // Emit processed event for parent component with proper structure
      // Map each uploadedFile to a format compatible with what form-plant.vue expects
      const mappedResults = validResults.map((result) => ({
        originalFile: result.originalFile,
        name: result.originalFile.name,
        main: result.main,
        thumbnail: result.thumbnail,
      }));

      emit('processed', mappedResults);

      // No need to clear selectedFiles here as we already cleared it in the watch handler
    })
    .catch((error) => {
      console.error('Processing failed:', error);
      // No need to clear selectedFiles here as we already cleared it in the watch handler
    });
}

function handleProcessedImages(processedFiles: ProcessedImageResult[]): void {
  for (const processedFile of processedFiles) {
    const file = processedFile.originalFile;
    const validationResult = validateFile(file);

    // Check if we already have this file in our list from the preview
    const existingFileIndex = uploadedFiles.value.findIndex((f) => f.name === file.name);

    if (existingFileIndex !== -1) {
      // Update the existing entry with optimized thumbnail
      uploadedFiles.value[existingFileIndex].thumb = processedFile.thumbnail.base64;

      // Keep loading state true until we're ready to switch it off
      // (don't update isLoading here)

      // Update status and message but don't change loading state yet
      if (validationResult.status === 'success') {
        uploadedFiles.value[existingFileIndex].filestatus = 'optimizing';
        uploadedFiles.value[existingFileIndex].message = 'Almost done...';
      } else {
        uploadedFiles.value[existingFileIndex].filestatus = validationResult.status;
        uploadedFiles.value[existingFileIndex].message = validationResult.message;
      }
    } else {
      // Create a new entry if it doesn't exist (rare case if file wasn't in the preview)
      const newUploadFile: UploadFile = {
        file: file,
        name: file.name,
        size: formatFileSize(file.size),
        filetype: file.type,
        thumb: processedFile.thumbnail.base64,
        isLoading: true,
        filestatus: 'optimizing',
        message: validationResult.status === 'success' ? 'Processing...' : validationResult.message,
      };

      // Add to the upload list
      uploadedFiles.value.push(newUploadFile);
    }

    // Use Promise.resolve().then() to ensure UI updates before removing loading indicator
    // Wait a little longer to make the loading state visible to the user
    Promise.resolve().then(() => {
      setTimeout(() => {
        const fileIndex = uploadedFiles.value.findIndex((f) => f.name === file.name);
        if (fileIndex !== -1) {
          // Update loading state and final status together
          uploadedFiles.value[fileIndex].isLoading = false;
          uploadedFiles.value[fileIndex].filestatus = validationResult.status;
          uploadedFiles.value[fileIndex].message = validationResult.message;
        }
      }, 1200); // Slightly longer delay for better UX feedback
    });
  }
}

function handleDelete(file: UploadFile): void {
  // Remove file from local array
  const index = uploadedFiles.value.findIndex((f) => f.name === file.name);
  if (index !== -1) {
    uploadedFiles.value.splice(index, 1);

    // Create properly structured objects for the remaining files
    const remainingProcessedFiles = uploadedFiles.value.map((file) => ({
      originalFile: file.file,
      name: file.name,
      main: {
        base64: file.thumb,
        sizeKB: file.thumb ? (file.thumb.length * (3 / 4)) / 1024 : 0,
      },
      thumbnail: {
        base64: file.thumb,
        sizeKB: file.thumb ? (file.thumb.length * (3 / 4)) / 1024 : 0,
      },
    }));

    // Update processed files list
    emit('processed', remainingProcessedFiles);
  }

  // Pass the full file object with all its data up to the parent component
  emit('delete', {
    originalFile: file.file,
    name: file.name,
    main: {
      base64: file.thumb, // Use thumbnail as main if that's all we have
      sizeKB: file.thumb ? (file.thumb.length * (3 / 4)) / 1024 : 0,
    },
    thumbnail: {
      base64: file.thumb,
      sizeKB: file.thumb ? (file.thumb.length * (3 / 4)) / 1024 : 0,
    },
  });
}

function _processSingleFile(file: File): Promise<unknown> {
  return new Promise((resolve, reject) => {
    // Update the file status in the UI to show more detailed processing status
    const updateFileStatus = (message: string) => {
      const fileIndex = uploadedFiles.value.findIndex((f) => f.name === file.name);
      if (fileIndex !== -1) {
        uploadedFiles.value[fileIndex].message = message;
      }
    };

    // Start by updating the status
    updateFileStatus('Reading file...');

    const reader = new FileReader();
    reader.readAsDataURL(file);

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

// Helper to convert base64 to File
function base64ToFile(base64: string, filename: string, mime = 'image/jpeg') {
  const arr = base64.split(','),
    bstr = atob(arr[1]),
    n = bstr.length,
    u8arr = new Uint8Array(n);
  for (let i = 0; i < n; i++) u8arr[i] = bstr.charCodeAt(i);
  return new File([u8arr], filename, { type: mime });
}

// Watch for changes to selectedFiles and automatically process them
watch(selectedFiles, async (newFiles) => {
  if (!newFiles) return;

  // Store the files we need to process
  const fileArray = Array.isArray(newFiles) ? newFiles : [newFiles];

  // Clear selectedFiles immediately to allow for more selections
  // This needs to be done early so the UI is responsive
  const filesToProcess = [...fileArray]; // Create a copy before clearing
  selectedFiles.value = null;

  // Add a counter to track how many files have been previewed
  let previewsGenerated = 0;
  const totalFiles = filesToProcess.length;

  // Create quick previews first
  for (const file of filesToProcess) {
    try {
      // Check if this file is already in our list
      const existingFileIndex = uploadedFiles.value.findIndex((f) => f.name === file.name);
      if (existingFileIndex !== -1) {
        // File already exists, just update its status
        uploadedFiles.value[existingFileIndex].isLoading = true;
        uploadedFiles.value[existingFileIndex].filestatus = 'queued';
        uploadedFiles.value[existingFileIndex].message = 'Preparing to process...';

        // Count this as previewed
        previewsGenerated++;
        continue;
      }

      // Validate the file first
      const validationResult = validateFile(file);

      // If the file is invalid, add it with error status and skip processing
      if (validationResult.status !== 'success') {
        uploadedFiles.value.push({
          file: file,
          name: file.name,
          size: formatFileSize(file.size),
          filetype: file.type,
          thumb: '', // No preview for invalid files
          isLoading: false,
          filestatus: 'error',
          message: validationResult.message || 'Invalid file',
        });

        // Count this as previewed
        previewsGenerated++;
        continue;
      }

      // Create a quick base64 preview for valid files
      const reader = new FileReader();

      reader.onload = (e) => {
        if (typeof e.target?.result === 'string') {
          // Add to upload list with temporary preview
          const newUploadFile: UploadFile = {
            file: file,
            name: file.name,
            size: formatFileSize(file.size),
            filetype: file.type,
            thumb: e.target.result, // Use the full-size image initially
            isLoading: true, // Mark as loading until optimization is complete
            filestatus: 'queued', // Initial status is queued
            message: 'Preparing for optimization...',
          };

          uploadedFiles.value.push(newUploadFile);

          // Increment counter and check if we should start processing
          previewsGenerated++;
          if (previewsGenerated === totalFiles) {
            // All previews are done, start processing
            setTimeout(() => {
              processFiles();
            }, 100);
          }
        }
      };

      reader.onerror = () => {
        // Handle preview generation errors
        uploadedFiles.value.push({
          file: file,
          name: file.name,
          size: formatFileSize(file.size),
          filetype: file.type,
          thumb: '', // No preview available
          isLoading: false,
          filestatus: 'error',
          message: 'Failed to generate preview',
        });

        // Increment counter and check if we should start processing
        previewsGenerated++;
        if (previewsGenerated === totalFiles) {
          // All previews are done, start processing (valid files only)
          setTimeout(() => {
            processFiles();
          }, 100);
        }
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error(`Error creating preview for ${file.name}:`, error);

      // Add the file with error status
      uploadedFiles.value.push({
        file: file,
        name: file.name,
        size: formatFileSize(file.size),
        filetype: file.type,
        thumb: '', // No preview available
        isLoading: false,
        filestatus: 'error',
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });

      // Increment counter and check if we should start processing
      previewsGenerated++;
      if (previewsGenerated === totalFiles) {
        // All previews are done, start processing (valid files only)
        setTimeout(() => {
          processFiles();
        }, 100);
      }
    }
  }

  // Fallback in case something goes wrong with the counters
  // Set a maximum wait time before starting processing regardless
  setTimeout(() => {
    if (previewsGenerated < totalFiles) {
      console.warn(`Not all previews were generated (${previewsGenerated}/${totalFiles}), proceeding anyway`);
      processFiles();
    }
  }, 2000);
});

// Expose necessary functions and data
defineExpose({
  processFiles,
  uploadedFiles,
});
</script>
