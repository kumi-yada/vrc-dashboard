<script lang="ts">
  import { Status, type Friend } from "../types";
  import FriendEntry from "./FriendEntry.svelte";
  import StatusDot from "./StatusDot.svelte";
  import UserAvatar from "./UserAvatar.svelte";

  interface Props {
    privateFriends: Friend[];
    offlineFriends: Friend[];
    activeFriendIds: string[];
    onFriendProfile: (friend: Friend) => void;
  }

  let {
    privateFriends,
    offlineFriends,
    activeFriendIds,
    onFriendProfile,
  }: Props = $props();

  let sortedPrivateFriends = $derived.by(() => {
    const friendOrder = (friend: Friend) => {
      if (activeFriendIds.includes(friend.id)) {
        return 1;
      }
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
      return 0;
    };

    return [...privateFriends].sort((left, right) => {
      const leftOrder = friendOrder(left);
      const rightOrder = friendOrder(right);

      if (leftOrder === rightOrder) {
        return 0;
      }

      return leftOrder < rightOrder ? 1 : -1;
    });
  });
</script>

<aside class="sidebar">
  {#if sortedPrivateFriends.length > 0}
    <div class="sidebar-col private-col">
      {#each sortedPrivateFriends as friend (friend.id)}
        <FriendEntry
          {friend}
          iconOnly
          onProfileClick={onFriendProfile}
        />
      {/each}
    </div>
  {/if}
  {#if offlineFriends.length > 0}
    <div class="sidebar-col offline-col">
      {#each offlineFriends as friend (friend.id)}
        <FriendEntry
          {friend}
          iconOnly
          grayscale={100}
          onProfileClick={onFriendProfile}
        />
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
    padding: 0;
    border-radius: 12px;
    cursor: pointer;
    transition: transform 0.15s ease;
  }

  .sidebar-avatar:hover {
    transform: translateY(-1px);
  }
</style>
