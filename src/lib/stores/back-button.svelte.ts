import { onBackButtonPress } from "@tauri-apps/api/app";
import { invoke } from "@tauri-apps/api/core";
import { isAndroid } from "../utils/platform";

type BackHandler = () => boolean;

const handlers: BackHandler[] = [];
let initialized = false;

export function registerBackHandler(handler: BackHandler): () => void {
  handlers.push(handler);
  return () => {
    const index = handlers.indexOf(handler);
    if (index !== -1) handlers.splice(index, 1);
  };
}

export function initBackButton(): void {
  if (!isAndroid || initialized) return;
  initialized = true;

  // Registering a listener takes over the default back behavior, so the app
  // no longer closes on its own; exit explicitly when nothing handles it.
  void onBackButtonPress(({ canGoBack }) => {
    for (let i = handlers.length - 1; i >= 0; i--) {
      if (handlers[i]()) return;
    }
    if (canGoBack) {
      window.history.back();
    } else {
      void invoke("exit_app");
    }
  });
}
