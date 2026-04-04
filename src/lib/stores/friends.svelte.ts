import { invoke } from "@tauri-apps/api/core";
import type { Friend, InstanceData, InstanceGroup, UserProfile } from "../types";
import { fetchGroupProfile, fetchUserProfile, getAuth } from "./auth.svelte";
import { parseInstanceId } from "../utils/instance";

let onlineFriends = $state.raw<Friend[]>([]);
let offlineFriends = $state.raw<Friend[]>([]);
let privateFriends = $state.raw<Friend[]>([]);
let instanceGroups = $state.raw<InstanceGroup[]>([]);
let loading = $state(false);
let error = $state<string | null>(null);
let searchQuery = $state("");

const instanceCache = new Map<string, InstanceData>();
const ownerNameCache = new Map<string, string>();

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
          (g.instance?.world?.name?.toLowerCase().includes(q) ?? false) ||
          g.ownerName.toLowerCase().includes(q)
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

export async function fetchFriends(reload = false): Promise<void> {
  loading = true;
  error = null;
  const auth = getAuth();

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

      let ownerName = "";
      const ownerFriend = friends.find((friend) => friend.id === parsed.ownerId);

      if (ownerFriend) {
        ownerName = ownerFriend.displayName;
      } else if (auth.user?.id === parsed.ownerId) {
        ownerName = auth.user.displayName;
      } else if (parsed.ownerId) {
        ownerName = ownerNameCache.get(parsed.ownerId) ?? "";
      }

      const group: InstanceGroup = { location, parsed, instance: null, ownerName, friends };
      groups.push(group);

      if (instanceCache.has(location) && !reload) {
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

    const missingOwnerIds = [...new Set(
      groups
        .filter((group) => group.parsed.ownerId && !group.ownerName)
        .map((group) => group.parsed.ownerId)
    )];

    await Promise.all([
      ...fetchPromises,
      ...missingOwnerIds.map(async (ownerId) => {
        try {
          if (ownerId.startsWith("grp_")) {
            const group = await fetchGroupProfile(ownerId);
            ownerNameCache.set(ownerId, group.name);
            return;
          }

          const profile = await fetchUserProfile(ownerId);
          ownerNameCache.set(ownerId, profile.displayName);
        } catch {
          ownerNameCache.set(ownerId, ownerId);
        }
      })
    ]);

    for (const group of groups) {
      if (!group.ownerName && group.parsed.ownerId) {
        group.ownerName = ownerNameCache.get(group.parsed.ownerId) ?? group.parsed.ownerId;
      }
    }

    // Sort: groups with more friends first
    groups.sort((a, b) => b.friends.length - a.friends.length);
    instanceGroups = groups;
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  } finally {
    loading = false;
  }
}

export async function fetchMutualFriends(userId: string): Promise<UserProfile[]> {
    return invoke<UserProfile[]>("get_mutual_friends", { userId });
}
