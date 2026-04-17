<script lang="ts">
  import Icon from "@iconify/svelte";
  import {
    SUPPORTED_PLATFORMS,
    type InstanceGroup,
    type SupportedPlatform,
  } from "../types";
  import { visibilityLabel, regionLabel } from "../utils/instance";
  import PlatformMeta from "./PlatformMeta.svelte";

  interface Props {
    group: InstanceGroup;
    onOpen: (group: InstanceGroup) => void;
  }

  let { group, onOpen }: Props = $props();

  const worldName = $derived(group.instance?.world?.name ?? "Unknown World");
  const thumbnailUrl = $derived(
    group.instance?.world?.thumbnailImageUrl ??
      group.instance?.world?.imageUrl ??
      "",
  );
  const userCount = $derived(group.instance?.n_users ?? 0);
  const capacity = $derived(group.instance?.capacity ?? 0);
  const visLabel = $derived(visibilityLabel(group.parsed.visibility));
  const region = $derived(regionLabel(group.parsed.region));
  const supportedPlatforms = $derived(
    [...new Set(group.instance?.world?.unityPackages?.map((p) => p.platform) ?? [])].filter(
      (p): p is SupportedPlatform => SUPPORTED_PLATFORMS.includes(p as SupportedPlatform),
    ),
  );
</script>

<button class="recent-card" type="button" onclick={() => onOpen(group)}>
  <div class="thumb-wrap">
    {#if supportedPlatforms.length > 0}
      <div class="platforms-overlay">
        <PlatformMeta platforms={supportedPlatforms} />
      </div>
    {/if}
    {#if thumbnailUrl}
      <img src={thumbnailUrl} alt={worldName} class="thumb" loading="lazy" />
    {:else}
      <div class="thumb-placeholder">
        <Icon icon="mdi:earth" width={40} />
      </div>
    {/if}
    <div class="overlay">
      <span class="world-name">{worldName}</span>
      <div class="meta-row">
        <span class="vis-badge">{visLabel}</span>
        <span class="region-badge">{region}</span>
        <span class="user-count">
          <Icon icon="mdi:account-group" width={13} />
          {userCount}{#if capacity > 0}/{capacity}{/if}
        </span>
      </div>
      {#if group.ownerName}
        <div class="owner-row">
          <Icon icon="mdi:crown-outline" width={13} />
          <span class="owner-name">{group.ownerName}</span>
        </div>
      {/if}
    </div>
  </div>
</button>

<style>
  .recent-card {
    position: relative;
    display: flex;
    flex-direction: column;
    background: var(--bg-card);
    border-radius: 10px;
    overflow: hidden;
    text-align: left;
    cursor: pointer;
    transition: transform 0.15s ease, background 0.15s;
  }

  .recent-card:hover {
    transform: translateY(-2px);
    background: var(--bg-card-hover);
  }

  .recent-card:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: -2px;
  }

  .thumb-wrap {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    background: var(--bg-input);
  }

  .thumb {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .thumb-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
  }

  .platforms-overlay {
    position: absolute;
    top: 0.4rem;
    left: 0.4rem;
    z-index: 2;
  }

  .overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 0.5rem 0.65rem;
    background: linear-gradient(transparent, rgba(6, 10, 20, 0.92));
    z-index: 1;
  }

  .world-name {
    display: block;
    font-size: 0.85rem;
    font-weight: 600;
    color: #fff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 0.3rem;
  }

  .meta-row {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex-wrap: wrap;
  }

  .vis-badge {
    font-size: 0.68rem;
    font-weight: 700;
    color: var(--accent);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .region-badge {
    font-size: 0.68rem;
    color: rgba(255, 255, 255, 0.65);
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    padding: 0.05rem 0.35rem;
  }

  .user-count {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    font-size: 0.72rem;
    color: rgba(255, 255, 255, 0.75);
    margin-left: auto;
  }

  .owner-row {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    margin-top: 0.25rem;
    font-size: 0.68rem;
    color: rgba(255, 255, 255, 0.8);
    min-width: 0;
  }

  .owner-name {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
