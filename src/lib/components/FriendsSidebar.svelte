<script lang="ts">
  import type { Friend } from "../types";

  interface Props {
    privateFriends: Friend[];
    offlineFriends: Friend[];
  }

  let { privateFriends, offlineFriends }: Props = $props();

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

<aside class="sidebar">
  {#if privateFriends.length > 0}
    <div class="sidebar-col private-col">
      {#each privateFriends as friend (friend.id)}
        <div class="sidebar-avatar" title={friend.displayName}>
          <img src={getAvatar(friend)} alt={friend.displayName} loading="lazy" />
          <span class="dot" style="background: {getStatusColor(friend.status)}"></span>
        </div>
      {/each}
    </div>
  {/if}
  {#if offlineFriends.length > 0}
    <div class="sidebar-col offline-col">
      {#each offlineFriends as friend (friend.id)}
        <div class="sidebar-avatar offline" title={friend.displayName}>
          <img src={getAvatar(friend)} alt={friend.displayName} loading="lazy" />
          <span class="dot" style="background: {getStatusColor(friend.status)}"></span>
        </div>
      {/each}
    </div>
  {/if}
</aside>

<style>
  .sidebar {
    display: flex;
    gap: 0.35rem;
    padding: 0.5rem 0.35rem;
    height: 100%;
    overflow: hidden;
    background: var(--sidebar-bg);
    border-left: 1px solid var(--border);
    flex-shrink: 0;
  }

  .sidebar-col {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    overflow-y: auto;
    overflow-x: hidden;
    padding-right: 2px;
  }

  .sidebar-avatar {
    position: relative;
    flex-shrink: 0;
  }

  .sidebar-avatar img {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    object-fit: cover;
    background: var(--bg-input);
  }

  .sidebar-avatar.offline img {
    filter: grayscale(60%) brightness(0.7);
  }

  .dot {
    position: absolute;
    bottom: -1px;
    right: -1px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: 2px solid var(--sidebar-bg);
  }
</style>
