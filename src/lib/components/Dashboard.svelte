<script lang="ts">
  import { onMount } from "svelte";
  import TopBar from "./TopBar.svelte";
  import FriendsPage from "./FriendsPage.svelte";
  import PhotosPage from "./PhotosPage.svelte";
  import { refreshCurrentUser } from "../stores/auth.svelte";
  import Icon from "@iconify/svelte";
  let activeTab = $state("friends");
  let photosRefreshToken = $state(0);
  let friendsRefreshToken = $state(0);
  let refreshPromise: Promise<void> | null = null;

  async function refreshDashboardData(): Promise<void> {
    if (refreshPromise) return refreshPromise;

    friendsRefreshToken += 1;
    refreshPromise = refreshCurrentUser()
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


</script>

<svelte:window onfocus={handleWindowFocus} />
<svelte:document onvisibilitychange={handleVisibilityChange} />

<div class="dashboard">
  <TopBar {activeTab} onTabChange={(tab) => (activeTab = tab)} />

  {#if activeTab !== "friends" && activeTab !== "photos"}
    <div class="subheader">
      <div class="section-label">
        <Icon icon="mdi:earth" width={18} />
        <span>Worlds</span>
      </div>
      <div class="online-info">
        <button
          class="refresh-btn"
          onclick={handleRefresh}
          title="Refresh"
        >
          <Icon icon="mdi:refresh" width={20} />
        </button>
      </div>
    </div>
  {/if}

  <div class="content-area">
    {#if activeTab === "friends"}
      <FriendsPage refreshToken={friendsRefreshToken} onRefresh={refreshDashboardData} />
    {:else if activeTab === "photos"}
      <PhotosPage refreshToken={photosRefreshToken} onRefresh={async () => { await refreshCurrentUser(); photosRefreshToken += 1; }} />
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

  .section-label {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
    color: var(--text-secondary);
    min-height: 38px;
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

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    height: 100%;
    color: var(--text-muted);
  }
</style>
