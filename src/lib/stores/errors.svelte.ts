import { t } from "./i18n.svelte";

export interface ErrorToast {
  id: number;
  message: string;
  details: string;
}

const AUTO_DISMISS_MS = 10_000;
const MAX_TOASTS = 3;

let toasts = $state<ErrorToast[]>([]);
let nextId = 1;
const timers = new Map<number, ReturnType<typeof setTimeout>>();

export function errorToString(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error) ?? String(error);
  } catch {
    return String(error);
  }
}

export function dismissError(id: number): void {
  const timer = timers.get(id);
  if (timer) clearTimeout(timer);
  timers.delete(id);
  toasts = toasts.filter((toast) => toast.id !== id);
}

export function reportError(message: string, error: unknown): void {
  const details = errorToString(error);
  const toast: ErrorToast = {
    id: nextId++,
    message,
    details: details || t("error.unknown"),
  };

  const evicted = toasts.slice(0, Math.max(0, toasts.length + 1 - MAX_TOASTS));
  for (const old of evicted) dismissError(old.id);

  toasts = [...toasts, toast];
  timers.set(
    toast.id,
    setTimeout(() => dismissError(toast.id), AUTO_DISMISS_MS),
  );
}

export function getErrors() {
  return {
    get toasts() {
      return toasts;
    },
    dismiss: dismissError,
    report: reportError,
  };
}
