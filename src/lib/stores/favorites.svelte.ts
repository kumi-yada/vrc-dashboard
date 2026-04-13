export interface FavoriteGroup {
  id: string;
  name: string;
  worldIds: string[];
}

const STORAGE_KEY = "vrc-dashboard-favorites";

function loadFromStorage(): FavoriteGroup[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as FavoriteGroup[];
  } catch {
    return [];
  }
}

function saveToStorage(data: FavoriteGroup[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore storage errors
  }
}

let groups = $state<FavoriteGroup[]>(loadFromStorage());

export function getFavorites() {
  return {
    get groups() {
      return groups;
    },
  };
}

export function createGroup(name: string): FavoriteGroup {
  const group: FavoriteGroup = {
    id: crypto.randomUUID(),
    name: name.trim(),
    worldIds: [],
  };
  groups = [...groups, group];
  saveToStorage(groups);
  return group;
}

export function deleteGroup(groupId: string): void {
  groups = groups.filter((g) => g.id !== groupId);
  saveToStorage(groups);
}

export function toggleWorldInGroup(groupId: string, worldId: string): void {
  groups = groups.map((g) => {
    if (g.id !== groupId) return g;
    return g.worldIds.includes(worldId)
      ? { ...g, worldIds: g.worldIds.filter((id) => id !== worldId) }
      : { ...g, worldIds: [...g.worldIds, worldId] };
  });
  saveToStorage(groups);
}

export function isWorldInAnyGroup(worldId: string): boolean {
  return groups.some((g) => g.worldIds.includes(worldId));
}

export function getGroupsForWorld(worldId: string): string[] {
  return groups.filter((g) => g.worldIds.includes(worldId)).map((g) => g.id);
}
