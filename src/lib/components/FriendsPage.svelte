<script lang="ts">
  import Icon from "@iconify/svelte";
  import { onMount } from "svelte";
  import {
    getFriendsStore,
    fetchFriends,
    fetchMutualFriends,
  } from "../stores/friends.svelte";
  import { fetchUserProfile, fetchWorld, getAuth } from "../stores/auth.svelte";
  import type { InstanceGroup, UserProfile, WorldData } from "../types";
  import InstanceCard from "./InstanceCard.svelte";
  import FriendsSidebar from "./FriendsSidebar.svelte";
  import UserMenuDialog from "./UserMenuDialog.svelte";
  import WorldDialog from "./WorldDialog.svelte";

  interface Props {
    refreshToken: number;
    onRefresh?: () => void;
  }

  let { refreshToken, onRefresh }: Props = $props();

  const friends = getFriendsStore();
  const auth = getAuth();
  let lastRefreshToken = -1;

  // Online count popover state
  let showOnlinePopover = $state(false);
  let popoverTriggerEl = $state<HTMLElement | null>(null);
  let popoverEl = $state<HTMLElement | null>(null);

  function toggleOnlinePopover(e: MouseEvent) {
    e.stopPropagation();
    showOnlinePopover = !showOnlinePopover;
  }

  function handleDocumentClick(e: MouseEvent) {
    if (!showOnlinePopover) return;
    if (
      !(popoverEl?.contains(e.target as Node) || popoverTriggerEl?.contains(e.target as Node))
    ) {
      showOnlinePopover = false;
    }
  }

  onMount(() => {
    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  });

  // Profile dialog state
  let selectedMutualFriends = $state<UserProfile[] | null>(null);
  let selectedProfile = $state<UserProfile | null>(null);
  let profileLoading = $state(false);
  let profileError = $state<string | null>(null);
  let profileDialogOpen = $state(false);
  let profileRequestToken = 0;

  // World dialog state
  let selectedWorld = $state<WorldData | null>(null);
  let selectedGroup = $state<InstanceGroup | null>(null);
  let worldLoading = $state(false);
  let worldError = $state<string | null>(null);
  let worldDialogOpen = $state(false);
  let worldRequestToken = 0;

  function closeProfileDialog() {
    profileDialogOpen = false;
    profileLoading = false;
    profileError = null;
    selectedProfile = null;
  }

  function closeWorldDialog() {
    worldDialogOpen = false;
    worldLoading = false;
    worldError = null;
    selectedWorld = null;
    selectedGroup = null;
  }

  async function handleFriendProfile(friend: UserProfile) {
    profileDialogOpen = true;
    selectedProfile = friend;
    profileLoading = true;
    profileError = null;

    const requestToken = ++profileRequestToken;

    try {
      const profile = await fetchUserProfile(friend.id);
      fetchMutualFriends(friend.id)
        .then((mutuals) => {
          if (requestToken !== profileRequestToken) return;
          selectedMutualFriends = mutuals;
        })
        .catch(() => {
          if (requestToken !== profileRequestToken) return;
          selectedMutualFriends = null;
        });

      if (requestToken !== profileRequestToken) return;
      selectedProfile = profile;
    } catch (error) {
      if (requestToken !== profileRequestToken) return;
      profileError = error instanceof Error ? error.message : String(error);
    } finally {
      if (requestToken === profileRequestToken) {
        profileLoading = false;
      }
    }
  }

  async function handleWorldOpen(group: InstanceGroup) {
    worldDialogOpen = true;
    selectedWorld = group.instance?.world ?? null;
    selectedGroup = group;
    worldLoading = true;
    worldError = null;

    const requestToken = ++worldRequestToken;

    try {
      const world = await fetchWorld(group.parsed.worldId);
      if (requestToken !== worldRequestToken) return;
      selectedWorld = world;
    } catch (error) {
      if (requestToken !== worldRequestToken) return;
      if (!selectedWorld) {
        selectedWorld = group.instance?.world ?? null;
      }
      worldError = error instanceof Error ? error.message : String(error);
    } finally {
      if (requestToken === worldRequestToken) {
        worldLoading = false;
      }
    }
  }

  $effect(() => {
    if (refreshToken === lastRefreshToken) return;
    lastRefreshToken = refreshToken;
    if (refreshToken > 0) {
      void fetchFriends(true);
    }
  });
</script>

