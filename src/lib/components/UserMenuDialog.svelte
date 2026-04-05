<script lang="ts">
  import Icon from "@iconify/svelte";
  import { openUrl } from "@tauri-apps/plugin-opener";
  import type { UserProfile } from "../types";
  import StatusDot from "./StatusDot.svelte";
  import UserAvatar from "./UserAvatar.svelte";
  import { formatRelative } from "date-fns";

  interface Props {
    user: UserProfile | null;
    mutualFriends?: UserProfile[] | null;
    onClose: () => void;
    onUserSelected?: (user: UserProfile) => void;
    onLogout?: () => Promise<void> | void;
    loading?: boolean;
    error?: string | null;
  }

  let {
    user,
    mutualFriends,
    onClose,
    onUserSelected,
    onLogout,
    loading = false,
    error = null,
  }: Props = $props();

  const showcasedBadges = $derived(
    user?.badges?.filter((badge) => badge.showcased) ?? [],
  );
  const hasFriendCounts = $derived(
    Array.isArray(user?.friends) || Array.isArray(user?.onlineFriends),
  );
  const canLogout = $derived(Boolean(user && onLogout));
  const mutuals: any[] = $derived(mutualFriends ?? []);

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

  async function handleLogout() {
    if (!onLogout) return;
    onClose();
    await onLogout();
  }

  async function handleProfileOpen() {
    if (!user?.id) return;

    await openUrl(
      `https://vrchat.com/home/user/${encodeURIComponent(user.id)}`,
    );
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      onClose();
    }
  }
</script>

<svelte:document onkeydown={handleKeydown} />

<div class="dialog-backdrop" onclick={onClose} aria-hidden="true"></div>

<div
  class="dialog-shell"
  role="dialog"
  aria-modal="true"
  aria-labelledby="user-menu-title"
