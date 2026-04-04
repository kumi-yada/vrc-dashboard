<script lang="ts">
  import { onMount } from "svelte";
  import TopBar from "./TopBar.svelte";
  import InstanceCard from "./InstanceCard.svelte";
  import FriendsSidebar from "./FriendsSidebar.svelte";
  import PhotosPage from "./PhotosPage.svelte";
  import {
    getFriendsStore,
    fetchFriends,
    fetchMutualFriends,
  } from "../stores/friends.svelte";
  import {
    fetchUserProfile,
    fetchWorld,
    getAuth,
    refreshCurrentUser,
  } from "../stores/auth.svelte";
  import type { InstanceGroup, UserProfile, WorldData } from "../types";
  import UserMenuDialog from "./UserMenuDialog.svelte";
  import WorldDialog from "./WorldDialog.svelte";
  import Icon from "@iconify/svelte";

  const friends = getFriendsStore();
  const auth = getAuth();
  let activeTab = $state("friends");
  let photosRefreshToken = $state(0);
  let refreshPromise: Promise<void> | null = null;

  let selectedMutualFriends = $state<UserProfile[] | null>(null);
  let selectedProfile = $state<UserProfile | null>(null);
  let profileLoading = $state(false);
  let profileError = $state<string | null>(null);
  let profileDialogOpen = $state(false);
  let profileRequestToken = 0;
  let selectedWorld = $state<WorldData | null>(null);
  let selectedGroup = $state<InstanceGroup | null>(null);
  let worldLoading = $state(false);
  let worldError = $state<string | null>(null);
  let worldDialogOpen = $state(false);
  let worldRequestToken = 0;

  async function refreshDashboardData(): Promise<void> {
    if (refreshPromise) return refreshPromise;

    refreshPromise = Promise.all([refreshCurrentUser(), fetchFriends(true)])
      .then(() => undefined)
      .finally(() => {
        refreshPromise = null;
      });

    return refreshPromise;
  }

  onMount(() => {
    void refreshDashboardData();
  });

  async function handleRefresh() {
    if (activeTab === "photos") {
      await refreshCurrentUser();
      photosRefreshToken += 1;
      return;
    }

    await refreshDashboardData();
  }

  function handleWindowFocus() {
    if (activeTab === "photos") {
      void refreshCurrentUser();
      photosRefreshToken += 1;
      return;
    }

    void refreshDashboardData();
  }

  function handleVisibilityChange() {
    if (document.visibilityState !== "visible") return;

    if (activeTab === "photos") {
      void refreshCurrentUser();
      photosRefreshToken += 1;
      return;
    }

    void refreshDashboardData();
  }

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
          if (requestToken !== profileRequestToken) {
            return;
          }
          selectedMutualFriends = mutuals;
        })
        .catch(() => {
          if (requestToken !== profileRequestToken) {
            return;
          }
          selectedMutualFriends = null;
        });

      if (requestToken !== profileRequestToken) {
        return;
      }

      selectedProfile = profile;
    } catch (error) {
      if (requestToken !== profileRequestToken) {
        return;
      }

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

      if (requestToken !== worldRequestToken) {
        return;
      }

      selectedWorld = world;
    } catch (error) {
      if (requestToken !== worldRequestToken) {
        return;
      }

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
</script>

<svelte:window onfocus={handleWindowFocus} />
<svelte:document onvisibilitychange={handleVisibilityChange} />

<div class="dashboard">
  <TopBar {activeTab} onTabChange={(tab) => (activeTab = tab)} />

  <div class="subheader">
    {#if activeTab === "friends"}
      <div class="search-wrapper">
        <Icon icon="mdi:magnify" width={18} />
        <input
          type="text"
          placeholder="Search friends or worlds..."
          bind:value={friends.searchQuery}
          class="search-input"
        />
      </div>
    {:else if activeTab === "photos"}
      <div class="section-label">
        <Icon icon="mdi:image-multiple" width={18} />
        <span>Your VRChat Prints</span>
      </div>
    {:else}
      <div class="section-label">
        <Icon icon="mdi:earth" width={18} />
        <span>Worlds</span>
      </div>
    {/if}

    <div class="online-info">
      <button
        class="refresh-btn"
        onclick={handleRefresh}
        disabled={activeTab === "friends" && friends.loading}
        title="Refresh"
      >
        <Icon
          icon="mdi:refresh"
          width={20}
          class={activeTab === "friends" && friends.loading ? "spinning" : ""}
        />
      </button>
      {#if activeTab === "friends"}
        <span class="online-count"
          >{friends.onlineCount}/{friends.totalCount} Online</span
        >
      {:else if activeTab === "photos"}
        <span class="online-count">Signed in as {auth.user?.displayName}</span>
      {/if}
    </div>
  </div>

  <div class="content-area">
    {#if activeTab === "friends"}
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
            <button class="retry-btn" onclick={handleRefresh}>Retry</button>
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
    {:else if activeTab === "photos"}
      <div class="main-content photos-content">
        <PhotosPage refreshToken={photosRefreshToken} />
      </div>
    {:else}
      <div class="main-content">
        <div class="empty-state">
          <Icon icon="mdi:construction" width={48} />
          <p>Coming soon</p>
        </div>
      </div>
    {/if}
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
</div>

<style>
  .dashboard {
    display: flex;
    flex-direction: column;
    height: 100%;
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

  .section-label {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
    color: var(--text-secondary);
    min-height: 38px;
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

  .content-area {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  .main-content {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
  }

  .photos-content {
    padding-top: 1.25rem;
  }

  .instances-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
    gap: 0.75rem;
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

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
</style>
