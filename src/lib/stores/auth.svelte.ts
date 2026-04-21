import { invoke } from "@tauri-apps/api/core";
import type {
  CreateInstanceRequest,
  CurrentUser,
  InstanceData,
  Notification,
  PrintData,
  UserProfile,
  WorldData,
} from "../types";

interface GroupProfile {
  id: string;
  name: string;
}

interface CurrentUserIdentifier {
  id: string;
}

interface CurrentUserProfile extends UserProfile {
  location?: string;
  state?: string;
}

interface NotificationQueryOptions {
  notificationType?: string;
  sent?: boolean;
  hidden?: boolean;
  offset?: number;
  n?: number;
}

let token = $state<string | null>(null);
let user = $state<CurrentUser | null>(null);
let currentUserId = $state<string | null>(null);
let error = $state<string | null>(null);
let loading = $state(false);
let initializing = $state(true);
let restorePromise: Promise<void> | null = null;

export function getAuth() {
  return {
    get token() { return token; },
    get user() { return user; },
    get currentUserId() { return currentUserId; },
    get error() { return error; },
    get loading() { return loading; },
    get initializing() { return initializing; },
    get isAuthenticated() { return user !== null; },
  };
}

function getErrorMessage(value: unknown): string {
  return value instanceof Error ? value.message : String(value);
}

function isUnauthorizedError(message: string): boolean {
  return message === "Not authenticated" || message.includes("401");
}

async function clearStoredAuth(): Promise<void> {
  try {
    await invoke("clear_auth_token");
  } catch {
    // Ignore cleanup failures and keep the UI responsive.
  }
}

async function resolveCurrentUserIdentifier(): Promise<CurrentUserIdentifier> {
  const result = await invoke<CurrentUserIdentifier>("get_current_user");
  if (!result?.id) {
    throw new Error("Unable to resolve current user ID");
  }
  return result;
}

async function loadCurrentUserProfile(userId: string): Promise<CurrentUserProfile> {
  return invoke<CurrentUserProfile>("get_user", { userId });
}

async function loadCurrentUser(): Promise<CurrentUser | null> {
  try {
    let resolvedUserId = currentUserId;
    let authUserData: Partial<CurrentUser> = {};

    if (!resolvedUserId) {
      const currentUser = await resolveCurrentUserIdentifier();
      resolvedUserId = currentUser.id;
      currentUserId = resolvedUserId;
      authUserData = currentUser;
    }

    const fullUserProfile = await loadCurrentUserProfile(resolvedUserId);
    const mergedUser = {
      ...authUserData,
      ...fullUserProfile,
    } as CurrentUser;

    user = mergedUser;
    error = null;
    return mergedUser;
  } catch (e) {
    const message = getErrorMessage(e);
    user = null;
    currentUserId = null;
    token = null;

    if (isUnauthorizedError(message)) {
      error = null;
      await clearStoredAuth();
    } else {
      error = message;
    }

    return null;
  }
}

export function restoreSession(): Promise<void> {
  if (restorePromise) return restorePromise;

  restorePromise = (async () => {
    initializing = true;
    error = null;

    try {
      await loadCurrentUser();
    } finally {
      initializing = false;
    }
  })();

  return restorePromise;
}

export async function refreshCurrentUser(): Promise<void> {
  await loadCurrentUser();
}

export async function fetchUserProfile(userId: string): Promise<UserProfile> {
  return invoke<UserProfile>("get_user", { userId });
}

export async function fetchGroupProfile(groupId: string): Promise<GroupProfile> {
  return invoke<GroupProfile>("get_group", { groupId });
}

export async function fetchWorld(worldId: string): Promise<WorldData> {
  return invoke<WorldData>("get_world", { worldId });
}

export async function fetchInstance(instanceId: string): Promise<InstanceData> {
  return invoke<InstanceData>("get_instance", { instanceId });
}

export async function fetchRecentInstances(): Promise<string[]> {
  const result = await invoke<unknown>("get_recent_instances");
  if (Array.isArray(result)) {
    return result.map((item) =>
      typeof item === "string" ? item : String((item as Record<string, unknown>).location ?? (item as Record<string, unknown>).id ?? item),
    );
  }
  return [];
}

export async function fetchNotifications(
  options: NotificationQueryOptions = {},
): Promise<Notification[]> {
  const {
    notificationType = "all",
    sent = false,
    hidden = false,
    offset = 0,
    n = 40,
  } = options;

  return invoke<Notification[]>("get_notifications", {
    notificationType,
    sent,
    hidden,
    offset,
    n,
  });
}

export async function deleteNotification(notificationId: string): Promise<void> {
  await invoke("delete_notification", { notificationId });
}

export async function clearAllNotifications(): Promise<void> {
  await invoke("clear_all_notifications");
}

export async function createInstance(
  payload: CreateInstanceRequest,
): Promise<InstanceData> {
  return invoke<InstanceData>("create_instance", {
    worldId: payload.worldId,
    instanceType: payload.type,
    region: payload.region,
    ownerId: payload.ownerId ?? null,
    canRequestInvite: payload.canRequestInvite ?? false,
  });
}

export async function inviteUserToInstance(
  userId: string,
  instanceId: string,
  messageSlot: number = 0,
): Promise<unknown> {
  return invoke("invite_user", {
    userId,
    instanceId,
    messageSlot,
  });
}

export async function fetchOwnPrints(userId: string): Promise<PrintData[]> {
  return invoke<PrintData[]>("get_own_prints", { userId });
}

export async function searchWorlds(
  query: string,
  tags: string[],
  offset: number,
  n: number,
  sortField: string = "popularity",
  order: "ascending" | "descending" = "descending",
): Promise<WorldData[]> {
  return invoke<WorldData[]>("search_worlds", { query, tags, offset, n, sortField, order });
}

export async function login(authToken: string): Promise<boolean> {
  loading = true;
  error = null;
  try {
    await invoke("set_auth_token", { token: authToken });
    token = authToken;
    currentUserId = null;
    const result = await loadCurrentUser();
    return result !== null;
  } catch (e) {
    error = getErrorMessage(e);
    token = null;
    user = null;
    currentUserId = null;
    return false;
  } finally {
    loading = false;
  }
}

export async function logout() {
  await clearStoredAuth();
  token = null;
  user = null;
  currentUserId = null;
  error = null;
}
