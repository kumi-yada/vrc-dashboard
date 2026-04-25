<script lang="ts">
  import Icon from "@iconify/svelte";
  import { getCurrentWindow } from "@tauri-apps/api/window";
  import type { Notification } from "../types";
  import {
    clearAllNotifications,
    deleteNotification,
    fetchNotifications,
    logout,
    getAuth,
  } from "../stores/auth.svelte";
  import { showDesktopWindowControls } from "../utils/platform";
  import UserMenuDialog from "./UserMenuDialog.svelte";
  import UserAvatar from "./UserAvatar.svelte";

  interface Props {
    activeTab: string;
    onTabChange: (tab: string) => void;
  }

  let { activeTab, onTabChange }: Props = $props();

  const auth = getAuth();
  const appWindow = getCurrentWindow();
  let showUserMenu = $state(false);
  let showNotifications = $state(false);
  let notifications = $state.raw<Notification[]>([]);
  let notificationsLoading = $state(false);
  let notificationsError = $state<string | null>(null);
  let refetchingNotifications = $state(false);
  let clearingNotifications = $state(false);
  let deletingNotifications = $state.raw<Record<string, boolean>>({});
  let notificationsWrapperEl = $state<HTMLElement | null>(null);
  let userMenuWrapperEl = $state<HTMLElement | null>(null);

  const tabs = [
    { id: "friends", label: "Friends", icon: "mdi:account-group" },
    { id: "worlds", label: "Worlds", icon: "mdi:earth" },
    { id: "recent", label: "Recent", icon: "mdi:history" },
    { id: "photos", label: "Prints", icon: "mdi:image-multiple" },
  ];

  async function handleLogout() {
    showUserMenu = false;
    showNotifications = false;
    await logout();
  }

  function getNotificationFallbackMessage(type: string): string {
    switch (type) {
      case "friendRequest":
        return "sent you a friend request.";
      case "invite":
        return "sent you an invite.";
      default:
        return "sent you a notification.";
    }
  }

  function getNotificationMessage(notification: Notification): string {
    const message = notification.message.trim();
    return message || getNotificationFallbackMessage(notification.type);
  }

  function formatNotificationDate(createdAt: string): string {
    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) {
      return createdAt;
    }

    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    }).format(date);
  }

  function formatNotificationDetails(details: string): string {
    const text = details.trim();
    if (!text || text === "{}") {
      return "";
    }

    try {
      const parsed = JSON.parse(text);
      if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
        return String(parsed);
      }

      const entries = Object.entries(parsed as Record<string, unknown>)
        .map(([key, value]) => `${key}: ${typeof value === "string" ? value : JSON.stringify(value)}`)
        .filter((entry) => entry.length > 0);

      return entries.join(" | ");
    } catch {
      return text;
    }
  }

  function isDeletingNotification(notificationId: string): boolean {
    return deletingNotifications[notificationId] === true;
  }

  async function loadNotifications(manual = false): Promise<void> {
    if (notificationsLoading || refetchingNotifications) {
      return;
    }

    if (manual) {
      refetchingNotifications = true;
    } else {
      notificationsLoading = true;
    }

    notificationsError = null;

    try {
      notifications = await fetchNotifications({
        notificationType: "all",
        sent: false,
        hidden: false,
        offset: 0,
        n: 40,
      });
    } catch (e) {
      notificationsError = e instanceof Error ? e.message : String(e);
    } finally {
      if (manual) {
        refetchingNotifications = false;
      } else {
        notificationsLoading = false;
      }
    }
  }

  async function handleToggleNotifications(): Promise<void> {
    showNotifications = !showNotifications;
    showUserMenu = false;

    if (showNotifications) {
      await loadNotifications();
    }
  }

  function handleToggleUserMenu(): void {
    showUserMenu = !showUserMenu;
    if (showUserMenu) {
      showNotifications = false;
    }
  }

  async function handleRefetchNotifications(): Promise<void> {
    await loadNotifications(true);
  }

  async function handleDeleteNotification(notificationId: string): Promise<void> {
    if (isDeletingNotification(notificationId) || clearingNotifications) {
      return;
    }

    deletingNotifications = {
      ...deletingNotifications,
      [notificationId]: true,
    };

    notificationsError = null;

    try {
      await deleteNotification(notificationId);
      notifications = notifications.filter((notification) => notification.id !== notificationId);
    } catch (e) {
      notificationsError = e instanceof Error ? e.message : String(e);
    } finally {
      const next = { ...deletingNotifications };
      delete next[notificationId];
      deletingNotifications = next;
    }
  }

  async function handleClearAllNotifications(): Promise<void> {
    if (clearingNotifications || notificationsLoading || notifications.length === 0) {
      return;
    }

    clearingNotifications = true;
    notificationsError = null;

    try {
      await clearAllNotifications();
      notifications = [];
    } catch (e) {
      notificationsError = e instanceof Error ? e.message : String(e);
    } finally {
      clearingNotifications = false;
    }
  }

  function handleDocumentClick(event: MouseEvent): void {
    const target = event.target;
    if (!(target instanceof Node)) {
      return;
    }

    if (
      notificationsWrapperEl?.contains(target) ||
      userMenuWrapperEl?.contains(target)
    ) {
      return;
    }

    showNotifications = false;
    showUserMenu = false;
  }

  async function minimizeWindow() {
    if (!showDesktopWindowControls) return;
    await appWindow.minimize();
  }

  async function toggleMaximizeWindow() {
    if (!showDesktopWindowControls) return;
    await appWindow.toggleMaximize();
  }

  async function closeWindow() {
    if (!showDesktopWindowControls) return;
    await appWindow.close();
  }
