import { invoke } from "@tauri-apps/api/core";
import type { CurrentUser } from "../types";

let token = $state<string | null>(null);
let user = $state<CurrentUser | null>(null);
let error = $state<string | null>(null);
let loading = $state(false);
let initializing = $state(true);
let restorePromise: Promise<void> | null = null;

export function getAuth() {
  return {
    get token() { return token; },
    get user() { return user; },
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

export function restoreSession(): Promise<void> {
  if (restorePromise) return restorePromise;

  restorePromise = (async () => {
    initializing = true;
    error = null;

    try {
      const result = await invoke<CurrentUser>("get_current_user");
      user = result;
    } catch (e) {
      const message = getErrorMessage(e);
      user = null;
      token = null;

      if (isUnauthorizedError(message)) {
        await clearStoredAuth();
      } else {
        error = message;
      }
    } finally {
      initializing = false;
    }
  })();

  return restorePromise;
}

export async function login(authToken: string): Promise<boolean> {
  loading = true;
  error = null;
  try {
    await invoke("set_auth_token", { token: authToken });
    const result = await invoke<CurrentUser>("get_current_user");
    token = authToken;
    user = result;
    return true;
  } catch (e) {
    error = getErrorMessage(e);
    token = null;
    user = null;
    return false;
  } finally {
    loading = false;
  }
}

export async function logout() {
  await clearStoredAuth();
  token = null;
  user = null;
  error = null;
}
