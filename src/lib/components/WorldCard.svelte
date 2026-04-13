<script lang="ts">
  import Icon from "@iconify/svelte";
  import {
    PLATFORM_META,
    SUPPORTED_PLATFORMS,
    type SupportedPlatform,
    type WorldData,
  } from "../types";

  interface Props {
    world: WorldData;
    onWorldOpen: (world: WorldData) => void;
  }

  let { world, onWorldOpen }: Props = $props();

  const imageUrl = $derived(
    world.thumbnailImageUrl ?? world.imageUrl ?? "",
  );

  const platformList = $derived(
    [...new Set(world.unityPackages?.map((pkg) => pkg.platform) ?? [])].filter(
      (platform): platform is SupportedPlatform =>
        SUPPORTED_PLATFORMS.includes(platform as SupportedPlatform),
    ),
  );

  const favoritesLabel = $derived(
    world.favorites >= 1000
      ? `${(world.favorites / 1000).toFixed(1)}k`
      : String(world.favorites ?? 0),
  );
</script>

<button
  class="world-card"
  type="button"
  onclick={() => onWorldOpen(world)}
  title={`Open ${world.name}`}
>
  <div class="thumbnail-wrapper">
    {#if imageUrl}
      <img class="thumbnail" src={imageUrl} alt={world.name} loading="lazy" />
    {:else}
      <div class="thumbnail placeholder"></div>
    {/if}
  </div>

  <div class="info">
    <span class="name">{world.name}</span>
    <span class="author">{world.authorName}</span>
    <div class="meta">
      <span class="meta-item" title="Favorites">
        <Icon icon="mdi:heart-outline" width={12} />
        {favoritesLabel}
      </span>
      {#if (world.occupants ?? 0) > 0}
        <span class="meta-item" title="Online now">
          <Icon icon="mdi:account-outline" width={12} />
          {world.occupants}
        </span>
      {/if}
    </div>
  </div>

  {#if platformList.length > 0}
    <div class="platforms">
      {#each platformList as platform (platform)}
        {@const meta = PLATFORM_META[platform]}
        <span class="platform-icon" title={meta?.label ?? platform}>
          <Icon icon={meta?.icon ?? "mdi:question-mark-circle"} width={13} />
        </span>
      {/each}
    </div>
  {/if}
</button>

<style>
  .world-card {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.35rem 0.5rem;
    border-radius: 8px;
    background: var(--bg-card);
    width: 100%;
    text-align: left;
    transition: background 0.15s, transform 0.15s;
    cursor: pointer;
  }

  .world-card:hover {
    background: rgba(255, 255, 255, 0.05);
    transform: translateY(-1px);
  }

  .world-card:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  .thumbnail-wrapper {
    flex-shrink: 0;
    width: 48px;
    height: 48px;
    border-radius: 6px;
    overflow: hidden;
  }

  .thumbnail {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .placeholder {
    width: 100%;
    height: 100%;
    background: var(--bg-card, rgba(255, 255, 255, 0.06));
  }

  .info {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    min-width: 0;
    flex: 1;
  }

  .name {
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .author {
    font-size: 0.72rem;
    color: var(--text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .meta {
    display: flex;
    gap: 0.6rem;
    margin-top: 0.1rem;
  }

  .meta-item {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.7rem;
    color: var(--text-secondary);
  }

  .platforms {
    display: flex;
    gap: 0.3rem;
    flex-shrink: 0;
    align-items: center;
    padding-left: 0.25rem;
  }

  .platform-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--text-secondary);
  }
</style>
