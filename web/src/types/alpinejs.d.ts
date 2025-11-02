declare module 'alpinejs' {
  export interface Alpine {
    start(): void;
    data(name: string, callback: () => unknown): void;
  }
  const Alpine: Alpine;
  export default Alpine;
}
