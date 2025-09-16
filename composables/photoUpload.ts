export function useFileUpload(plantId: number): Ref<unknown> {
  const uploadStatus = ref<Record<string, string>>({});

  function startUpload(file: File) {
    // Simulate upload process
    uploadStatus.value[file.name] = 'Uploading...';
    setTimeout(() => {
      uploadStatus.value[file.name] = 'Complete';
    }, 2000);
  }

  return {
    startUpload,
  };
}
