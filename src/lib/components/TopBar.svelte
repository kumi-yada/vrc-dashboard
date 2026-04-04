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
  let showNotifications = $state(false);

  const tabs = [
    { id: "friends", label: "Friends", icon: "mdi:account-group" },
    { id: "photos", label: "Prints", icon: "mdi:image-multiple" },
    { id: "worlds", label: "Worlds", icon: "mdi:earth", disabled: true },
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
    <div class="notifications-wrapper">
      <button
        class="icon-btn"
        title="Notifications"
        onclick={() => {
          showNotifications = !showNotifications;
          showUserMenu = false;
        }}
      >
        <Icon icon="mdi:bell-outline" width={22} />
      </button>

      {#if showNotifications}
        <div class="notifications-popup">
          <div class="popup-card">Coming soon</div>
        </div>
      {/if}
    </div>
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
    gap: 0.5rem;
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

  .user-menu-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .avatar-btn :global(.user-avatar) {
    width: 28px;
    height: 28px;
    border-radius: 10px;
    display: block;
  }

  .notifications-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .notifications-popup {
    position: absolute;
    right: 0;
    top: calc(100% + 8px);
  }

  .popup-card {
    background: var(--surface);
    color: var(--text-primary);
    border: 1px solid var(--border);
    padding: 0.6rem 0.75rem;
    border-radius: 8px;
    min-width: 160px;
    box-shadow: 0 6px 18px rgba(0,0,0,0.35);
    font-size: 0.9rem;
    text-align: center;
  }
</style>
