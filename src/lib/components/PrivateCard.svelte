<script lang="ts">
  import Icon from "@iconify/svelte";
  import type { Friend } from "../types";
  import FriendEntry from "./FriendEntry.svelte";

  interface Props {
    friends: Friend[];
    onFriendProfile: (friend: Friend) => void;
  }

  let { friends, onFriendProfile }: Props = $props();
</script>

<div class="instance-card">
  <div class="private-preview">
    <Icon icon="mdi:eye-off" width={32} class="private-icon" />
    <span class="private-label">Private</span>
    <span class="private-count">{friends.length} {friends.length === 1 ? "friend" : "friends"}</span>
  </div>
  <div class="friends-list">
    {#each friends as friend (friend.id)}
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

  .private-preview {
    position: relative;
    width: 180px;
    min-height: 160px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    padding: 0.75rem;
    border-right: 1px solid rgba(255, 255, 255, 0.04);
    background: linear-gradient(135deg, rgba(156, 39, 176, 0.12), rgba(156, 39, 176, 0.04));
  }

  :global(.private-icon) {
    color: #9c27b0;
    animation: pulse 2s ease-in-out infinite;
  }

  .private-label {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .private-count {
    font-size: 0.7rem;
    color: var(--text-muted);
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

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.6;
    }
  }

  @media (max-width: 560px) {
    .instance-card {
      flex-direction: column;
    }

    .private-preview {
      width: 100%;
      min-height: auto;
      flex-direction: row;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      border-right: none;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    }

    :global(.private-icon) {
      width: 24px;
      height: 24px;
    }
  }
</style>
