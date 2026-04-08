<script lang="ts">
  import { SUPPORTED_PLATFORMS, type Friend, type InstanceGroup, type InstancePlatforms, type SupportedPlatform } from "../types";
  import { visibilityLabel } from "../utils/instance";
  import FriendEntry from "./FriendEntry.svelte";
  import Icon from "@iconify/svelte";

  import PlatformMeta from "./PlatformMeta.svelte";

  function getSupportedPlatforms(group: InstanceGroup): SupportedPlatform[] {
    const worldPlatforms = group.instance?.world?.unityPackages?.map((pkg) => pkg.platform);

    if (!worldPlatforms?.length) {
      return [];
    }

    return [...new Set(worldPlatforms)]
      .filter((platform): platform is SupportedPlatform => SUPPORTED_PLATFORMS.includes(platform as SupportedPlatform));
  }

  interface Props {
    group: InstanceGroup;
    onFriendProfile: (friend: Friend) => void;
    onWorldOpen: (group: InstanceGroup) => void;
  }

  let { group, onFriendProfile, onWorldOpen }: Props = $props();

  const worldName = $derived(group.instance?.world?.name ?? "Unknown World");
  const thumbnailUrl = $derived(
    group.instance?.world?.thumbnailImageUrl ??
    group.instance?.world?.imageUrl ??
    ""
  );
  const userCount = $derived(group.instance?.n_users ?? group.friends.length);
  const capacity = $derived(group.instance?.capacity ?? 0);
  const visLabel = $derived(visibilityLabel(group.parsed.visibility));
  const supportedPlatforms = $derived(getSupportedPlatforms(group));

  function handleWorldOpen() {
    onWorldOpen(group);
  }
</script>

<div class="instance-card">
  <button
    class="world-preview"
    type="button"
    onclick={handleWorldOpen}
  >
    {#if supportedPlatforms.length}
      <PlatformMeta platforms={supportedPlatforms} />
    {/if}
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
      {#if group.ownerName}
        <div class="owner-row" title={`Owner: ${group.ownerName}`}>
          <Icon icon="mdi:crown-outline" width={14} />
          <span class="owner-name">{group.ownerName}</span>
        </div>
      {/if}
    </div>
  </button>
  <div class="friends-list">
    {#each group.friends as friend (friend.id)}
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

  .world-preview {
    position: relative;
    width: 180px;
    min-height: 160px;
    flex-shrink: 0;
    padding: 0;
    text-align: left;
    cursor: pointer;
    overflow: hidden;
    border-right: 1px solid rgba(255, 255, 255, 0.04);
  }

  .world-preview:hover .world-overlay {
    background: linear-gradient(transparent, rgba(0, 0, 0, 0.9));
  }

  .world-preview:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: -2px;
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
    background: linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.9));
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

  .owner-row {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    margin-top: 0.25rem;
    min-width: 0;
    font-size: 0.65rem;
    color: rgba(255, 255, 255, 0.9);
  }

  .owner-name {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
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
    max-height: 160px;
  }

  @media (max-width: 560px) {
    .instance-card {
      flex-direction: column;
    }

    .world-preview {
      width: 100%;
      height: 60px;
    }
  }

</style>
