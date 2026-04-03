<script lang="ts">
  import type { InstanceGroup } from "../types";
  import { visibilityLabel } from "../utils/instance";
  import FriendEntry from "./FriendEntry.svelte";
  import Icon from "@iconify/svelte";

  interface Props {
    group: InstanceGroup;
  }

  let { group }: Props = $props();

  const worldName = $derived(group.instance?.world?.name ?? "Unknown World");
  const thumbnailUrl = $derived(
    group.instance?.world?.thumbnailImageUrl ??
    group.instance?.world?.imageUrl ??
    ""
  );
  const userCount = $derived(group.instance?.n_users ?? group.friends.length);
  const capacity = $derived(group.instance?.capacity ?? 0);
  const visLabel = $derived(visibilityLabel(group.parsed.visibility));
</script>

<div class="instance-card">
  <div class="world-preview" title={`${worldName} - ${userCount}/${capacity} users`}>
    {#if thumbnailUrl}
      <img src={thumbnailUrl} alt={worldName} class="world-thumb" loading="lazy" />
    {:else}
      <div class="world-thumb-placeholder">
        <Icon icon="mdi:earth" width={32} />
      </div>
    {/if}
    <div class="world-overlay">
      <span class="world-name">{worldName}</span>
      <div class="world-meta">
        <span class="visibility">{visLabel}</span>
        <span class="player-count">
          <Icon icon="mdi:account-group" width={14} />
          {userCount}/{capacity}
        </span>
      </div>
    </div>
  </div>
  <div class="friends-list">
    {#each group.friends as friend (friend.id)}
      <FriendEntry {friend} />
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
    min-width: 0;
  }

  .instance-card:hover {
    background: var(--bg-card-hover);
  }

  .world-preview {
    position: relative;
    width: 130px;
    min-height: 100px;
    flex-shrink: 0;
  }

  .world-thumb {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .world-thumb-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-input);
    color: var(--text-muted);
  }

  .world-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 0.4rem;
    background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  }

  .world-name {
    display: block;
    font-size: 0.7rem;
    color: #fff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .world-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 0.15rem;
  }

  .visibility {
    font-size: 0.65rem;
    color: var(--accent);
    font-weight: 600;
  }

  .player-count {
    display: flex;
    align-items: center;
    gap: 0.15rem;
    font-size: 0.65rem;
    color: var(--text-secondary);
  }

  .friends-list {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.4rem;
    min-width: 0;
    flex: 1;
    overflow-y: auto;
    max-height: 200px;
  }
</style>
