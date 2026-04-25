<script lang="ts">
  import Icon from "@iconify/svelte";
  import { openUrl } from "@tauri-apps/plugin-opener";
  import { getAuth, inviteUserToInstance } from "../stores/auth.svelte";
  import {
    USER_SCALE_MAX,
    USER_SCALE_MIN,
    USER_SCALE_STEP,
    getUiScale,
    resetUserScale,
    setUserScale,
  } from "../stores/ui-scale.svelte";
  import type { UserProfile } from "../types";
  import { isDesktop } from "../utils/platform";
  import StatusDot from "./StatusDot.svelte";
  import UserAvatar from "./UserAvatar.svelte";
  import { formatRelative } from "date-fns";

  interface Props {
    user: UserProfile | null;
    mutualFriends?: UserProfile[] | null;
    onClose: () => void;
    onUserSelected?: (user: UserProfile) => void;
    onLogout?: () => Promise<void> | void;
    showInvite?: boolean;
    loading?: boolean;
    error?: string | null;
  }

  let {
    user,
    mutualFriends,
    onClose,
    onUserSelected,
    onLogout,
    showInvite = false,
    loading = false,
    error = null,
  }: Props = $props();

  const auth = getAuth();
  const uiScale = getUiScale();
  const showcasedBadges = $derived(
    user?.badges?.filter((badge) => badge.showcased) ?? [],
  );
  const hasFriendCounts = $derived(
    Array.isArray(user?.friends) || Array.isArray(user?.onlineFriends),
  );
  const canLogout = $derived(Boolean(user && onLogout));
  const mutuals: any[] = $derived(mutualFriends ?? []);
  type InviteState = "idle" | "loading" | "success" | "error";
  let inviteState = $state<InviteState>("idle");
  const currentLocation = $derived(auth.user?.location?.trim() ?? "");
  const inviteDisabled = $derived(
    inviteState === "loading" ||
      !showInvite ||
      !user?.id ||
      !currentLocation ||
      currentLocation === "offline",
  );
  const inviteTitle = $derived(
    !showInvite
      ? "Invite unavailable"
      : !currentLocation || currentLocation === "offline"
        ? "You must be online to send invites"
        : "Invite user to your current instance",
  );
  const scalePercent = $derived(Math.round(uiScale.effectiveScale * 100));
  const autoScalePercent = $derived(Math.round(uiScale.autoScale * 100));
  const userScalePercent = $derived(Math.round(uiScale.userScale * 100));

  $inspect(auth);

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

  async function handleInviteUser() {
    if (inviteDisabled || !user?.id || !currentLocation) return;

    inviteState = "loading";
    try {
      await inviteUserToInstance(user.id, currentLocation);
      inviteState = "success";
    } catch {
      inviteState = "error";
    } finally {
      setTimeout(() => {
        inviteState = "idle";
      }, 2000);
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      onClose();
    }
  }

  function handleScaleInput(event: Event): void {
    const target = event.currentTarget;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    setUserScale(Number.parseFloat(target.value));
  }

  function handleScaleReset(): void {
    resetUserScale();
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
    <div class="dialog-actions">
      {#if showInvite}
        <button
          class="invite-btn invite-btn--{inviteState}"
          type="button"
          title={inviteTitle}
          disabled={inviteDisabled}
          onclick={handleInviteUser}
        >
          {#if inviteState === "loading"}
            <Icon icon="mdi:loading" width="1rem" class="spinning" />
          {:else if inviteState === "success"}
            <Icon icon="mdi:check" width="1rem" />
          {:else if inviteState === "error"}
            <Icon icon="mdi:alert" width="1rem" />
          {:else}
            <Icon icon="mdi:email-arrow-right-outline" width="1rem" />
          {/if}
        </button>
      {/if}
      <button class="close-btn" type="button" title="Close" onclick={onClose}>
        <Icon icon="mdi:close" width="1.125rem" />
      </button>
    </div>

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
          <Icon icon="mdi:loading" width="1rem" class="spinning" />
          Refreshing profile...
        </div>
      {/if}

      {#if error}
        <div class="message-row error-row">
          <Icon icon="mdi:alert-circle-outline" width="1rem" />
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
            <div
              class="stat"
              title={new Date(user.last_activity).toLocaleString()}
            >
              <span class="stat-value stat-date"
                >{formatRelative(
                  new Date(user.last_activity),
                  new Date(),
                )}</span
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
        {#if isDesktop}
          <div class="scale-panel">
            <div class="scale-panel-header">
              <h3>Interface Scale</h3>
              <button
                class="scale-reset-btn"
                type="button"
                disabled={uiScale.userScale === 1}
                onclick={handleScaleReset}
              >
                Reset
              </button>
            </div>

            <input
              class="scale-slider"
              type="range"
              min={USER_SCALE_MIN}
              max={USER_SCALE_MAX}
              step={USER_SCALE_STEP}
              value={uiScale.userScale}
              oninput={handleScaleInput}
              aria-label="Interface scale override"
            />

            <div class="scale-panel-meta">
              <span>Override {userScalePercent}%</span>
              <span>Auto {autoScalePercent}%</span>
              <span>Effective {scalePercent}%</span>
            </div>

            <p class="scale-panel-note">
              Automatic scale is capped at 150% for high-density displays.
            </p>
          </div>
        {/if}

        <div class="popup-footer">
          <button class="logout-btn" type="button" onclick={handleLogout}>
            <Icon icon="mdi:logout" width="0.9375rem" />
            Sign Out
          </button>
        </div>
      {/if}
    {:else if loading}
      <div class="dialog-state">
        <Icon icon="mdi:loading" width="1.5rem" class="spinning" />
        <h2 class="dialog-title" id="user-menu-title">Loading profile</h2>
      </div>
    {:else}
      <div class="dialog-state">
        <Icon icon="mdi:account-off-outline" width="1.5rem" />
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

  .dialog-actions {
    position: absolute;
    top: 0.9rem;
    right: 0.9rem;
    display: flex;
    gap: 0.4rem;
    z-index: 20;
  }

  .close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--ui-control-size-md);
    height: var(--ui-control-size-md);
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

  .invite-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--ui-control-size-md);
    height: var(--ui-control-size-md);
    border-radius: 999px;
    color: var(--text-secondary);
    background: rgba(255, 255, 255, 0.04);
    transition:
      background 0.15s,
      color 0.15s,
      opacity 0.15s;
  }

  .invite-btn:hover:not(:disabled) {
    color: var(--text-primary);
    background: rgba(255, 255, 255, 0.1);
  }

  .invite-btn:disabled {
    opacity: 0.45;
    cursor: default;
  }

  .invite-btn--success {
    color: var(--accent);
  }

  .invite-btn--error {
    color: #ef9a9a;
  }

  .dialog-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.65rem;
    min-height: 13.75rem;
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
    max-height: 25rem;
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
    height: 1.75rem;
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
    width: 2.125rem;
    height: 2.125rem;
    border-radius: 8px;
    object-fit: contain;
  }

  .scale-panel {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.75rem 1.25rem;
    border-top: 1px solid var(--border);
  }

  .scale-panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .scale-panel-header h3 {
    margin: 0;
    font-size: 0.82rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--text-secondary);
  }

  .scale-reset-btn {
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 0.2rem 0.5rem;
    font-size: 0.76rem;
    color: var(--text-secondary);
    transition: all 0.15s;
  }

  .scale-reset-btn:hover:enabled {
    color: var(--text-primary);
    background: rgba(255, 255, 255, 0.05);
  }

  .scale-reset-btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .scale-slider {
    width: 100%;
    accent-color: var(--accent);
  }

  .scale-panel-meta {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    flex-wrap: wrap;
    font-size: 0.76rem;
    color: var(--text-secondary);
  }

  .scale-panel-note {
    margin: 0;
    font-size: 0.74rem;
    color: var(--text-muted);
    line-height: 1.35;
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
