const tauriWindow =
  typeof window !== "undefined" &&
  "__TAURI_INTERNALS__" in
    (window as Window & { __TAURI_INTERNALS__?: unknown });

const androidDevice =
  typeof navigator !== "undefined" && /android/i.test(navigator.userAgent);

export const isDesktop = tauriWindow;
export const isAndroid = androidDevice;
export const showDesktopWindowControls = isDesktop && !isAndroid;
