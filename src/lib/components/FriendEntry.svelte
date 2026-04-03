<script lang="ts">
  import Icon from "@iconify/svelte";
  import type { Friend } from "../types";
  import StatusDot from "./StatusDot.svelte";
  import UserAvatar from "./UserAvatar.svelte";

  type MobilePlatform = "android" | "ios";

  const MOBILE_PLATFORM_META: Record<MobilePlatform, { icon: string; label: string }> = {
    android: {
      icon: "mdi:android",
      label: "Android"
    },
    ios: {
      icon: "mdi:apple-ios",
      label: "iOS"
    }
  };

  function getMobilePlatform(friend: Friend): MobilePlatform | null {
    const platform = friend.platform ?? friend.last_platform;

    return platform === "android" || platform === "ios" ? platform : null;
  }

  interface Props {
    friend: Friend;
    onProfileClick: (friend: Friend) => void;
  }

  let { friend, onProfileClick }: Props = $props();
  const mobilePlatform = $derived(getMobilePlatform(friend));
</script>

<div class="friend-entry">
  <button
    class="avatar-button avatar-wrapper"
    type="button"
    title={`Open ${friend.displayName} profile`}
    onclick={() => onProfileClick(friend)}
  >
    <UserAvatar friend={friend} />
    <StatusDot status={friend.status} />
  </button>
  <div class="details">
    <span class="name">{friend.displayName}</span>
    {#if mobilePlatform}
      <span class="platform-icon" title={MOBILE_PLATFORM_META[mobilePlatform].label}>
        <Icon icon={MOBILE_PLATFORM_META[mobilePlatform].icon} width={14} />
      </span>
    {/if}
  </div>
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
    align-items: flex-end;
    gap: 0.35rem;
    min-width: 0;
    flex: 1;
  }

  .name {
    font-size: 0.8rem;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
    flex: 1;
  }

  .platform-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--text-secondary);
    flex-shrink: 0;
  }
</style>
