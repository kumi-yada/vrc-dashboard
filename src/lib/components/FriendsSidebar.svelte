<script lang="ts">
  import type { Friend } from "../types";
  import StatusDot from "./StatusDot.svelte";
  import UserAvatar from "./UserAvatar.svelte";

  interface Props {
    privateFriends: Friend[];
    offlineFriends: Friend[];
  }

  let { privateFriends, offlineFriends }: Props = $props();
</script>

<aside class="sidebar">
  {#if privateFriends.length > 0}
    <div class="sidebar-col private-col">
      {#each privateFriends as friend (friend.id)}
        <div class="sidebar-avatar" title={friend.displayName}>
          <UserAvatar friend={friend} size={40} radius="8px" />
          <StatusDot
            status={friend.status}
            size={10}
            borderWidth={2}
            borderColor="var(--sidebar-bg)"
            bottom="-1px"
            right="-1px"
          />
        </div>
      {/each}
    </div>
  {/if}
  {#if offlineFriends.length > 0}
    <div class="sidebar-col offline-col">
      {#each offlineFriends as friend (friend.id)}
        <div class="sidebar-avatar offline" title={friend.displayName}>
          <UserAvatar friend={friend} size={40} radius="8px" grayscale={60} brightness={0.7} />
          <StatusDot
            status={friend.status}
            size={10}
            borderWidth={2}
            borderColor="var(--sidebar-bg)"
            bottom="-1px"
            right="-1px"
          />
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
</style>
