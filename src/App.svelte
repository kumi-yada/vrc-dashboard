<script lang="ts">
  import Login from "./lib/components/Login.svelte";
  import Dashboard from "./lib/components/Dashboard.svelte";
  import { getAuth, restoreSession } from "./lib/stores/auth.svelte";

  const auth = getAuth();

  restoreSession();
</script>

{#if auth.initializing}
  <div class="boot-screen">
    <p>Restoring saved session...</p>
  </div>
{:else if auth.isAuthenticated}
  <Dashboard />
{:else}
  <Login />
{/if}

<style>
  .boot-screen {
    display: grid;
    place-items: center;
    height: 100%;
    color: var(--text-secondary);
    font-size: 0.95rem;
  }
</style>
