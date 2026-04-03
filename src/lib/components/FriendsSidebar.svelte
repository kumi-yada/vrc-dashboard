<script lang="ts">
  import { Status, type Friend } from "../types";
  import StatusDot from "./StatusDot.svelte";
  import UserAvatar from "./UserAvatar.svelte";

  interface Props {
    privateFriends: Friend[];
    offlineFriends: Friend[];
    activeFriendIds: string[];
  }

  let { privateFriends, offlineFriends, activeFriendIds }: Props = $props();

  let sortedPrivateFriends = $derived.by(() => {
    const friendOrder = (friend: Friend) => {
      switch (friend.status) {
        case Status.JoinMe:
          return 5;
        case Status.Active:
          return 4;
        case Status.AskMe:
          return 3;
        case Status.Busy:
          return 2;
      }
      if (activeFriendIds.includes(friend.id)) {
        return 1;
      }
      return 0;
    };

    return [...privateFriends].sort((left, right) => {
      const leftOrder = friendOrder(left);
      const rightOrder = friendOrder(right);

      if (leftOrder === rightOrder) {
        return 0;
      }

      return leftOrder > rightOrder ? 1 : -1;
    });
  });
</script>

<aside class="sidebar">
  {#if sortedPrivateFriends.length > 0}
    <div class="sidebar-col private-col">
      {#each sortedPrivateFriends as friend (friend.id)}
        <div class="sidebar-avatar" title={friend.displayName}>
          <UserAvatar {friend} size={40} />
          <StatusDot
            status={friend.status}
            active={activeFriendIds.includes(friend.id)}
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
          <UserAvatar {friend} size={40} grayscale={60} brightness={0.7} />
          <StatusDot
            status={friend.status}
            active={activeFriendIds?.includes(friend.id)}
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
    height: 100%;
    overflow: hidden;
    background: var(--sidebar-bg);
    flex-shrink: 0;
  }

  .sidebar-col {
    display: flex;
    border-left: 1px solid var(--border);
    padding: 0.5rem 0.35rem;
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
