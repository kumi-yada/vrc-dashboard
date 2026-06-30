<script lang="ts">
  import Icon from "@iconify/svelte";
  import type { AvatarData } from "../types";

  interface Props {
    avatar: AvatarData;
    onOpen: (avatar: AvatarData) => void;
  }

  let { avatar, onOpen }: Props = $props();

  const imageUrl = $derived(avatar.thumbnailImageUrl ?? avatar.imageUrl ?? "");

  const PERF_COLORS: Record<string, string> = {
    Excellent: "#4caf50",
    Good: "#8bc34a",
    Medium: "#ffc107",
    Poor: "#ff9800",
    VeryPoor: "#f44336",
  };

  const perfColor = $derived(
    avatar.performanceRating
      ? (PERF_COLORS[avatar.performanceRating] ?? "var(--text-muted)")
      : "var(--text-muted)",
  );

  function formatDate(dateStr: string | undefined): string {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
    }).format(d);
  }
</script>

<button
  class="avatar-card"
  type="button"
  onclick={() => onOpen(avatar)}
  title={`Open ${avatar.name}`}
>
  <div class="thumbnail-wrapper">
    {#if imageUrl}
      <img class="thumbnail" src={imageUrl} alt={avatar.name} loading="lazy" />
    {:else}
      <div class="thumbnail placeholder">
        <Icon icon="mdi:human" width={28} />
      </div>
    {/if}
  </div>

  <div class="info">
    <span class="name">{avatar.name}</span>
    <div class="meta">
      {#if avatar.performanceRating}
        <span class="perf-badge" style="color: {perfColor}; border-color: {perfColor};">
          {avatar.performanceRating}
        </span>
      {/if}
      <span class="release" class:public={avatar.releaseStatus === "public"}>
        {avatar.releaseStatus}
      </span>
    </div>
    {#if avatar.updated_at}
      <span class="date">
        <Icon icon="mdi:clock-outline" width={11} />
        {formatDate(avatar.updated_at)}
      </span>
    {/if}
  </div>
</button>

<style>
  .avatar-card {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.4rem 0.6rem;
    border-radius: 8px;
    background: var(--bg-card);
    width: 100%;
    text-align: left;
    transition: background 0.15s, transform 0.15s;
    cursor: pointer;
  }

  .avatar-card:hover {
    background: rgba(255, 255, 255, 0.05);
    transform: translateY(-1px);
  }

  .avatar-card:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  .thumbnail-wrapper {
    flex-shrink: 0;
    width: 64px;
    height: 64px;
    border-radius: 8px;
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
    background: rgba(255, 255, 255, 0.06);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
  }

  .info {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    min-width: 0;
    flex: 1;
  }

  .name {
    font-size: 0.88rem;
    font-weight: 600;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .meta {
    display: flex;
    gap: 0.4rem;
    align-items: center;
    flex-wrap: wrap;
  }

  .perf-badge {
    font-size: 0.7rem;
    font-weight: 600;
    padding: 0.1rem 0.4rem;
    border-radius: 999px;
    border: 1px solid;
    white-space: nowrap;
  }

  .release {
    font-size: 0.7rem;
    color: var(--text-muted);
    text-transform: capitalize;
  }

  .release.public {
    color: var(--accent);
  }

  .date {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.7rem;
    color: var(--text-secondary);
  }
</style>
