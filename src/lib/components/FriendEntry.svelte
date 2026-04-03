<script lang="ts">
  import type { Friend } from "../types";
  import StatusDot from "./StatusDot.svelte";

  interface Props {
    friend: Friend;
  }

  let { friend }: Props = $props();

  function getAvatar(f: Friend): string {
    return f.profilePicOverrideThumbnail || f.currentAvatarThumbnailImageUrl || "";
  }
</script>

<div class="friend-entry">
  <div class="avatar-wrapper">
    <img
      src={getAvatar(friend)}
      alt={friend.displayName}
      class="avatar"
      loading="lazy"
    />
    <StatusDot status={friend.status} />
  </div>
  <span class="name">{friend.displayName}</span>
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

  .avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    object-fit: cover;
    background: var(--bg-input);
  }

  .name {
    font-size: 0.8rem;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
