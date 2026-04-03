<script lang="ts">
  import Login from "./lib/components/Login.svelte";
  import Dashboard from "./lib/components/Dashboard.svelte";
  import { getAuth } from "./lib/stores/auth.svelte";

  const auth = getAuth();
</script>

{#if auth.isAuthenticated}
  <Dashboard />
{:else}
  <Login />
{/if}
