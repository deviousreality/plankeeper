enum FileState {
  none = 0,
  progress = 1,
  error = 2,
  done = 3,
}

type Image = {
  blob: File;
  id: string;
  lastModifiedDate: number;
  name: string;
  size: number;
  state: FileState | number;
  type: string;
  error: string;
};

interface UploadFile {
  file: File;
  name: string;
  size: string;
  filetype: string;
  thumb: string;
  isLoading: boolean;
  filestatus: string;
  message?: string;
}

interface ProcessedImageResult {
  originalFile: File;
  main: {
    base64: string;
    sizeKB: number;
  };
  thumbnail: {
    base64: string;
    sizeKB: number;
  };
}

export { FileState, type Image, type UploadFile, type ProcessedImageResult };
