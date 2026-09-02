<script lang="ts">
  import Icon from "@iconify/svelte";
  import { getAuth, fetchMyAvatars, fetchMyWorlds } from "../../stores/auth.svelte";
  import type { AvatarData, WorldData } from "../../types";
  import AvatarCard from "../AvatarCard.svelte";
  import AvatarDialog from "../AvatarDialog.svelte";
  import MyWorldCard from "../MyWorldCard.svelte";
  import MyWorldDialog from "../MyWorldDialog.svelte";

  interface Props {
    refreshToken: number;
    onRefresh?: () => void;
  }

  let { refreshToken, onRefresh }: Props = $props();

  const auth = getAuth();

  type View = "avatars" | "worlds";

  const VIEWS: { id: View; label: string; icon: string }[] = [
    { id: "avatars", label: "Avatars", icon: "mdi:human" },
    { id: "worlds", label: "Worlds", icon: "mdi:earth" },
  ];

  let view = $state<View>("avatars");
  let searchQuery = $state("");

  let allAvatars = $state<AvatarData[]>([]);
  let avatarsLoading = $state(false);
  let avatarsError = $state<string | null>(null);

  let allWorlds = $state<WorldData[]>([]);
  let worldsLoading = $state(false);
  let worldsError = $state<string | null>(null);

  let lastRefreshToken = -1;
  let avatarsRequested = false;
  let worldsRequested = false;

  const loading = $derived(view === "avatars" ? avatarsLoading : worldsLoading);
  const error = $derived(view === "avatars" ? avatarsError : worldsError);
  const totalCount = $derived(view === "avatars" ? allAvatars.length : allWorlds.length);

  const filteredAvatars = $derived.by(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allAvatars;
    return allAvatars.filter((a) => a.name.toLowerCase().includes(q));
  });

  const filteredWorlds = $derived.by(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allWorlds;
    return allWorlds.filter((w) => w.name.toLowerCase().includes(q));
  });

  const filteredCount = $derived(
    view === "avatars" ? filteredAvatars.length : filteredWorlds.length,
  );

  function getUpdatedAtTime(item: { updated_at?: string }): number {
    if (!item.updated_at) return Number.NEGATIVE_INFINITY;
    const time = new Date(item.updated_at).getTime();
    return Number.isNaN(time) ? Number.NEGATIVE_INFINITY : time;
  }

  let selectedAvatar = $state<AvatarData | null>(null);
  let avatarDialogOpen = $state(false);
  let selectedWorld = $state<WorldData | null>(null);
  let worldDialogOpen = $state(false);

  $effect(() => {
    if (refreshToken !== lastRefreshToken) {
      lastRefreshToken = refreshToken;
      avatarsRequested = false;
      worldsRequested = false;
    }

    if (view === "avatars") {
      if (!avatarsRequested) {
        avatarsRequested = true;
        void loadAvatars();
      }
    } else if (!worldsRequested) {
      worldsRequested = true;
      void loadWorlds();
    }
  });

  async function loadAvatars() {
    const userId = auth.currentUserId;
    if (!userId) {
      avatarsError = "Not logged in";
      return;
    }

    avatarsLoading = true;
    avatarsError = null;

    try {
      allAvatars = (await fetchMyAvatars(userId)).sort(
        (a, b) => getUpdatedAtTime(b) - getUpdatedAtTime(a),
      );
    } catch (e) {
      avatarsError = e instanceof Error ? e.message : String(e);
    } finally {
      avatarsLoading = false;
    }
  }

  async function loadWorlds() {
    if (!auth.currentUserId) {
      worldsError = "Not logged in";
      return;
    }

    worldsLoading = true;
    worldsError = null;

    try {
      allWorlds = (await fetchMyWorlds()).sort(
        (a, b) => getUpdatedAtTime(b) - getUpdatedAtTime(a),
      );
    } catch (e) {
      worldsError = e instanceof Error ? e.message : String(e);
    } finally {
      worldsLoading = false;
    }
  }

  function retry() {
    if (view === "avatars") {
      void loadAvatars();
    } else {
      void loadWorlds();
    }
  }

  function handleAvatarOpen(avatar: AvatarData) {
    selectedAvatar = avatar;
    avatarDialogOpen = true;
  }

  function handleAvatarClose() {
    avatarDialogOpen = false;
    selectedAvatar = null;
  }

  function handleWorldOpen(world: WorldData) {
    selectedWorld = world;
    worldDialogOpen = true;
  }

  function handleWorldClose() {
    worldDialogOpen = false;
    selectedWorld = null;
  }
