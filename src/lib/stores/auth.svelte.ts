import { invoke } from "@tauri-apps/api/core";
import type { CurrentUser } from "../types";

let token = $state<string | null>(null);
let user = $state<CurrentUser | null>(null);
let error = $state<string | null>(null);
let loading = $state(false);

export function getAuth() {
  return {
    get token() { return token; },
    get user() { return user; },
    get error() { return error; },
    get loading() { return loading; },
    get isAuthenticated() { return user !== null; },
  };
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
    error = e instanceof Error ? e.message : String(e);
    token = null;
    user = null;
    return false;
  } finally {
    loading = false;
  }
}

export function logout() {
  token = null;
  user = null;
  error = null;
}
