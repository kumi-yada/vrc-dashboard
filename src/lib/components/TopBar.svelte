<script lang="ts">
  import Icon from "@iconify/svelte";
  import { getCurrentWindow } from "@tauri-apps/api/window";
  import { logout, getAuth } from "../stores/auth.svelte";
  import UserMenuDialog from "./UserMenuDialog.svelte";
  import UserAvatar from "./UserAvatar.svelte";

  interface Props {
    activeTab: string;
    onTabChange: (tab: string) => void;
  }

  let { activeTab, onTabChange }: Props = $props();

  const auth = getAuth();
  const appWindow = getCurrentWindow();
  const isDesktop =
    typeof window !== "undefined" &&
    "__TAURI_INTERNALS__" in
      (window as Window & { __TAURI_INTERNALS__?: unknown });
  let showUserMenu = $state(false);

  const tabs = [
    { id: "friends", label: "Friends", icon: "mdi:account-group" },
    { id: "worlds", label: "Worlds", icon: "mdi:earth" },
    { id: "photos", label: "Photos", icon: "mdi:image-multiple" },
  ];

  async function handleLogout() {
    showUserMenu = false;
    await logout();
  }

  async function minimizeWindow() {
    if (!isDesktop) return;
    await appWindow.minimize();
  }

  async function toggleMaximizeWindow() {
    if (!isDesktop) return;
    await appWindow.toggleMaximize();
  }

  async function closeWindow() {
    if (!isDesktop) return;
    await appWindow.close();
  }
</script>

<nav class="topbar">
  <div class="tabs">
    {#each tabs as tab (tab.id)}
      <button
        class="tab"
        class:active={activeTab === tab.id}
        onclick={() => onTabChange(tab.id)}
      >
        <Icon icon={tab.icon} width={18} />
        {tab.label}
      </button>
    {/each}
  </div>

  <div class="window-drag-region" data-tauri-drag-region></div>

  <div class="actions">
    <button class="icon-btn" title="Notifications">
      <Icon icon="mdi:bell-outline" width={22} />
    </button>
    {#if auth.user}
      <div class="user-menu-wrapper">
        <button
          class="avatar-btn"
          class:active={showUserMenu}
          type="button"
          title={auth.user.displayName}
          onclick={() => (showUserMenu = !showUserMenu)}
        >
          <UserAvatar friend={auth.user} size={32} />
        </button>

        {#if showUserMenu}
          <UserMenuDialog
            user={auth.user}
            onClose={() => (showUserMenu = false)}
            onLogout={handleLogout}
          />
        {/if}
      </div>
    {/if}

    {#if isDesktop}
      <div class="window-controls">
        <button class="window-btn" title="Minimize" onclick={minimizeWindow}>
          <Icon icon="mdi:window-minimize" width={16} />
        </button>
        <button
          class="window-btn"
          title="Maximize"
          onclick={toggleMaximizeWindow}
        >
          <Icon icon="mdi:window-maximize" width={14} />
        </button>
        <button
          class="window-btn window-btn-close"
          title="Close"
          onclick={closeWindow}
        >
          <Icon icon="mdi:close" width={16} />
        </button>
      </div>
    {/if}
  </div>
</nav>

<style>
  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    background: var(--topbar-bg);
    padding: 0 1rem;
    height: 48px;
    flex-shrink: 0;
    border-bottom: 1px solid var(--border);
  }

  .tabs {
    display: flex;
    gap: 0.25rem;
  }

  .window-drag-region {
    flex: 1;
    min-width: 4rem;
    height: 100%;
  }

  .tab {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-size: 0.9rem;
    color: var(--text-secondary);
    transition: all 0.15s;
  }

  .tab:hover {
    color: var(--text-primary);
    background: rgba(255, 255, 255, 0.05);
  }

  .tab.active {
    color: var(--text-primary);
    background: rgba(76, 175, 80, 0.15);
  }

  .actions {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  .window-controls {
    display: flex;
    gap: 0.25rem;
    margin-left: 0.25rem;
  }

  .icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    color: var(--text-secondary);
    transition: all 0.15s;
  }

  .icon-btn:hover {
    color: var(--text-primary);
    background: rgba(255, 255, 255, 0.05);
  }

  .window-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    color: var(--text-secondary);
    transition: all 0.15s;
  }

  .window-btn:hover {
    color: var(--text-primary);
    background: rgba(255, 255, 255, 0.05);
  }

  .window-btn-close:hover {
    color: #fff;
    background: rgba(239, 83, 80, 0.85);
  }

  /* Avatar button */
  .user-menu-wrapper {
    position: relative;
  }

  .avatar-btn {
    position: relative;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    padding: 0;
    border: 2px solid transparent;
    transition: border-color 0.15s;
    cursor: pointer;
  }

  .avatar-btn :global(.user-avatar) {
    width: 100%;
    height: 100%;
    display: block;
  }
</style>
