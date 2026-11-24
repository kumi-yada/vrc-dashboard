import { t } from "./i18n.svelte";

export interface ErrorToast {
  id: number;
  message: string;
  details: string;
  kind: "error" | "success";
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

function pushToast(toast: Omit<ErrorToast, "id">): void {
  const full: ErrorToast = { ...toast, id: nextId++ };

  const evicted = toasts.slice(0, Math.max(0, toasts.length + 1 - MAX_TOASTS));
  for (const old of evicted) dismissError(old.id);

  toasts = [...toasts, full];
  timers.set(
    full.id,
    setTimeout(() => dismissError(full.id), AUTO_DISMISS_MS),
  );
}

export function reportError(message: string, error: unknown): void {
  const details = errorToString(error);
  pushToast({
    message,
    details: details || t("error.unknown"),
    kind: "error",
  });
}

export function reportSuccess(message: string): void {
  pushToast({ message, details: "", kind: "success" });
}

export function getErrors() {
  return {
    get toasts() {
      return toasts;
    },
    dismiss: dismissError,
    report: reportError,
    reportSuccess,
  };
}
