enum FileState {
  none = 0,
  progress = 1,
  error = 2,
  done = 3,
}

interface UploadFile {
  id?: number;
  file?: File;
  file64?: string;
  filename: string;
  size?: string;
  filetype: string;
  thumb: string;
  isLoading: boolean;
  fileState: FileState;
  markForDelete: boolean;
  message?: string;
  guid?: string;
}

interface ProcessedImageResult {
  originalFile: UploadFile;
  main: {
    base64: string;
    sizeKB: number;
  };
  thumbnail: {
    base64: string;
    sizeKB: number;
  };
}

export type { UploadFile, ProcessedImageResult };
export { FileState };
