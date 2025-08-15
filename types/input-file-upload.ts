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

export { FileState, type Image };
