<script lang="ts">
  import { onMount } from "svelte";
  import TopBar from "./TopBar.svelte";
  import FriendsPage from "./FriendsPage.svelte";
  import PhotosPage from "./PhotosPage.svelte";
  import WorldsPage from "./WorldsPage.svelte";
  import { refreshCurrentUser } from "../stores/auth.svelte";
  let activeTab = $state("friends");
  let photosRefreshToken = $state(0);
  let friendsRefreshToken = $state(0);
  let worldsRefreshToken = $state(0);
  let refreshPromise: Promise<void> | null = null;

  async function refreshDashboardData(): Promise<void> {
    if (refreshPromise) return refreshPromise;

    friendsRefreshToken += 1;
    worldsRefreshToken += 1;
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

    friendsRefreshToken += 1;
    void refreshCurrentUser();
  }

  function handleVisibilityChange() {
    if (document.visibilityState !== "visible") return;

    if (activeTab === "photos") {
      void refreshCurrentUser();
      photosRefreshToken += 1;
      return;
    }

    friendsRefreshToken += 1;
    void refreshCurrentUser();
  }


</script>

<svelte:window onfocus={handleWindowFocus} />
<svelte:document onvisibilitychange={handleVisibilityChange} />

<div class="dashboard">
  <TopBar {activeTab} onTabChange={(tab) => (activeTab = tab)} />

  <div class="content-area">
    {#if activeTab === "friends"}
      <FriendsPage refreshToken={friendsRefreshToken} onRefresh={refreshDashboardData} />
    {:else if activeTab === "photos"}
      <PhotosPage refreshToken={photosRefreshToken} onRefresh={async () => { await refreshCurrentUser(); photosRefreshToken += 1; }} />
    {:else if activeTab === "worlds"}
      <WorldsPage refreshToken={worldsRefreshToken} onRefresh={handleRefresh} />
    {/if}
  </div>

</div>

<style>
  .dashboard {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .content-area {
    display: flex;
    flex: 1;
    overflow: hidden;
  }
</style>
