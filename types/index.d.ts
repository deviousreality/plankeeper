declare module 'nitropack' {
  interface RuntimeConfig {
    databaseUrl: string;
    databaseName: string;
  }
}
// It is always important to ensure you import/export something when augmenting a type
export {};
