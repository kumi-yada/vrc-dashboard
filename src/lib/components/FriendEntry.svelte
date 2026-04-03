<script lang="ts">
  import type { Friend } from "../types";

  interface Props {
    friend: Friend;
  }

  let { friend }: Props = $props();

  function getAvatar(f: Friend): string {
    return f.profilePicOverrideThumbnail || f.currentAvatarThumbnailImageUrl || "";
  }

  function getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      offline: "#9E9E9E",
      active: "#4CAF50",
      "join me": "#2196F3",
      "ask me": "#FF9800",
      busy: "#F44336",
    };
    return colors[status?.toLowerCase()] || "#9E9E9E";
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
    <span class="online-dot" style="background: {getStatusColor(friend.status)}"></span>
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

  .online-dot {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    border: 1.5px solid var(--bg-card);
  }

  .name {
    font-size: 0.8rem;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