</script>

<div class="avatars-page">
  <div class="subheader">
    <div class="view-tabs">
      {#each VIEWS as tab (tab.id)}
        <button
          class="view-tab"
          class:active={view === tab.id}
          type="button"
          onclick={() => (view = tab.id)}
        >
          <Icon icon={tab.icon} width={14} />
          {tab.label}
        </button>
      {/each}
    </div>
    <div class="search-wrapper">
      <Icon icon="mdi:magnify" width={16} class="search-icon" />
      <input
        type="text"
        class="search-input"
        placeholder={view === "avatars" ? "Search avatars…" : "Search worlds…"}
        bind:value={searchQuery}
      />
    </div>
    <div class="controls">
      <button
        class="refresh-btn"
        type="button"
        onclick={onRefresh}
        disabled={loading}
        title="Refresh"
      >
        <Icon icon="mdi:refresh" width={20} class={loading ? "spinning" : ""} />
      </button>
      {#if totalCount > 0}
        {@const noun = view === "avatars" ? "avatar" : "world"}
        <span class="count">
          {filteredCount === totalCount
            ? `${totalCount} ${noun}${totalCount === 1 ? "" : "s"}`
            : `${filteredCount} / ${totalCount}`}
        </span>
      {/if}
    </div>
  </div>

  <div class="content">
    {#if loading}
      <div class="state-view">
        <Icon icon="mdi:loading" width={32} class="spinning" />
        <p>{view === "avatars" ? "Loading avatars…" : "Loading worlds…"}</p>
      </div>
    {:else if error}
      <div class="state-view error-view">
        <Icon icon="mdi:alert-circle-outline" width={32} />
        <p>{error}</p>
        <button class="retry-btn" onclick={retry}>Retry</button>
      </div>
    {:else if view === "avatars"}
      {#if filteredAvatars.length === 0}
        <div class="state-view">
          <Icon icon="mdi:human-off" width={48} />
          <p>{searchQuery ? "No avatars match your search" : "No uploaded avatars found"}</p>
        </div>
      {:else}
        <div class="item-grid">
          {#each filteredAvatars as avatar (avatar.id)}
            <AvatarCard {avatar} onOpen={handleAvatarOpen} />
          {/each}
        </div>
      {/if}
    {:else if filteredWorlds.length === 0}
      <div class="state-view">
        <Icon icon="mdi:earth-off" width={48} />
        <p>{searchQuery ? "No worlds match your search" : "No uploaded worlds found"}</p>
      </div>
    {:else}
      <div class="item-grid">
        {#each filteredWorlds as world (world.id)}
          <MyWorldCard {world} onOpen={handleWorldOpen} />
        {/each}
      </div>
    {/if}
  </div>
</div>

{#if avatarDialogOpen}
  <AvatarDialog avatar={selectedAvatar} onClose={handleAvatarClose} />
{/if}

{#if worldDialogOpen}
  <MyWorldDialog world={selectedWorld} onClose={handleWorldClose} />
{/if}

<style>
  .avatars-page {
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
    gap: 0.75rem;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
    flex-wrap: wrap;
  }

  .view-tabs {
    display: flex;
    gap: 0.25rem;
    flex-shrink: 0;
  }

  .view-tab {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.3rem 0.7rem;
    border-radius: 6px;
    font-size: 0.82rem;
    color: var(--text-secondary);
    border: 1px solid transparent;
    transition: all 0.15s;
    cursor: pointer;
  }

  .view-tab:hover {
    color: var(--text-primary);
    background: rgba(255, 255, 255, 0.05);
  }

  .view-tab.active {
    color: var(--text-primary);
    border-color: var(--border);
    background: rgba(255, 255, 255, 0.06);
  }

  .search-wrapper {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: var(--bg-input);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 0.35rem 0.75rem;
    flex: 1;
    min-width: 140px;
    max-width: 400px;
    transition: border-color 0.15s;
    color: var(--text-muted);
  }

  .search-wrapper:focus-within {
    border-color: var(--accent);
  }

  .search-input {
    flex: 1;
    min-width: 0;
    background: transparent;
    color: var(--text-primary);
    font-size: 0.9rem;
  }

  .search-input::placeholder {
    color: var(--text-muted);
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
  }

  .item-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: 0.5rem;
  }

  @media (max-width: 560px) {
    .item-grid {
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

  .state-view p {
    margin: 0;
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
