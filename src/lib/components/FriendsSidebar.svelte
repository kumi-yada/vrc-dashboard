<script lang="ts">
  import { Status, type Friend } from "../types";
  import FriendEntry from "./FriendEntry.svelte";

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

  let privateShowNames = $state(false);
  let offlineShowNames = $state(false);

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
  let sortedOfflineFriends = $derived.by(() => {
    const activityTime = (friend: Friend) => {
      const v = (friend as any).last_activity;
      if (!v) return 0;
      if (typeof v === "number") return v;
      const t = Date.parse(String(v));
      return Number.isFinite(t) ? t : 0;
    };

    return [...offlineFriends].sort(
      (a, b) => activityTime(b) - activityTime(a),
    );
  });
</script>

<aside class="sidebar">
  {#if sortedPrivateFriends.length > 0}
    <div class="sidebar-col private-col">
      <button
        class="toggle-btn"
        onclick={() => (privateShowNames = !privateShowNames)}
        aria-pressed={privateShowNames}
        aria-label={privateShowNames ? "Hide names" : "Show names"}
        title={privateShowNames ? "Hide names" : "Show names"}
      >
        {#if privateShowNames}Hide{:else}Show{/if}
      </button>

      {#each sortedPrivateFriends as friend (friend.id)}
        <FriendEntry
          {friend}
          iconOnly={!privateShowNames}
          onProfileClick={onFriendProfile}
        />
      {/each}
    </div>
  {/if}
  {#if offlineFriends.length > 0}
    <div class="sidebar-col offline-col">
      <button
        class="toggle-btn"
        onclick={() => (offlineShowNames = !offlineShowNames)}
        aria-pressed={offlineShowNames}
        aria-label={offlineShowNames ? "Hide names" : "Show names"}
        title={offlineShowNames ? "Hide names" : "Show names"}
      >
        {#if offlineShowNames}Hide{:else}Show{/if}
      </button>

      {#each sortedOfflineFriends as friend (friend.id)}
        <FriendEntry
          {friend}
          iconOnly={!offlineShowNames}
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
    position: relative;
    border-left: 1px solid var(--border);
    padding: 0.5rem 0.35rem;
    flex-direction: column;
    gap: 0.35rem;
    overflow-y: auto;
    overflow-x: hidden;
    padding-right: 2px;
  }

  .toggle-btn {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    background: var(--sidebar-bg);
    border: 1px solid var(--border);
    color: var(--text);
    padding: 0.15rem 0.45rem;
    border-radius: 8px;
    font-size: 0.65rem;
    line-height: 1;
    cursor: pointer;
    transition:
      opacity 0.12s ease,
      transform 0.12s ease;
    z-index: 10;
    opacity: 0;
  }

  .sidebar-col:hover .toggle-btn {
    opacity: 1;
  }
</style>
