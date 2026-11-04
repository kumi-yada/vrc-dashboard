export interface SavedInstance {
  id: string;
  location: string;
  addedAt: string;
}

const STORAGE_KEY = "vrc-dashboard-saved-instances";

function loadFromStorage(): SavedInstance[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedInstance[];
  } catch {
    return [];
  }
}

function saveToStorage(data: SavedInstance[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore storage errors
  }
}

let saved = $state<SavedInstance[]>(loadFromStorage());

export function getSavedInstances() {
  return {
    get instances() {
      return saved;
    },
  };
}

export function isInstanceSaved(location: string): boolean {
  return saved.some((s) => s.location === location);
}

export function addSavedInstance(location: string): SavedInstance | null {
  if (saved.some((s) => s.location === location)) return null;
  const entry: SavedInstance = {
    id: crypto.randomUUID(),
    location,
    addedAt: new Date().toISOString(),
  };
  saved = [...saved, entry];
  saveToStorage(saved);
  return entry;
}

export function removeSavedInstance(id: string): void {
  saved = saved.filter((s) => s.id !== id);
  saveToStorage(saved);
}

export function removeSavedInstanceByLocation(location: string): void {
  saved = saved.filter((s) => s.location !== location);
  saveToStorage(saved);
}

export function toggleSavedInstance(location: string): boolean {
  const existing = saved.find((s) => s.location === location);
  if (existing) {
    removeSavedInstance(existing.id);
    return false;
  }
  addSavedInstance(location);
  return true;
}
