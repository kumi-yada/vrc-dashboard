<script lang="ts">
  import Icon from "@iconify/svelte";
  import { fetchRecentInstances, fetchInstance, fetchWorld, getAuth } from "../stores/auth.svelte";
  import { resolveOwnerName } from "../stores/friends.svelte";
  import { parseInstanceId } from "../utils/instance";
  import type { InstanceGroup, WorldData } from "../types";
  import RecentInstanceCard from "./RecentInstanceCard.svelte";
  import WorldDialog from "./WorldDialog.svelte";

  interface Props {
    refreshToken: number;
    onRefresh?: () => void;
  }

  let { refreshToken, onRefresh }: Props = $props();

  const auth = getAuth();

  let groups = $state<InstanceGroup[]>([]);
  let loading = $state(false);
  let error = $state<string | null>(null);
  let lastRefreshToken = -1;

  // World dialog state
  let selectedWorld = $state<WorldData | null>(null);
  let selectedGroup = $state<InstanceGroup | null>(null);
  let worldLoading = $state(false);
  let worldError = $state<string | null>(null);
  let worldDialogOpen = $state(false);
  let worldRequestToken = 0;

  async function load() {
    loading = true;
    error = null;
    groups = [];

    try {
      const ids = await fetchRecentInstances();

      if (ids.length === 0) {
        return;
      }

      const instances = await Promise.all(
        ids.map((id) => fetchInstance(id).catch(() => null)),
      );

      const validInstances = instances.filter((inst): inst is NonNullable<typeof inst> => inst !== null);

      const mapped: (InstanceGroup | null)[] = validInstances.map((inst) => {
        const location = inst.id ?? `${inst.worldId}:${inst.instanceId}`;
        const parsed = parseInstanceId(location);
        if (!parsed) return null;

        let ownerName = "";
        if (parsed.ownerId && auth.user?.id === parsed.ownerId) {
          ownerName = auth.user.displayName;
        }

        return {
          location,
          parsed,
          instance: inst,
          ownerName,
          friends: [],
        } as InstanceGroup;
      });

      const resolved = mapped.filter((g): g is InstanceGroup => g !== null);

      await Promise.all(
        resolved
          .filter((g) => g.parsed.ownerId && !g.ownerName)
          .map(async (g) => {
            g.ownerName = await resolveOwnerName(g.parsed.ownerId);
          }),
      );

      groups = resolved;
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    } finally {
      loading = false;
    }
  }

  $effect(() => {
    if (refreshToken === lastRefreshToken) return;
    lastRefreshToken = refreshToken;
    if (refreshToken >= 0) {
      void load();
    }
  });

  function closeWorldDialog() {
    worldDialogOpen = false;
    worldLoading = false;
    worldError = null;
    selectedWorld = null;
    selectedGroup = null;
  }

  async function handleInstanceOpen(group: InstanceGroup) {
    worldDialogOpen = true;
    selectedWorld = group.instance?.world ?? null;
    selectedGroup = group;
    worldLoading = true;
    worldError = null;

    const requestToken = ++worldRequestToken;

    try {
      const full = await fetchWorld(group.parsed.worldId);
      if (requestToken !== worldRequestToken) return;
      selectedWorld = full;
    } catch (e) {
      if (requestToken !== worldRequestToken) return;
      if (!selectedWorld) {
        selectedWorld = group.instance?.world ?? null;
      }
      worldError = e instanceof Error ? e.message : String(e);
    } finally {
      if (requestToken === worldRequestToken) {
        worldLoading = false;
      }
    }
  }
</script>

<div class="recent-page">
  <div class="subheader">
    <span class="page-title">
      <Icon icon="mdi:history" width={18} />
      Recent Instances
    </span>
    <div class="controls">
      <button
        class="refresh-btn"
        onclick={onRefresh}
        disabled={loading}
        title="Refresh"
      >
        <Icon
          icon="mdi:refresh"
          width={20}
          class={loading ? "spinning" : ""}
        />
      </button>
      {#if groups.length > 0}
        <span class="count"
          >{groups.length} instance{groups.length === 1 ? "" : "s"}</span
        >
      {/if}
    </div>
  </div>

  <div class="content">
    {#if loading}
      <div class="state-view">
        <Icon icon="mdi:loading" width={32} class="spinning" />
        <p>Loading recent instances…</p>
      </div>
    {:else if error}
      <div class="state-view error-view">
        <Icon icon="mdi:alert-circle-outline" width={32} />
        <p>{error}</p>
        <button class="retry-btn" onclick={() => void load()}>Retry</button>
      </div>
    {:else if groups.length === 0}
      <div class="state-view">
        <Icon icon="mdi:history" width={48} />
        <p>No recent instances</p>
      </div>
    {:else}
      <div class="instances-grid">
        {#each groups as group (group.location)}
          <RecentInstanceCard {group} onOpen={handleInstanceOpen} />
        {/each}
      </div>
    {/if}
  </div>
</div>

{#if worldDialogOpen}
  <WorldDialog
    world={selectedWorld}
    group={selectedGroup}
    loading={worldLoading}
    error={worldError}
    onClose={closeWorldDialog}
    onOpenInstance={handleInstanceOpen}
  />
{/if}

<style>
  .recent-page {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;
  }

  .subheader {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 1rem;
    gap: 1rem;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }

  .page-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .controls {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-shrink: 0;
  }

  .refresh-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 6px;
    color: var(--text-secondary);
    transition: all 0.15s;
  }

  .refresh-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.05);
    color: var(--text-primary);
  }

  .refresh-btn:disabled {
    opacity: 0.5;
  }

  .count {
    font-size: 0.9rem;
    color: var(--text-secondary);
    white-space: nowrap;
  }

  .content {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .instances-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 0.75rem;
  }

  @media (max-width: 560px) {
    .instances-grid {
      grid-template-columns: minmax(240px, 1fr);
    }
  }

  .state-view {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    flex: 1;
    min-height: 200px;
    color: var(--text-muted);
  }

  .error-view {
    color: #ef5350;
  }

  .retry-btn {
    background: var(--accent);
    color: #fff;
    padding: 0.5rem 1.25rem;
    border-radius: 6px;
    font-size: 0.9rem;
    transition: background 0.2s;
    cursor: pointer;
  }

  .retry-btn:hover {
    background: var(--accent-hover);
  }

  :global(.spinning) {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
</style>