<div class="friends-page">
  <div class="subheader">
    <div class="search-wrapper">
      <Icon icon="mdi:magnify" width={18} />
      <input
        type="text"
        placeholder="Search friends or worlds..."
        bind:value={friends.searchQuery}
        class="search-input"
      />
    </div>
    <div class="online-info">
      <button
        class="refresh-btn"
        onclick={onRefresh}
        disabled={friends.loading}
        title="Refresh"
      >
        <Icon
          icon="mdi:refresh"
          width={20}
          class={friends.loading ? "spinning" : ""}
        />
      </button>
      <span
        class="online-count"
        bind:this={popoverTriggerEl}
        onclick={toggleOnlinePopover}
      >
        {friends.onlineCount}/{friends.totalCount} Online
      </span>
      {#if showOnlinePopover}
        <div class="online-popover" bind:this={popoverEl}>
          <div class="popover-item"><strong>Online:</strong> {friends.onlineCount}</div>
          <div class="popover-item"><strong>Active:</strong> {friends.activeCount}</div>
          <div class="popover-item"><strong>Offline:</strong> {Math.max(0, friends.totalCount - friends.onlineCount)}</div>
        </div>
      {/if}
    </div>
  </div>
  <div class="content-row">
    <div class="main-content">
      {#if friends.loading && friends.instanceGroups.length === 0}
        <div class="loading-state">
          <Icon icon="mdi:loading" width={32} class="spinning" />
          <p>Loading friends...</p>
        </div>
      {:else if friends.error}
        <div class="error-state">
          <Icon icon="mdi:alert-circle-outline" width={32} />
          <p>{friends.error}</p>
          <button class="retry-btn" onclick={() => void fetchFriends(true)}>
            Retry
          </button>
        </div>
      {:else if friends.instanceGroups.length === 0 && friends.privateFriends.length === 0}
        <div class="empty-state">
          <Icon icon="mdi:account-off-outline" width={48} />
          <p>No friends online</p>
        </div>
      {:else}
        <div class="instances-grid">
          {#each friends.instanceGroups as group (group.location)}
            <InstanceCard
              {group}
              onFriendProfile={handleFriendProfile}
              onWorldOpen={handleWorldOpen}
            />
          {/each}
        </div>
      {/if}
    </div>
    <FriendsSidebar
      privateFriends={friends.privateFriends}
      offlineFriends={friends.offlineFriends}
      activeFriendIds={auth.user?.activeFriends || []}
      onFriendProfile={handleFriendProfile}
    />
  </div>
</div>

{#if profileDialogOpen}
  <UserMenuDialog
    user={selectedProfile}
    mutualFriends={selectedMutualFriends}
    loading={profileLoading}
    error={profileError}
    onClose={closeProfileDialog}
    onUserSelected={(user) => handleFriendProfile(user)}
  />
{/if}

{#if worldDialogOpen}
  <WorldDialog
    world={selectedWorld}
    group={selectedGroup}
    loading={worldLoading}
    error={worldError}
    onClose={closeWorldDialog}
  />
{/if}

<style>
  .friends-page {
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
  }

  .search-wrapper {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: var(--bg-input);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 0.4rem 0.75rem;
    flex: 1;
    max-width: 800px;
    color: var(--text-muted);
  }

  .search-wrapper:focus-within {
    border-color: var(--accent);
  }

  .search-input {
    flex: 1;
    font-size: 0.9rem;
  }

  .online-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-shrink: 0;
    position: relative;
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

  .online-count {
    font-size: 0.9rem;
    color: var(--text-secondary);
    white-space: nowrap;
  }

  .content-row {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  .main-content {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
  }

  .instances-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
    gap: 0.75rem;
  }

  @media (max-width: 560px) {
    .instances-grid {
      grid-template-columns: minmax(240px, 1fr);
    }
  }

  .loading-state,
  .error-state,
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    height: 100%;
    color: var(--text-muted);
  }

  .error-state {
    color: #ef5350;
  }

  .retry-btn {
    background: var(--accent);
    color: #fff;
    padding: 0.5rem 1.25rem;
    border-radius: 6px;
    font-size: 0.9rem;
    transition: background 0.2s;
  }

  .retry-btn:hover {
    background: var(--accent-hover);
  }

  :global(.spinning) {
    animation: spin 1s linear infinite;
  }

  .online-popover {
    position: absolute;
    right: 0;
    top: calc(100% + 8px);
    background: var(--bg-primary);
    border: 1px solid var(--border);
    padding: 0.5rem;
    border-radius: 8px;
    box-shadow: 0 6px 18px rgba(0,0,0,0.25);
    min-width: 180px;
    z-index: 20;
    color: var(--text-primary);
  }

  .online-popover .popover-item {
    padding: 0.25rem 0;
    font-size: 0.9rem;
    color: var(--text-secondary);
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
</style>
