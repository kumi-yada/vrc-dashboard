# VRC Dashboard — Agent Instructions

**Stack**: Svelte 5 + Tauri 2.x (Rust backend) + Vite 8.x + TypeScript 6.x + pnpm 10+  
**Icons**: `@iconify/svelte` (`mdi:` prefix) | **Dates**: `date-fns`  
**No** test, lint, typecheck, or format infrastructure exists. No codegen.

## Dev Commands

| Command | Effect |
|---|---|
| `pnpm start` | `tauri dev` — native window, hot-reload |
| `pnpm dev` | `vite` — browser-only at `:1420`; Tauri IPC will fail |
| `pnpm build` | `vite build` → `dist/` |
| `pnpm tauri` | Raw Tauri CLI passthrough |

Android: `pnpm tauri android dev` / `pnpm tauri android build --apk`

**Lockfile required** — CI runs `pnpm install --frozen-lockfile`. Add/update with `pnpm install` (no flag).

## Architecture

```
src/                          # Svelte 5 + TypeScript frontend
  main.ts → App.svelte
  app.css                     # Dark-theme CSS custom properties on :root
  lib/
    types.ts                  # All TS interfaces (Friend, WorldData, InstanceData, etc.)
    stores/
      auth.svelte.ts          # Token, user, login/logout, ALL API wrappers
      friends.svelte.ts       # Online/offline/private friends, instance grouping
      favorites.svelte.ts     # localStorage key "vrc-dashboard-favorites"
      ui-scale.svelte.ts      # DPI-aware zoom
    utils/
      instance.ts             # Instance ID parsing (visibility, region, owner)
      platform.ts             # isDesktop / isAndroid detection
    components/               # 17 Svelte components (see src/lib/components/)
src-tauri/                    # Rust backend
  src/main.rs → app_lib::run()
  src/lib.rs                  # Tauri Builder: manages AuthState, 18 commands
  src/commands.rs             # All proxied VRChat API calls via reqwest
```

## Linux Quirk (Rust)

`lib.rs` sets `WEBKIT_DISABLE_DMABUF_RENDERER=1` before initializing the webview. Required on some Linux GPU combos — do not remove.
