<script lang="ts">
  import Icon from "@iconify/svelte";
  import { formatDistanceToNow } from "date-fns";
  import {
    getFriendsStore,
    fetchFriends,
    fetchMutualFriends,
  } from "../../stores/friends.svelte";
  import { fetchUserProfile, fetchWorld, getAuth } from "../../stores/auth.svelte";
  import type { InstanceGroup, UserProfile, WorldData } from "../../types";
  import InstanceCard from "../InstanceCard.svelte";
  import TravelingCard from "../TravelingCard.svelte";
  import PrivateCard from "../PrivateCard.svelte";
  import ActiveCard from "../ActiveCard.svelte";
  import UserMenuDialog from "../UserMenuDialog.svelte";
  import WorldDialog from "../WorldDialog.svelte";
  import UserAvatar from "../UserAvatar.svelte";

  interface Props {
    refreshToken: number;
    onRefresh?: () => void;
  }

  let { refreshToken, onRefresh }: Props = $props();

  const friends = getFriendsStore();
  const auth = getAuth();
  let lastRefreshToken = -1;

  // Offline tab toggle state
  let showOfflineTab = $state(false);

  function toggleOfflineTab(e: MouseEvent) {
    e.stopPropagation();
    showOfflineTab = !showOfflineTab;
  }

  // Sort offline friends by last activity (most recent first)
  let sortedOfflineFriends = $derived.by(() => {
    const activityTime = (friend: any) => {
      const v = friend.last_activity;
      if (!v) return 0;
      if (typeof v === "number") return v;
      const t = Date.parse(String(v));
      return Number.isFinite(t) ? t : 0;
    };

    return [...friends.offlineFriends].sort(
      (a, b) => activityTime(b) - activityTime(a)
    );
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
      <button
        type="button"
        class="online-count"
        class:active={showOfflineTab}
        onclick={toggleOfflineTab}
      >
        {friends.onlineCount}/{friends.totalCount} Online
      </button>
    </div>
  </div>
  <div class="main-content">
    {#if showOfflineTab}
      <!-- Offline friends grid -->
      {#if friends.loading && sortedOfflineFriends.length === 0}
        <div class="loading-state">
          <Icon icon="mdi:loading" width={32} class="spinning" />
          <p>Loading offline friends...</p>
        </div>
      {:else if sortedOfflineFriends.length === 0}
        <div class="empty-state">
          <Icon icon="mdi:account-off-outline" width={48} />
          <p>No offline friends</p>
        </div>
      {:else}
        <div class="offline-grid">
          {#each sortedOfflineFriends as friend (friend.id)}
            <button class="offline-friend-item" onclick={() => handleFriendProfile(friend)}>
              <div class="offline-avatar">
                <UserAvatar {friend} grayscale={100} />
              </div>
              <div class="offline-info">
                <span class="offline-name">{friend.displayName}</span>
                <span class="offline-time">
                  {#if friend.last_activity}
                    {formatDistanceToNow(new Date(friend.last_activity), { addSuffix: true })}
                  {:else}
                    Unknown
                  {/if}
                </span>
              </div>
            </button>
          {/each}
        </div>
      {/if}
    {:else}
      <!-- Instance/friends cards grid -->
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
      {:else if friends.instanceGroups.length === 0 && friends.privateFriends.length === 0 && friends.activeFriends.length === 0 && friends.travelingFriends.length === 0}
        <div class="empty-state">
          <Icon icon="mdi:account-off-outline" width={48} />
          <p>No friends online</p>
        </div>
      {:else}
        <div class="instances-grid">
          {#if friends.travelingFriends.length > 0}
            <TravelingCard
              friends={friends.travelingFriends}
              onFriendProfile={handleFriendProfile}
            />
          {/if}
          {#if friends.privateFriends.length > 0}
            <PrivateCard
              friends={friends.privateFriends}
              onFriendProfile={handleFriendProfile}
            />
          {/if}
          {#if friends.activeFriends.length > 0}
            <ActiveCard
              friends={friends.activeFriends}
              onFriendProfile={handleFriendProfile}
            />
          {/if}
          {#each friends.instanceGroups as group (group.location)}
            <InstanceCard
              {group}
              onFriendProfile={handleFriendProfile}
              onWorldOpen={handleWorldOpen}
            />
          {/each}
        </div>
      {/if}
    {/if}
  </div>
</div>

{#if profileDialogOpen}
  <UserMenuDialog
    user={selectedProfile}
    mutualFriends={selectedMutualFriends}
    showInvite={true}
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
    onOpenInstance={handleWorldOpen}
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
    max-width: 400px;
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
    border: none;
    background: var(--bg-input);
    padding: 0.4rem 0.75rem;
    font-size: 0.9rem;
    color: var(--text-secondary);
    white-space: nowrap;
    cursor: pointer;
    border-radius: 6px;
    transition: all 0.15s;
  }

  .online-count:hover {
    background: rgba(255, 255, 255, 0.05);
    color: var(--text-primary);
  }

  .online-count.active {
    background: rgba(76, 175, 80, 0.15);
    color: var(--accent);
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

  .offline-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 0.75rem;
  }

  .offline-friend-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem;
    background: var(--bg-card);
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.2s;
    text-align: center;
  }

  .offline-friend-item:hover {
    background: var(--bg-card-hover);
  }

  .offline-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    overflow: hidden;
    flex-shrink: 0;
  }

  .offline-info {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    min-width: 0;
    width: 100%;
  }

  .offline-name {
    font-size: 0.8rem;
    font-weight: 500;
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    line-height: 1.2;
  }

  .offline-time {
    font-size: 0.7rem;
    color: var(--text-muted);
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
