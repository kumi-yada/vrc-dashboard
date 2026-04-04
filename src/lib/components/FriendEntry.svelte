<script lang="ts">
  import Icon from "@iconify/svelte";
  import { PLATFORM_META, type Friend, type SupportedPlatform } from "../types";
  import StatusDot from "./StatusDot.svelte";
  import UserAvatar from "./UserAvatar.svelte";

  function getMobilePlatform(friend: Friend): SupportedPlatform | null {
    return (friend.platform ?? friend.last_platform) as SupportedPlatform;
  }

  interface Props {
    friend: Friend;
    grayscale?: number;
    iconOnly?: boolean;
    onProfileClick: (friend: Friend) => void;
  }

  let { friend, grayscale = 0, iconOnly = false, onProfileClick }: Props = $props();
  const mobilePlatform = $derived(getMobilePlatform(friend));
</script>

<div class="friend-entry">
  <button
    class="avatar-button avatar-wrapper"
    type="button"
    title={`Open ${friend.displayName} profile`}
    onclick={() => onProfileClick(friend)}
  >
    <UserAvatar {friend} grayscale={grayscale} brightness={friend.location === "offline" ? 0.5 : 1} />
    <StatusDot status={friend.status} active={friend.location === "offline"} />
  </button>
  {#if !iconOnly}
    <div class="details">
      <span class="name">
        {friend.displayName}
        {#if friend.statusDescription}
          <span class="description">{friend.statusDescription}</span>
        {/if}
      </span>
      {#if mobilePlatform}
        <span class="platform-icon" title={PLATFORM_META[mobilePlatform].label}>
          <Icon icon={PLATFORM_META[mobilePlatform].icon} width={14} />
        </span>
      {/if}
    </div>
  {/if}
</div>

<style>
  .friend-entry {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.2rem 0.4rem;
    border-radius: 6px;
    background: rgba(0, 0, 0, 0.2);
  }

  .avatar-wrapper {
    position: relative;
    flex-shrink: 0;
  }

  .avatar-button {
    padding: 0;
    border-radius: 10px;
    cursor: pointer;
  }

  .avatar-button:hover {
    transform: translateY(-1px);
  }

  .details {
    display: flex;
    gap: 0.35rem;
    min-width: 0;
    flex: 1;
  }

  .name {
    display: flex;
    flex-direction: column;
    font-size: 0.8rem;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
    flex: 1;
  }

  .description {
    font-size: 0.7rem;
    color: var(--text-muted);
  }

  .platform-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--text-secondary);
    flex-shrink: 0;
  }
</style>
