<script lang="ts">
  import Icon from "@iconify/svelte";
  import { getCurrentWindow } from "@tauri-apps/api/window";
  import { logout, getAuth } from "../stores/auth.svelte";
  import UserAvatar from "./UserAvatar.svelte";
  import StatusDot from "./StatusDot.svelte";

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

  function getTrustLevel(tags: string[]): string {
    if (tags.includes("system_trust_veteran")) return "Trusted";
    if (tags.includes("system_trust_trusted")) return "Known";
    if (tags.includes("system_trust_known")) return "User";
    if (tags.includes("system_trust_basic")) return "New User";
    return "Visitor";
  }

  function getTrustColor(tags: string[]): string {
    if (tags.includes("system_trust_veteran")) return "#CE93D8";
    if (tags.includes("system_trust_trusted")) return "#FF7043";
    if (tags.includes("system_trust_known")) return "#29B6F6";
    if (tags.includes("system_trust_basic")) return "#66BB6A";
    return "#9E9E9E";
  }

  function formatDate(dateStr: string): string {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
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
          title={auth.user.displayName}
          onclick={() => (showUserMenu = !showUserMenu)}
        >
          <UserAvatar friend={auth.user} size={32} />
        </button>

        {#if showUserMenu}
          <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
          <div
            class="backdrop"
            onclick={() => (showUserMenu = false)}
            role="none"
          ></div>
          <div class="user-popup">
            <div class="popup-header">
              <div class="popup-avatar-wrap">
                <UserAvatar friend={auth.user} size={52} />
                <StatusDot
                  status={auth.user.status}
                  size={12}
                  borderWidth={2}
                  borderColor="var(--bg-secondary)"
                />
              </div>
              <div class="popup-identity">
                <span class="popup-displayname">{auth.user.displayName}</span>
                {#if auth.user.pronouns}
                  <span class="popup-pronouns">{auth.user.pronouns}</span>
                {/if}
                <span
                  class="popup-trust"
                  style:color={getTrustColor(auth.user.tags ?? [])}
                >
                  {getTrustLevel(auth.user.tags ?? [])}
                </span>
              </div>
            </div>

            {#if auth.user.statusDescription}
              <div class="popup-status-row">
                <div class="status-dot-wrapper">
                  <StatusDot
                    status={auth.user.status}
                    size={8}
                    borderColor="var(--bg-secondary)"
                  />
                </div>
                <span class="popup-status-text"
                  >{auth.user.statusDescription}</span
                >
              </div>
            {/if}

            {#if auth.user.bio}
              <div class="popup-bio">
                <p>{auth.user.bio}</p>
              </div>
            {/if}

            <div class="popup-stats">
              <div class="stat">
                <span class="stat-value"
                  >{auth.user.onlineFriends?.length ?? 0}</span
                >
                <span class="stat-label">Online</span>
              </div>
              <div class="stat-divider"></div>
              <div class="stat">
                <span class="stat-value">{auth.user.friends?.length ?? 0}</span>
                <span class="stat-label">Friends</span>
              </div>
              {#if auth.user.date_joined}
                <div class="stat-divider"></div>
                <div class="stat">
                  <span class="stat-value stat-date"
                    >{formatDate(auth.user.date_joined)}</span
                  >
                  <span class="stat-label">Joined</span>
                </div>
              {/if}
            </div>

            {#if auth.user.badges?.some((b) => b.showcased)}
              <div class="popup-badges">
                {#each auth.user.badges.filter((b) => b.showcased) as badge (badge.badgeId)}
                  <img
                    src={badge.badgeImageUrl}
                    alt={badge.badgeName}
                    title="{badge.badgeName}: {badge.badgeDescription}"
                    class="badge-img"
                  />
                {/each}
              </div>
            {/if}

            <div class="popup-footer">
              <button class="logout-btn" onclick={handleLogout}>
                <Icon icon="mdi:logout" width={15} />
                Sign Out
              </button>
            </div>
          </div>
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

  /* Backdrop */
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 99;
  }

  /* Popup panel */
  .user-popup {
    position: absolute;
    top: calc(100% + 10px);
    right: 0;
    width: 280px;
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    z-index: 100;
    overflow: hidden;
  }

  .popup-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    background: linear-gradient(
      135deg,
      rgba(76, 175, 80, 0.1),
      rgba(36, 52, 71, 0)
    );
  }

  .popup-avatar-wrap {
    position: relative;
    flex-shrink: 0;
  }

  .popup-avatar-wrap :global(.user-avatar) {
    border: 2px solid var(--border);
  }

  .popup-identity {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    min-width: 0;
  }

  .popup-displayname {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .popup-pronouns {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .popup-trust {
    font-size: 0.72rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  /* Status row */
  .popup-status-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 1rem;
    border-top: 1px solid var(--border);
  }

  .status-dot-wrapper {
    position: relative;
    width: 8px;
    height: 8px;
    flex-shrink: 0;
  }

  .popup-status-text {
    font-size: 0.8rem;
    color: var(--text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Bio */
  .popup-bio {
    padding: 0.5rem 1rem;
    border-top: 1px solid var(--border);
    max-height: 80px;
    overflow-y: auto;
  }

  .popup-bio p {
    font-size: 0.8rem;
    color: var(--text-secondary);
    line-height: 1.5;
    white-space: pre-wrap;
  }

  /* Stats */
  .popup-stats {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.6rem 1rem;
    border-top: 1px solid var(--border);
  }

  .stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.1rem;
  }

  .stat-value {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .stat-date {
    font-size: 0.72rem;
  }

  .stat-label {
    font-size: 0.68rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .stat-divider {
    width: 1px;
    height: 24px;
    background: var(--border);
  }

  /* Badges */
  .popup-badges {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
    padding: 0.5rem 1rem;
    border-top: 1px solid var(--border);
  }

  .badge-img {
    width: 32px;
    height: 32px;
    border-radius: 6px;
    object-fit: contain;
  }

  /* Footer */
  .popup-footer {
    padding: 0.5rem;
    border-top: 1px solid var(--border);
  }

  .logout-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    width: 100%;
    padding: 0.5rem;
    border-radius: 8px;
    font-size: 0.85rem;
    color: #ef5350;
    transition: background 0.15s;
  }

  .logout-btn:hover {
    background: rgba(239, 83, 80, 0.12);
  }
</style>
