<script lang="ts">
  import Icon from "@iconify/svelte";
  import { fetchInstance, fetchWorld, getAuth } from "../../stores/auth.svelte";
  import { resolveOwnerName } from "../../stores/friends.svelte";
  import { parseInstanceId } from "../../utils/instance";
  import type { InstanceData, InstanceGroup, WorldData } from "../../types";
  import RecentInstanceCard from "../RecentInstanceCard.svelte";
  import WorldDialog from "../WorldDialog.svelte";
  import {
    getSavedInstances,
    removeSavedInstanceByLocation,
    type SavedInstance,
  } from "../../stores/saved-instances.svelte";

  interface Props {
    refreshToken: number;
    onRefresh?: () => void;
  }

  let { refreshToken, onRefresh }: Props = $props();

  const auth = getAuth();
  const savedStore = getSavedInstances();

  let groups = $state<InstanceGroup[]>([]);
  let loading = $state(false);
  let error = $state<string | null>(null);

  // World dialog state
  let selectedWorld = $state<WorldData | null>(null);
  let selectedGroup = $state<InstanceGroup | null>(null);
  let worldLoading = $state(false);
  let worldError = $state<string | null>(null);
  let worldDialogOpen = $state(false);
  let worldRequestToken = 0;

  function buildStubInstance(location: string, parsed: InstanceGroup["parsed"], world: WorldData): InstanceData {
    return {
      id: location,
      instanceId: parsed.instancePart,
      worldId: parsed.worldId,
      type: "",
      region: parsed.region,
      n_users: 0,
      userCount: 0,
      capacity: world.capacity,
      recommendedCapacity: world.recommendedCapacity,
      world,
    };
  }

  async function load(entries: SavedInstance[]) {
    loading = true;
    error = null;
    groups = [];

    try {
      const sorted = [...entries].sort((a, b) => b.addedAt.localeCompare(a.addedAt));

      const mapped = await Promise.all(
        sorted.map(async (entry): Promise<InstanceGroup | null> => {
          const parsed = parseInstanceId(entry.location);
          if (!parsed) return null;

          let instance = await fetchInstance(entry.location).catch(() => null);
          let world = instance?.world ?? null;
          if (!world) {
            world = await fetchWorld(parsed.worldId).catch(() => null);
          }
          if (!world) return null;
          if (!instance) {
            instance = buildStubInstance(entry.location, parsed, world);
          }

          let ownerName = "";
          if (parsed.ownerId) {
            ownerName =
              auth.user?.id === parsed.ownerId
                ? auth.user.displayName
                : await resolveOwnerName(parsed.ownerId).catch(() => "");
          }

          return {
            location: entry.location,
            parsed,
            instance,
            ownerName,
            friends: [],
          };
        }),
      );

      groups = mapped.filter((g): g is InstanceGroup => g !== null);
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    } finally {
      loading = false;
    }
  }

  $effect(() => {
    const entries = savedStore.instances;
    void refreshToken;
    void load(entries);
  });

  function handleRemove(location: string) {
    removeSavedInstanceByLocation(location);
  }

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

<div class="instances-page">
  <div class="subheader">
    <span class="page-title">
      <Icon icon="mdi:bookmark" width={18} />
      Saved Instances
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
    {#if loading && groups.length === 0}
      <div class="state-view">
        <Icon icon="mdi:loading" width={32} class="spinning" />
        <p>Loading saved instances…</p>
      </div>
    {:else if error}
      <div class="state-view error-view">
        <Icon icon="mdi:alert-circle-outline" width={32} />
        <p>{error}</p>
        <button class="retry-btn" onclick={() => void load(savedStore.instances)}>Retry</button>
      </div>
    {:else if groups.length === 0}
      <div class="state-view">
        <Icon icon="mdi:bookmark-outline" width={48} />
        <p>No saved instances</p>
        <p class="hint">Open an instance and tap the bookmark to save it here.</p>
      </div>
    {:else}
      <div class="instances-grid">
        {#each groups as group (group.location)}
          <div class="card-wrap">
            <RecentInstanceCard {group} onOpen={handleInstanceOpen} />
            <button
              class="remove-btn"
              type="button"
              title="Remove from saved instances"
              onclick={() => handleRemove(group.location)}
            >
              <Icon icon="mdi:bookmark-remove" width={14} />
            </button>
          </div>
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
  .instances-page {
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

  .card-wrap {
    position: relative;
    display: flex;
  }

  .card-wrap :global(.recent-card) {
    flex: 1;
    min-width: 0;
  }

  .remove-btn {
    position: absolute;
    top: 0.4rem;
    right: 0.4rem;
    z-index: 3;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border-radius: 999px;
    color: rgba(255, 255, 255, 0.85);
    background: rgba(0, 0, 0, 0.45);
    transition:
      background 0.15s,
      color 0.15s;
  }

  .remove-btn:hover {
    background: rgba(239, 83, 80, 0.75);
    color: #fff;
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

  .state-view .hint {
    font-size: 0.8rem;
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
