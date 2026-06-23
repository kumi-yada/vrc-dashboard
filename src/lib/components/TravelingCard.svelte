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
  <div class="traveling-preview">
    <Icon icon="mdi:airplane" width={32} class="traveling-icon" />
    <span class="traveling-label">Traveling</span>
    <span class="traveling-count">{friends.length} {friends.length === 1 ? "friend" : "friends"}</span>
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

  .traveling-preview {
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
    background: linear-gradient(135deg, rgba(33, 150, 243, 0.12), rgba(33, 150, 243, 0.04));
  }

  :global(.traveling-icon) {
    color: var(--accent);
    animation: fly 2.5s ease-in-out infinite;
  }

  .traveling-label {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .traveling-count {
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

  @keyframes fly {
    0%, 100% {
      transform: translateX(0) rotate(0deg);
    }
    50% {
      transform: translateX(4px) rotate(-8deg);
    }
  }

  @media (max-width: 560px) {
    .instance-card {
      flex-direction: column;
    }

    .traveling-preview {
      width: 100%;
      min-height: auto;
      flex-direction: row;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      border-right: none;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    }

    :global(.traveling-icon) {
      width: 24px;
      height: 24px;
    }
  }
</style>
