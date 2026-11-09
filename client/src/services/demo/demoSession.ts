const records = new Map<string, string>();
export const demoMedia = new Map<string, Blob>();
export let demoSessionVersion = 0;

export const demoStorage = {
  keys: () => [...records.keys()],
  getItem: (key: string) => records.get(key) ?? null,
  setItem: (key: string, value: string) => { records.set(key, value); },
  removeItem: (key: string) => { records.delete(key); },
};

export function resetDemoSession() {
  demoSessionVersion += 1;
  records.clear();
  demoMedia.clear();
}
