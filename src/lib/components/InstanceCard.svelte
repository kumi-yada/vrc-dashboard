<script lang="ts">
  import {
    SUPPORTED_PLATFORMS,
    type Friend,
    type InstanceGroup,
    type SupportedPlatform,
  } from "../types";
  import { visibilityLabel } from "../utils/instance";
  import FriendEntry from "./FriendEntry.svelte";
  import Icon from "@iconify/svelte";
  import { invoke } from "@tauri-apps/api/core";

  import PlatformMeta from "./PlatformMeta.svelte";

  function getSupportedPlatforms(group: InstanceGroup): SupportedPlatform[] {
    const worldPlatforms = group.instance?.world?.unityPackages?.map(
      (pkg) => pkg.platform,
    );

    if (!worldPlatforms?.length) {
      return [];
    }

    return [...new Set(worldPlatforms)].filter(
      (platform): platform is SupportedPlatform =>
        SUPPORTED_PLATFORMS.includes(platform as SupportedPlatform),
    );
  }

  interface Props {
    group: InstanceGroup;
    onFriendProfile: (friend: Friend) => void;
    onWorldOpen: (group: InstanceGroup) => void;
  }

  let { group, onFriendProfile, onWorldOpen }: Props = $props();

  const worldName = $derived(group.instance?.world?.name ?? "Unknown World");
  const thumbnailUrl = $derived(
    group.instance?.world?.thumbnailImageUrl ??
      group.instance?.world?.imageUrl ??
      "",
  );
  const userCount = $derived(group.instance?.n_users ?? group.friends.length);
  const capacity = $derived(group.instance?.capacity ?? 0);
  const visLabel = $derived(visibilityLabel(group.parsed.visibility));
  const supportedPlatforms = $derived(getSupportedPlatforms(group));

  function handleWorldOpen() {
    onWorldOpen(group);
  }

  type InviteState = "idle" | "loading" | "success" | "error";
  let inviteState = $state<InviteState>("idle");

  async function handleInvite(e: MouseEvent) {
    e.stopPropagation();
    if (inviteState === "loading") return;
    inviteState = "loading";
    try {
      await invoke("invite_myself_to_instance", { location: group.location });
      inviteState = "success";
    } catch {
      inviteState = "error";
    } finally {
      setTimeout(() => {
        inviteState = "idle";
      }, 2000);
    }
  }
</script>

<div class="instance-card">
  <button class="world-preview" type="button" onclick={handleWorldOpen}>
    {#if supportedPlatforms.length}
      <PlatformMeta platforms={supportedPlatforms} />
      <span
        class="invite-btn invite-btn--{inviteState}"
        role="button"
        tabindex="0"
        title="Invite myself to this instance"
        onclick={handleInvite}
        onkeydown={(e) => {
          if (e.key === "Enter" || e.key === " ")
            handleInvite(e as unknown as MouseEvent);
        }}
      >
        {#if inviteState === "loading"}
          <Icon icon="mdi:loading" width={12} class="spin" />
        {:else if inviteState === "success"}
          <Icon icon="mdi:check" width={12} />
        {:else if inviteState === "error"}
          <Icon icon="mdi:alert" width={12} />
        {:else}
          <Icon icon="mdi:email-arrow-right-outline" width={12} />
        {/if}
      </span>
    {/if}
    {#if thumbnailUrl}
      <img
        src={thumbnailUrl}
        alt={worldName}
        class="world-thumb"
        loading="lazy"
      />
    {:else}
      <div class="world-thumb-placeholder">
        <Icon icon="mdi:earth" width={32} />
      </div>
    {/if}
    <div class="world-overlay">
      <span class="world-name">{worldName}</span>
      <div class="world-meta">
        <span class="visibility">{visLabel}</span>
        <span class="player-count">
          <Icon icon="mdi:account-group" width={14} />
          {userCount}/{capacity}
        </span>
      </div>
      {#if group.ownerName}
        <div class="owner-row" title={`Owner: ${group.ownerName}`}>
          <Icon icon="mdi:crown-outline" width={14} />
          <span class="owner-name">{group.ownerName}</span>
        </div>
      {/if}
    </div>
  </button>
  <div class="friends-list">
    {#each group.friends as friend (friend.id)}
      <FriendEntry {friend} onProfileClick={onFriendProfile} />
    {/each}
  </div>
</div>

<style>
  .instance-card {
    display: flex;
    background: var(--bg-card);
    border-radius: 10px;
    overflow: hidden;
    transition: background 0.2s;
  }

  .instance-card:hover {
    background: var(--bg-card-hover);
  }

  .world-preview {
    position: relative;
    width: 180px;
    min-height: 160px;
    flex-shrink: 0;
    padding: 0;
    text-align: left;
    cursor: pointer;
    overflow: hidden;
    border-right: 1px solid rgba(255, 255, 255, 0.04);
  }

  .world-preview:hover .world-overlay {
    background: linear-gradient(transparent, rgba(0, 0, 0, 0.9));
  }

  .world-preview:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: -2px;
  }

  .world-thumb {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .world-thumb-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-input);
    color: var(--text-muted);
  }

  .world-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 0.4rem;
    background: linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.9));
  }

  .world-name {
    display: block;
    font-size: 0.7rem;
    color: #fff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .world-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 0.15rem;
  }

  .owner-row {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    margin-top: 0.25rem;
    min-width: 0;
    font-size: 0.65rem;
    color: rgba(255, 255, 255, 0.9);
  }

  .owner-name {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .visibility {
    font-size: 0.65rem;
    color: var(--accent);
    font-weight: 600;
  }

  .player-count {
    display: flex;
    align-items: center;
    gap: 0.15rem;
    font-size: 0.65rem;
    color: var(--text-secondary);
  }

  .invite-btn {
    display: flex;
    position: absolute;
    top: 0.4rem;
    right: 0.4rem;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.72);
    padding: 0.2rem 0.35rem;
    cursor: pointer;
    color: rgba(255, 255, 255, 0.7);
    transition: color 0.15s;
    flex-shrink: 0;
  }

  .invite-btn:hover {
    color: #fff;
  }

  .invite-btn--success {
    color: var(--accent);
  }

  .invite-btn--error {
    color: #ff6b6b;
  }

  :global(.invite-btn .spin) {
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .friends-list {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.4rem;
    min-width: 0;
    flex: 1;
    overflow-y: auto;
    max-height: 160px;
  }

  @media (max-width: 560px) {
    .instance-card {
      flex-direction: column;
    }

    .world-preview {
      width: 100%;
      height: 60px;
    }
  }
</style>
