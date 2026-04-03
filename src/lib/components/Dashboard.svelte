<script lang="ts">
  import TopBar from "./TopBar.svelte";
  import InstanceCard from "./InstanceCard.svelte";
  import FriendsSidebar from "./FriendsSidebar.svelte";
  import { getFriendsStore, fetchFriends } from "../stores/friends.svelte";
  import { getAuth, refreshCurrentUser } from "../stores/auth.svelte";
  import Icon from "@iconify/svelte";

  const friends = getFriendsStore();
  const auth = getAuth();
  let activeTab = $state("friends");

  $effect(() => {
    fetchFriends();
  });

  async function handleRefresh() {
    await Promise.all([refreshCurrentUser(), fetchFriends()]);
  }
</script>

<div class="dashboard">
  <TopBar {activeTab} onTabChange={(tab) => (activeTab = tab)} />

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
      <button class="refresh-btn" onclick={handleRefresh} disabled={friends.loading} title="Refresh">
        <Icon icon="mdi:refresh" width={20} class={friends.loading ? "spinning" : ""} />
      </button>
      <span class="online-count">{friends.onlineCount}/{friends.totalCount} Online</span>
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
              <InstanceCard {group} />
            {/each}
          </div>
        {/if}
      </div>

      <FriendsSidebar
        privateFriends={friends.privateFriends}
        offlineFriends={friends.offlineFriends}
        activeFriendIds={auth.user?.activeFriends || []}
      />
    {:else}
      <div class="main-content">
        <div class="empty-state">
          <Icon icon="mdi:construction" width={48} />
          <p>Coming soon</p>
        </div>
      </div>
    {/if}
  </div>
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

  .instances-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
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
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
</style>
