<script lang="ts">
  import Icon from "@iconify/svelte";
  import { getAuth, fetchMyAvatars } from "../../stores/auth.svelte";
  import type { AvatarData } from "../../types";
  import AvatarCard from "../AvatarCard.svelte";
  import AvatarDialog from "../AvatarDialog.svelte";

  interface Props {
    refreshToken: number;
    onRefresh?: () => void;
  }

  let { refreshToken, onRefresh }: Props = $props();

  const auth = getAuth();

  let allAvatars = $state<AvatarData[]>([]);
  let searchQuery = $state("");
  let loading = $state(false);
  let error = $state<string | null>(null);
  let lastRefreshToken = -1;

  const filteredAvatars = $derived.by(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allAvatars;
    return allAvatars.filter((a) => a.name.toLowerCase().includes(q));
  });

  function getUpdatedAtTime(avatar: AvatarData): number {
    if (!avatar.updated_at) return Number.NEGATIVE_INFINITY;
    const time = new Date(avatar.updated_at).getTime();
    return Number.isNaN(time) ? Number.NEGATIVE_INFINITY : time;
  }

  let selectedAvatar = $state<AvatarData | null>(null);
  let dialogOpen = $state(false);

  $effect(() => {
    if (refreshToken === lastRefreshToken) return;
    lastRefreshToken = refreshToken;
    void loadAvatars();
  });

  async function loadAvatars() {
    const userId = auth.currentUserId;
    if (!userId) {
      error = "Not logged in";
      return;
    }

    loading = true;
    error = null;

    try {
      allAvatars = (await fetchMyAvatars(userId)).sort(
        (a, b) => getUpdatedAtTime(b) - getUpdatedAtTime(a),
      );
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    } finally {
      loading = false;
    }
  }

  function handleOpen(avatar: AvatarData) {
    selectedAvatar = avatar;
    dialogOpen = true;
  }

  function handleClose() {
    dialogOpen = false;
    selectedAvatar = null;
  }
</script>

<div class="avatars-page">
  <div class="subheader">
    <div class="search-wrapper">
      <Icon icon="mdi:magnify" width={16} class="search-icon" />
      <input
        type="text"
        class="search-input"
        placeholder="Search avatars…"
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
      {#if allAvatars.length > 0}
        <span class="count">
          {filteredAvatars.length === allAvatars.length
            ? `${allAvatars.length} avatar${allAvatars.length === 1 ? "" : "s"}`
            : `${filteredAvatars.length} / ${allAvatars.length}`}
        </span>
      {/if}
    </div>
  </div>

  <div class="content">
    {#if loading}
      <div class="state-view">
        <Icon icon="mdi:loading" width={32} class="spinning" />
        <p>Loading avatars…</p>
      </div>
    {:else if error}
      <div class="state-view error-view">
        <Icon icon="mdi:alert-circle-outline" width={32} />
        <p>{error}</p>
        <button class="retry-btn" onclick={() => void loadAvatars()}>Retry</button>
      </div>
    {:else if filteredAvatars.length === 0}
      <div class="state-view">
        <Icon icon="mdi:human-off" width={48} />
        <p>{searchQuery ? "No avatars match your search" : "No uploaded avatars found"}</p>
      </div>
    {:else}
      <div class="avatars-grid">
        {#each filteredAvatars as avatar (avatar.id)}
          <AvatarCard {avatar} onOpen={handleOpen} />
        {/each}
      </div>
    {/if}
  </div>
</div>

{#if dialogOpen}
  <AvatarDialog avatar={selectedAvatar} onClose={handleClose} />
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
    gap: 1rem;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
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
    max-width: 400px;
    transition: border-color 0.15s;
    color: var(--text-muted);
  }

  .search-wrapper:focus-within {
    border-color: var(--accent);
  }

  .search-input {
    flex: 1;
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

  .avatars-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: 0.5rem;
  }

  @media (max-width: 560px) {
    .avatars-grid {
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
