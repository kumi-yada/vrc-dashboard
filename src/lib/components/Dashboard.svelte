<script lang="ts">
  import { onMount } from "svelte";
  import TopBar from "./TopBar.svelte";
  import FriendsPage from "./FriendsPage.svelte";
  import WorldsPage from "./WorldsPage.svelte";
  import RecentPage from "./RecentPage.svelte";
  import AvatarsPage from "./AvatarsPage.svelte";
  import { refreshCurrentUser } from "../stores/auth.svelte";

  const REFRESH_COOLDOWN_MS = 30_000;

  let activeTab = $state("friends");
  let friendsRefreshToken = $state(0);
  let worldsRefreshToken = $state(0);
  let recentRefreshToken = $state(0);
  let avatarsRefreshToken = $state(0);
  let refreshPromise: Promise<void> | null = null;
  let lastRefreshTime = 0;

  function isCoolingDown(): boolean {
    return Date.now() - lastRefreshTime < REFRESH_COOLDOWN_MS;
  }

  function refreshActiveTab() {
    if (activeTab === "friends") friendsRefreshToken += 1;
    else if (activeTab === "worlds") worldsRefreshToken += 1;
    else if (activeTab === "recent") recentRefreshToken += 1;
    else if (activeTab === "avatars") avatarsRefreshToken += 1;
  }

  async function refreshDashboardData(): Promise<void> {
    if (refreshPromise) return refreshPromise;
    friendsRefreshToken += 1;
    worldsRefreshToken += 1;
    recentRefreshToken += 1;
    avatarsRefreshToken += 1;
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
    if (isCoolingDown()) return;

    lastRefreshTime = Date.now();
    refreshActiveTab();
    void refreshCurrentUser();
  }

  function handleVisibilityChange() {
    if (document.visibilityState !== "visible") return;
    if (isCoolingDown()) return;

    lastRefreshTime = Date.now();
    refreshActiveTab();
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
    {:else if activeTab === "worlds"}
      <WorldsPage refreshToken={worldsRefreshToken} onRefresh={handleRefresh} />
    {:else if activeTab === "recent"}
      <RecentPage refreshToken={recentRefreshToken} onRefresh={() => { recentRefreshToken += 1; }} />
    {:else if activeTab === "avatars"}
      <AvatarsPage refreshToken={avatarsRefreshToken} onRefresh={handleRefresh} />
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