>
  <div class="user-dialog">
    <button class="close-btn" type="button" title="Close" onclick={onClose}>
      <Icon icon="mdi:close" width={18} />
    </button>

    {#if user}
      <div class="popup-header">
        <button
          class="popup-avatar-wrap"
          type="button"
          onclick={handleProfileOpen}
          title="Open VRChat profile"
          aria-label={`Open ${user.displayName}'s VRChat profile`}
        >
          <UserAvatar friend={user} size={64} />
          <StatusDot
            status={user.status}
            size={14}
            borderWidth={2}
            borderColor="var(--bg-secondary)"
          />
        </button>
        <div class="popup-identity">
          <h2 class="popup-displayname" id="user-menu-title">
            {user.displayName}
            {#if user.pronouns}
              <span class="popup-pronouns">{user.pronouns}</span>
            {/if}
          </h2>
          {#if user.statusDescription}
            <span class="popup-pronouns">{user.statusDescription}</span>
          {/if}
          <span
            class="popup-trust"
            style:color={getTrustColor(user.tags ?? [])}
          >
            {getTrustLevel(user.tags ?? [])}
          </span>
        </div>
      </div>

      {#if loading}
        <div class="loading-banner">
          <Icon icon="mdi:loading" width={16} class="spinning" />
          Refreshing profile...
        </div>
      {/if}

      {#if error}
        <div class="message-row error-row">
          <Icon icon="mdi:alert-circle-outline" width={16} />
          <span>{error}</span>
        </div>
      {/if}

      {#if user.bio}
        <div class="popup-bio">
          <p>{user.bio}</p>
        </div>
      {/if}

      {#if hasFriendCounts || user.date_joined || user.last_activity}
        <div class="popup-stats">
          {#if Array.isArray(user.onlineFriends)}
            <div class="stat">
              <span class="stat-value">{user.onlineFriends.length}</span>
              <span class="stat-label">Online</span>
            </div>
          {/if}
          {#if Array.isArray(user.onlineFriends) && (Array.isArray(user.friends) || user.date_joined || user.last_activity)}
            <div class="stat-divider"></div>
          {/if}
          {#if Array.isArray(user.friends)}
            <div class="stat">
              <span class="stat-value">{user.friends.length}</span>
              <span class="stat-label">Friends</span>
            </div>
          {/if}
          {#if Array.isArray(user.friends) && (user.date_joined || user.last_activity)}
            <div class="stat-divider"></div>
          {/if}
          {#if user.date_joined}
            <div class="stat">
              <span class="stat-value stat-date"
                >{formatDate(user.date_joined)}</span
              >
              <span class="stat-label">Joined</span>
            </div>
          {/if}
          {#if user.last_activity}
            <div class="stat-divider"></div>
            <div class="stat" title={new Date(user.last_activity).toLocaleString()}>
              <span class="stat-value stat-date"
                >{formatRelative(new Date(user.last_activity), new Date())}</span
              >
              <span class="stat-label">Last Active</span>
            </div>
          {/if}
        </div>
      {/if}

      {#if showcasedBadges.length > 0}
        <div class="popup-badges">
          {#each showcasedBadges as badge (badge.badgeId)}
            <img
              src={badge.badgeImageUrl}
              alt={badge.badgeName}
              title={`${badge.badgeName}: ${badge.badgeDescription}`}
              class="badge-img"
            />
          {/each}
        </div>
      {/if}

      {#if mutuals.length > 0}
        <div class="popup-mutuals">
          <h3 class="mutuals-title">Mutual Friends</h3>
          <div class="mutuals-list">
            {#each mutuals as m (m.id)}
              <button
                class="mutual-entry"
                type="button"
                onclick={() =>
                  onUserSelected
                    ? onUserSelected(m)
                    : openUrl(
                        `https://vrchat.com/home/user/${encodeURIComponent(m.id)}`,
                      )}
              >
                <UserAvatar friend={m} size={36} />
              </button>
            {/each}
          </div>
        </div>
      {/if}

      {#if canLogout}
        <div class="popup-footer">
          <button class="logout-btn" type="button" onclick={handleLogout}>
            <Icon icon="mdi:logout" width={15} />
            Sign Out
          </button>
        </div>
      {/if}
    {:else if loading}
      <div class="dialog-state">
        <Icon icon="mdi:loading" width={24} class="spinning" />
        <h2 class="dialog-title" id="user-menu-title">Loading profile</h2>
      </div>
    {:else}
      <div class="dialog-state">
        <Icon icon="mdi:account-off-outline" width={24} />
        <h2 class="dialog-title" id="user-menu-title">Profile unavailable</h2>
        {#if error}
          <p class="dialog-copy">{error}</p>
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  .dialog-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(7, 10, 18, 0.7);
    backdrop-filter: blur(10px);
    z-index: 50;
  }

  .dialog-shell {
    position: fixed;
    inset: 0;
    display: grid;
    place-items: center;
    padding: 1.5rem;
    pointer-events: none;
    z-index: 100;
  }

  .user-dialog {
    position: relative;
    width: min(100%, 640px);
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 18px;
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);
    overflow: hidden;
    pointer-events: auto;
  }

  .close-btn {
    position: absolute;
    top: 0.9rem;
    right: 0.9rem;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 999px;
    color: var(--text-secondary);
    background: rgba(255, 255, 255, 0.04);
    transition:
      background 0.15s,
      color 0.15s;
  }

  .close-btn:hover {
    color: var(--text-primary);
    background: rgba(255, 255, 255, 0.1);
  }

  .dialog-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.65rem;
    min-height: 220px;
    padding: 2rem 1.5rem;
    color: var(--text-secondary);
    text-align: center;
  }

  .dialog-title {
    margin: 0;
    font-size: 1rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  .dialog-copy {
    margin: 0;
    font-size: 0.84rem;
  }

  .popup-header {
    display: flex;
    align-items: center;
    gap: 0.9rem;
    padding: 1.25rem 1.25rem 1rem;
    background: linear-gradient(
      135deg,
      rgba(76, 175, 80, 0.18),
      rgba(36, 52, 71, 0)
    );
  }

  .popup-avatar-wrap {
    position: relative;
    flex-shrink: 0;
    display: inline-flex;
    padding: 0;
    border-radius: 14px;
    transition:
      transform 0.15s ease,
      box-shadow 0.15s ease;
  }

  .popup-avatar-wrap:hover {
    transform: translateY(-1px);
  }

  .popup-avatar-wrap:focus-visible {
    outline: 2px solid rgba(76, 175, 80, 0.75);
    outline-offset: 3px;
    box-shadow: 0 0 0 4px rgba(76, 175, 80, 0.18);
  }

  .popup-avatar-wrap :global(.user-avatar) {
    border: 2px solid var(--border);
  }

  .popup-identity {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    min-width: 0;
  }

  .popup-displayname {
    margin: 0;
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .popup-pronouns {
    font-size: 0.78rem;
    color: var(--text-muted);
  }

  .popup-trust {
    font-size: 0.72rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .popup-status-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.55rem 1.25rem;
    border-top: 1px solid var(--border);
  }

  .loading-banner,
  .message-row {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.6rem 1.25rem;
    border-top: 1px solid var(--border);
    font-size: 0.82rem;
    color: var(--text-secondary);
  }

  .error-row {
    color: #ef9a9a;
  }

  .status-dot-wrapper {
    position: relative;
    width: 8px;
    height: 8px;
    flex-shrink: 0;
  }

  .popup-status-text {
    font-size: 0.84rem;
    color: var(--text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .popup-bio {
    padding: 0.75rem 1.25rem;
    border-top: 1px solid var(--border);
    max-height: 400px;
    overflow-y: auto;
  }

  .popup-bio p {
    margin: 0;
    font-size: 0.84rem;
    color: var(--text-secondary);
    line-height: 1.5;
    white-space: pre-wrap;
  }

  .popup-stats {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.9rem;
    padding: 0.8rem 1.25rem;
    border-top: 1px solid var(--border);
  }

  .stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.1rem;
  }

  .stat-value {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .stat-date {
    font-size: 0.75rem;
  }

  .stat-label {
    font-size: 0.68rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .stat-divider {
    width: 1px;
    height: 28px;
    background: var(--border);
  }

  .popup-badges {
    display: flex;
    gap: 0.45rem;
    flex-wrap: wrap;
    padding: 0.75rem 1.25rem;
    border-top: 1px solid var(--border);
  }

  .badge-img {
    width: 34px;
    height: 34px;
    border-radius: 8px;
    object-fit: contain;
  }

  .popup-footer {
    padding: 0.75rem;
    border-top: 1px solid var(--border);
  }

  .logout-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;
    width: 100%;
    padding: 0.75rem;
    border-radius: 10px;
    font-size: 0.88rem;
    color: #ef5350;
    transition: background 0.15s;
  }

  .logout-btn:hover {
    background: rgba(239, 83, 80, 0.12);
  }

  :global(.spinning) {
    animation: dialog-spin 1s linear infinite;
  }

  .mutuals-list {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1.25rem 1rem;
    overflow-x: auto;
  }

  .mutuals-title {
    margin: 0.5rem 1.25rem;
    font-size: 0.82rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .popup-mutuals {
    border-top: 1px solid var(--border);
  }

  @keyframes dialog-spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 520px) {
    .dialog-shell {
      padding: 1rem;
      align-items: end;
    }

    .user-dialog {
      width: 100%;
    }
  }
</style>