</script>

<svelte:document onclick={handleDocumentClick} />

<nav class="topbar">
  <div class="tabs">
    {#each tabs as tab (tab.id)}
      <button
        class="tab"
        class:active={activeTab === tab.id}
        onclick={() => onTabChange(tab.id)}
      >
        <Icon icon={tab.icon} width="1.125rem" />
        {tab.label}
      </button>
    {/each}
  </div>

  <div class="window-drag-region" data-tauri-drag-region></div>

  <div class="actions">
    <div class="notifications-wrapper" bind:this={notificationsWrapperEl}>
      <button
        class="icon-btn"
        class:active={showNotifications}
        title="Notifications"
        onclick={() => void handleToggleNotifications()}
      >
        <Icon icon="mdi:bell-outline" width="1.375rem" />
      </button>

      {#if showNotifications}
        <div class="notifications-popup">
          <div class="popup-card notifications-card">
            <div class="notifications-header">
              <h3>Notifications</h3>
              <div class="notifications-header-actions">
                <button
                  class="popup-action-btn"
                  type="button"
                  disabled={notificationsLoading || refetchingNotifications || clearingNotifications}
                  onclick={() => void handleRefetchNotifications()}
                >
                  {refetchingNotifications ? "Refreshing..." : "Refetch"}
                </button>
                <button
                  class="popup-action-btn danger"
                  type="button"
                  disabled={notificationsLoading || clearingNotifications || notifications.length === 0}
                  onclick={() => void handleClearAllNotifications()}
                >
                  {clearingNotifications ? "Clearing..." : "Clear all"}
                </button>
              </div>
            </div>

            {#if notificationsLoading}
              <div class="notifications-state">Loading notifications...</div>
            {:else if notificationsError}
              <div class="notifications-state notifications-state-error">
                {notificationsError}
              </div>
            {:else if notifications.length === 0}
              <div class="notifications-state">No notifications right now.</div>
            {:else}
              <div class="notification-list">
                {#each notifications as notification (notification.id)}
                  {@const detailsText = formatNotificationDetails(notification.details)}
                  <article class="notification-row">
                    <div class="notification-main">
                      <div class="notification-topline">
                        <span class="notification-sender">{notification.senderUsername}</span>
                        <span class="notification-time">
                          {formatNotificationDate(notification.created_at)}
                        </span>
                      </div>
                      <p class="notification-message">
                        {getNotificationMessage(notification)}
                      </p>
                      {#if detailsText}
                        <p class="notification-details">{detailsText}</p>
                      {/if}
                      <p class="notification-type">{notification.type}</p>
                    </div>
                    <button
                      class="notification-delete-btn"
                      type="button"
                      disabled={isDeletingNotification(notification.id) || clearingNotifications}
                      onclick={() => void handleDeleteNotification(notification.id)}
                    >
                      {isDeletingNotification(notification.id) ? "Deleting..." : "Delete"}
                    </button>
                  </article>
                {/each}
              </div>
            {/if}
          </div>
        </div>
      {/if}
    </div>
    {#if auth.user}
      <div class="user-menu-wrapper" bind:this={userMenuWrapperEl}>
        <button
          class="avatar-btn"
          class:active={showUserMenu}
          type="button"
          title={auth.user.displayName}
          onclick={handleToggleUserMenu}
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

    {#if showDesktopWindowControls}
      <div class="window-controls">
        <button class="window-btn" title="Minimize" onclick={minimizeWindow}>
          <Icon icon="mdi:window-minimize" width="1rem" />
        </button>
        <button
          class="window-btn"
          title="Maximize"
          onclick={toggleMaximizeWindow}
        >
          <Icon icon="mdi:window-maximize" width="0.875rem" />
        </button>
        <button
          class="window-btn window-btn-close"
          title="Close"
          onclick={closeWindow}
        >
          <Icon icon="mdi:close" width="1rem" />
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
    min-width: 3rem;
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
    width: var(--ui-control-size-lg);
    height: var(--ui-control-size-lg);
    border-radius: 8px;
    color: var(--text-secondary);
    transition: all 0.15s;
  }

  .icon-btn:hover {
    color: var(--text-primary);
    background: rgba(255, 255, 255, 0.05);
  }

  .icon-btn.active {
    color: var(--text-primary);
    background: rgba(255, 255, 255, 0.06);
  }

  .window-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--ui-control-size-md);
    height: var(--ui-control-size-md);
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
    z-index: 20;
  }

  .popup-card {
    background: var(--bg-primary);
    color: var(--text-primary);
    border: 1px solid var(--border);
    padding: 0.6rem 0.75rem;
    border-radius: 8px;
    min-width: var(--ui-popup-min-width);
    box-shadow: 0 6px 18px rgba(0,0,0,0.35);
    font-size: 0.9rem;
  }

  .notifications-card {
    width: min(var(--ui-notifications-width), calc(100vw - 2rem));
    min-width: var(--ui-popup-wide-min-width);
    text-align: left;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .notifications-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
  }

  .notifications-header h3 {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 600;
  }

  .notifications-header-actions {
    display: flex;
    gap: 0.35rem;
  }

  .popup-action-btn {
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 0.28rem 0.52rem;
    font-size: 0.78rem;
    color: var(--text-secondary);
    transition: all 0.15s;
  }

  .popup-action-btn:hover:enabled {
    color: var(--text-primary);
    background: rgba(255, 255, 255, 0.05);
  }

  .popup-action-btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .popup-action-btn.danger:hover:enabled {
    color: #fff;
    border-color: rgba(239, 83, 80, 0.6);
    background: rgba(239, 83, 80, 0.5);
  }

  .notifications-state {
    border: 1px dashed var(--border);
    border-radius: 8px;
    padding: 0.65rem 0.75rem;
    color: var(--text-secondary);
    text-align: center;
  }

  .notifications-state-error {
    border-style: solid;
    border-color: rgba(239, 83, 80, 0.5);
    color: #ff9f9f;
  }

  .notification-list {
    display: flex;
    flex-direction: column;
    max-height: 22rem;
    overflow-y: auto;
    margin-right: -0.25rem;
    padding-right: 0.25rem;
  }

  .notification-row {
    display: flex;
    gap: 0.65rem;
    padding: 0.6rem 0;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
  }

  .notification-row:first-child {
    border-top: none;
    padding-top: 0.2rem;
  }

  .notification-main {
    min-width: 0;
    flex: 1;
  }

  .notification-topline {
    display: flex;
    gap: 0.5rem;
    align-items: baseline;
    justify-content: space-between;
  }

  .notification-sender {
    font-weight: 600;
    color: var(--text-primary);
  }

  .notification-time {
    color: var(--text-secondary);
    font-size: 0.73rem;
    white-space: nowrap;
  }

  .notification-message,
  .notification-details,
  .notification-type {
    margin: 0.22rem 0 0;
  }

  .notification-message {
    color: var(--text-primary);
    line-height: 1.3;
  }

  .notification-details {
    color: var(--text-secondary);
    font-size: 0.8rem;
    line-height: 1.25;
    word-break: break-word;
  }

  .notification-type {
    color: var(--text-secondary);
    font-size: 0.74rem;
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }

  .notification-delete-btn {
    align-self: flex-start;
    border: 1px solid var(--border);
    border-radius: 6px;
    color: var(--text-secondary);
    padding: 0.2rem 0.45rem;
    font-size: 0.74rem;
    transition: all 0.15s;
    white-space: nowrap;
  }

  .notification-delete-btn:hover:enabled {
    color: #fff;
    border-color: rgba(239, 83, 80, 0.65);
    background: rgba(239, 83, 80, 0.5);
  }

  .notification-delete-btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
</style>
