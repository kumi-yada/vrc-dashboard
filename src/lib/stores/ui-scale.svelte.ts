const STORAGE_KEY = "vrc-dashboard-ui-scale";

export const USER_SCALE_MIN = 0.5;
export const USER_SCALE_MAX = 1.5;
export const USER_SCALE_STEP = 0.05;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function getStorage(): Storage | null {
  if (typeof localStorage === "undefined") {
    return null;
  }
  return localStorage;
}

function loadUserScale(): number {
  try {
    const storage = getStorage();
    if (!storage) return 1;
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return 1;

    const parsed = Number.parseFloat(raw);
    if (!Number.isFinite(parsed)) return 1;

    return clamp(parsed, USER_SCALE_MIN, USER_SCALE_MAX);
  } catch {
    return 1;
  }
}

function saveUserScale(value: number): void {
  try {
    const storage = getStorage();
    if (!storage) return;
    storage.setItem(STORAGE_KEY, value.toString());
  } catch {
    // Ignore storage errors and keep the UI responsive.
  }
}

function applyCssScale(scale: number): void {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  root.style.setProperty("--ui-scale", scale.toFixed(3));
}

// The compositor already scales the window for the display it sits on, so the
// app must not scale again on top of that. This is the user's manual override
// only, and it stays fixed until they move the slider.
let userScale = $state(loadUserScale());

export function getUiScale() {
  return {
    get userScale() {
      return userScale;
    },
  };
}

export function initializeUiScale(): void {
  applyCssScale(userScale);
}

export function setUserScale(nextScale: number): void {
  if (!Number.isFinite(nextScale)) {
    return;
  }

  userScale = clamp(nextScale, USER_SCALE_MIN, USER_SCALE_MAX);
  saveUserScale(userScale);
  applyCssScale(userScale);
}

export function resetUserScale(): void {
  userScale = 1;
  saveUserScale(userScale);
  applyCssScale(userScale);
}
