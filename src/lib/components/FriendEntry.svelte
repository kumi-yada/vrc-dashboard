<script lang="ts">
  import type { Friend } from "../types";
  import StatusDot from "./StatusDot.svelte";
  import UserAvatar from "./UserAvatar.svelte";

  interface Props {
    friend: Friend;
  }

  let { friend }: Props = $props();
  $inspect(friend);
</script>

<div class="friend-entry">
  <div class="avatar-wrapper">
    <UserAvatar friend={friend} />
    <StatusDot status={friend.status} state={friend.state} />
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

  .name {
    font-size: 0.8rem;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
