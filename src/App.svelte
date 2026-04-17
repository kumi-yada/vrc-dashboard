<script lang="ts">
  import Login from "./lib/components/Login.svelte";
  import Dashboard from "./lib/components/Dashboard.svelte";
  import { getAuth, restoreSession } from "./lib/stores/auth.svelte";
  import { isAndroid } from "./lib/utils/platform";

  const auth = getAuth();

  restoreSession();
</script>

<div class="app-shell">
  {#if isAndroid}
    <div class="android-safe-area android-safe-area-top" aria-hidden="true"></div>
  {/if}

  <div class="app-content">
    {#if auth.initializing}
      <div class="boot-screen">
        <p>Restoring saved session...</p>
      </div>
    {:else if auth.isAuthenticated}
      <Dashboard />
    {:else}
      <Login />
    {/if}
  </div>

  {#if isAndroid}
    <div class="android-safe-area android-safe-area-bottom" aria-hidden="true"></div>
  {/if}
</div>

<style>
  .app-shell {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .app-content {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  .android-safe-area {
    flex-shrink: 0;
    width: 100%;
  }

  .android-safe-area-top {
    background: var(--topbar-bg);
    height: max(env(safe-area-inset-top), 24px);
  }

  .android-safe-area-bottom {
    background: var(--bg-primary);
    border-top: 1px solid var(--border);
    height: max(env(safe-area-inset-bottom), 32px);
  }

  .boot-screen {
    display: grid;
    place-items: center;
    height: 100%;
    color: var(--text-secondary);
    font-size: 0.95rem;
  }
</style>
