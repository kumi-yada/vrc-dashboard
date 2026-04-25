const STORAGE_KEY = "vrc-dashboard-ui-scale";

const AUTO_SCALE_MIN = 1;
const AUTO_SCALE_MAX = 1.5;
export const USER_SCALE_MIN = 0.9;
export const USER_SCALE_MAX = 1.25;
export const USER_SCALE_STEP = 0.05;

interface AutoScaleInput {
  dpr: number;
  screenWidth: number;
  screenHeight: number;
}

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

function getScreenScale(width: number, height: number): number {
  if (width <= 0 || height <= 0) {
    return 1;
  }

  const baselineWidth = 1920;
  const baselineHeight = 1080;
  const ratio = Math.min(width / baselineWidth, height / baselineHeight);

  // Soft bump for very high-resolution displays where DPR may still be 1.
  return clamp(1 + Math.max(0, ratio - 1) * 0.25, 1, 1.25);
}

function getDprScale(dpr: number): number {
  const normalized = Math.max(1, dpr);

  // Smooth DPR scaling so transitions are less abrupt between monitors.
  return clamp(1 + (normalized - 1) * 0.8, AUTO_SCALE_MIN, AUTO_SCALE_MAX);
}

function applyCssScale(scale: number): void {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  root.style.setProperty("--ui-scale", scale.toFixed(3));
}

let autoScale = $state(1);
let userScale = $state(loadUserScale());

let effectiveScale = $derived(autoScale * userScale);

function updateCssScale(): void {
  applyCssScale(effectiveScale);
}

export function getUiScale() {
  return {
    get autoScale() {
      return autoScale;
    },
    get userScale() {
      return userScale;
    },
    get effectiveScale() {
      return effectiveScale;
    },
  };
}

export function initializeUiScale(): void {
  updateCssScale();
}

export function computeAutoScale(input: AutoScaleInput): number {
  const dprScale = getDprScale(input.dpr);
  const screenScale = getScreenScale(input.screenWidth, input.screenHeight);
  return clamp(Math.max(dprScale, screenScale), AUTO_SCALE_MIN, AUTO_SCALE_MAX);
}

export function setAutoScale(nextScale: number): void {
  if (!Number.isFinite(nextScale)) {
    return;
  }

  autoScale = clamp(nextScale, AUTO_SCALE_MIN, AUTO_SCALE_MAX);
  updateCssScale();
}

export function refreshAutoScale(input: AutoScaleInput): void {
  setAutoScale(computeAutoScale(input));
}

export function setUserScale(nextScale: number): void {
  if (!Number.isFinite(nextScale)) {
    return;
  }

  userScale = clamp(nextScale, USER_SCALE_MIN, USER_SCALE_MAX);
  saveUserScale(userScale);
  updateCssScale();
}

export function resetUserScale(): void {
  userScale = 1;
  saveUserScale(userScale);
  updateCssScale();
}
