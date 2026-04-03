import { invoke } from "@tauri-apps/api/core";
import type { Friend, InstanceData, InstanceGroup } from "../types";
import { parseInstanceId } from "../utils/instance";

let onlineFriends = $state.raw<Friend[]>([]);
let offlineFriends = $state.raw<Friend[]>([]);
let privateFriends = $state.raw<Friend[]>([]);
let instanceGroups = $state.raw<InstanceGroup[]>([]);
let loading = $state(false);
let error = $state<string | null>(null);
let searchQuery = $state("");

const instanceCache = new Map<string, InstanceData>();

export function getFriendsStore() {
  const filteredGroups = $derived.by(() => {
    if (!searchQuery.trim()) return instanceGroups;
    const q = searchQuery.toLowerCase();
    return instanceGroups
      .map((g) => ({
        ...g,
        friends: g.friends.filter((f) =>
          f.displayName.toLowerCase().includes(q)
        ),
      }))
      .filter(
        (g) =>
          g.friends.length > 0 ||
          (g.instance?.world?.name?.toLowerCase().includes(q) ?? false)
      );
  });

  const filteredPrivate = $derived.by(() => {
    if (!searchQuery.trim()) return privateFriends;
    const q = searchQuery.toLowerCase();
    return privateFriends.filter((f) =>
      f.displayName.toLowerCase().includes(q)
    );
  });

  const filteredOffline = $derived.by(() => {
    if (!searchQuery.trim()) return offlineFriends;
    const q = searchQuery.toLowerCase();
    return offlineFriends.filter((f) =>
      f.displayName.toLowerCase().includes(q)
    );
  });

  return {
    get instanceGroups() { return filteredGroups; },
    get privateFriends() { return filteredPrivate; },
    get offlineFriends() { return filteredOffline; },
    get onlineCount() { return onlineFriends.length; },
    get totalCount() { return onlineFriends.length + offlineFriends.length; },
    get loading() { return loading; },
    get error() { return error; },
    get searchQuery() { return searchQuery; },
    set searchQuery(v: string) { searchQuery = v; },
  };
}

export async function fetchFriends(): Promise<void> {
  loading = true;
  error = null;

  try {
    const [onlineResult, offlineResult] = await Promise.all([
      invoke<Friend[]>("get_friends", { offline: false }),
      invoke<Friend[]>("get_friends", { offline: true }),
    ]);

    onlineFriends = onlineResult;
    offlineFriends = offlineResult;

    // Categorize online friends
    const inInstance: Friend[] = [];
    const inPrivate: Friend[] = [];

    for (const friend of onlineResult) {
      if (
        !friend.location ||
        friend.location === "private" ||
        friend.location === "offline" ||
        friend.location === ""
      ) {
        inPrivate.push(friend);
      } else {
        inInstance.push(friend);
      }
    }

    privateFriends = inPrivate;

    // Group by location
    const groupMap = new Map<string, Friend[]>();
    for (const friend of inInstance) {
      const list = groupMap.get(friend.location);
      if (list) {
        list.push(friend);
      } else {
        groupMap.set(friend.location, [friend]);
      }
    }

    // Fetch instance details for each unique location
    const groups: InstanceGroup[] = [];
    const fetchPromises: Promise<void>[] = [];

    for (const [location, friends] of groupMap) {
      const parsed = parseInstanceId(location);
      if (!parsed) continue;

      const group: InstanceGroup = { location, parsed, instance: null, friends };
      groups.push(group);

      if (instanceCache.has(location)) {
        group.instance = instanceCache.get(location)!;
      } else {
        fetchPromises.push(
          invoke<InstanceData>("get_instance", { instanceId: location })
            .then((data) => {
              instanceCache.set(location, data);
              group.instance = data;
            })
            .catch(() => {
              // Instance fetch failed, keep null
            })
        );
      }
    }

    await Promise.all(fetchPromises);

    // Sort: groups with more friends first
    groups.sort((a, b) => b.friends.length - a.friends.length);
    instanceGroups = groups;
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  } finally {
    loading = false;
  }
}
