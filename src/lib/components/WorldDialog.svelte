<script lang="ts">
  import Icon from "@iconify/svelte";
  import type { WorldData } from "../types";

  type SupportedPlatform = "standalonewindows" | "android" | "ios";

  const PLATFORM_META: Record<SupportedPlatform, { icon: string; label: string }> = {
    standalonewindows: {
      icon: "mdi:microsoft-windows",
      label: "Windows"
    },
    android: {
      icon: "mdi:android",
      label: "Android"
    },
    ios: {
      icon: "mdi:apple-ios",
      label: "iOS"
    }
  };

  interface Props {
    world: WorldData | null;
    onClose: () => void;
    loading?: boolean;
    error?: string | null;
  }

  let { world, onClose, loading = false, error = null }: Props = $props();

  const imageUrl = $derived(world?.imageUrl ?? world?.thumbnailImageUrl ?? "");
  const platformList = $derived(
    [...new Set(world?.unityPackages?.map((pkg) => pkg.platform) ?? [])]
      .filter((platform): platform is SupportedPlatform => platform in PLATFORM_META)
  );
  const statItems = $derived.by(() => {
    if (!world) {
      return [] as Array<{ icon: string; label: string; value: string }>;
    }

    const items = [
      { icon: "mdi:account-group", label: "Capacity", value: `${world.capacity}` },
      { icon: "mdi:heart-outline", label: "Favorites", value: `${world.favorites.toLocaleString()}` },
      { icon: "mdi:walk", label: "Visits", value: `${world.visits.toLocaleString()}` }
    ];

    if (typeof world.occupants === "number") {
      items.unshift({
        icon: "mdi:account-multiple",
        label: "Occupants",
        value: `${world.occupants.toLocaleString()}`
      });
    }

    return items;
  });
  const occupancyItems = $derived.by(() => {
    if (!world) {
      return [] as Array<{ label: string; value: string }>;
    }

    const items: Array<{ label: string; value: string }> = [];

    if (typeof world.publicOccupants === "number") {
      items.push({ label: "Public occupants", value: `${world.publicOccupants.toLocaleString()}` });
    }

    if (typeof world.privateOccupants === "number") {
      items.push({ label: "Private occupants", value: `${world.privateOccupants.toLocaleString()}` });
    }

    if (world.recommendedCapacity) {
      items.push({ label: "Recommended capacity", value: `${world.recommendedCapacity}` });
    }

    if (world.releaseStatus) {
      items.push({ label: "Release status", value: world.releaseStatus });
    }

    return items;
  });
  const publishedDate = $derived(
    formatDate(world?.publicationDate ?? world?.created_at ?? "")
  );
  const updatedDate = $derived(formatDate(world?.updated_at ?? ""));
  const instanceCount = $derived(world?.slimInstances?.length ?? 0);

  function formatDate(dateStr: string): string {
    if (!dateStr) return "";

    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      onClose();
    }
  }
  </script>

<svelte:document onkeydown={handleKeydown} />

<div class="dialog-backdrop" onclick={onClose} aria-hidden="true"></div>

<div
  class="dialog-shell"
  role="dialog"
  aria-modal="true"
  aria-labelledby="world-dialog-title"
>
  <div class="world-dialog">
    <button class="close-btn" type="button" title="Close" onclick={onClose}>
      <Icon icon="mdi:close" width={18} />
    </button>

    {#if world}
      <div class="hero" style:background-image={imageUrl ? `url(${imageUrl})` : undefined}>
        <div class="hero-scrim"></div>
        <div class="hero-content">
          <div class="eyebrow-row">
            <span class="eyebrow">World</span>
            {#if platformList.length > 0}
              <div class="platform-list" title="Supported platforms">
                {#each platformList as platform (platform)}
                  <span class="platform-pill">
                    <Icon icon={PLATFORM_META[platform].icon} width={14} />
                    {PLATFORM_META[platform].label}
                  </span>
                {/each}
              </div>
            {/if}
          </div>

          <h2 class="world-title" id="world-dialog-title">{world.name}</h2>

          <div class="hero-meta">
            <span>
              <Icon icon="mdi:account-edit-outline" width={14} />
              {world.authorName}
            </span>
            {#if publishedDate}
              <span>
                <Icon icon="mdi:calendar-range-outline" width={14} />
                {publishedDate}
              </span>
            {/if}
            {#if instanceCount > 0}
              <span>
                <Icon icon="mdi:server-outline" width={14} />
                {instanceCount} public instance{instanceCount === 1 ? "" : "s"}
              </span>
            {/if}
          </div>
        </div>
      </div>

      <div class="dialog-body">
        {#if loading}
          <div class="loading-banner">
            <Icon icon="mdi:loading" width={16} class="spinning" />
            Refreshing world data...
          </div>
        {/if}

        {#if error}
          <div class="message-row error-row">
            <Icon icon="mdi:alert-circle-outline" width={16} />
            <span>{error}</span>
          </div>
        {/if}

        <div class="stats-grid">
          {#each statItems as stat (stat.label)}
            <div class="stat-card">
              <span class="stat-icon"><Icon icon={stat.icon} width={16} /></span>
              <span class="stat-value">{stat.value}</span>
              <span class="stat-label">{stat.label}</span>
            </div>
          {/each}
        </div>

        {#if world.description}
          <section class="section">
            <h3>About</h3>
            <p>{world.description}</p>
          </section>
        {/if}

        {#if occupancyItems.length > 0}
          <section class="section detail-grid">
            {#each occupancyItems as item (item.label)}
              <div class="detail-row">
                <span class="detail-label">{item.label}</span>
                <span class="detail-value">{item.value}</span>
              </div>
            {/each}
            {#if updatedDate}
              <div class="detail-row">
                <span class="detail-label">Updated</span>
                <span class="detail-value">{updatedDate}</span>
              </div>
            {/if}
          </section>
        {/if}

        {#if world.tags && world.tags.length > 0}
          <section class="section">
            <h3>Tags</h3>
            <div class="tag-list">
              {#each world.tags as tag (tag)}
                <span class="tag">{tag.replace(/^author_tag_/, "")}</span>
              {/each}
            </div>
          </section>
        {/if}
      </div>
    {:else if loading}
      <div class="dialog-state">
        <Icon icon="mdi:loading" width={24} class="spinning" />
        <h2 class="dialog-title" id="world-dialog-title">Loading world</h2>
      </div>
    {:else}
      <div class="dialog-state">
        <Icon icon="mdi:earth-off" width={24} />
        <h2 class="dialog-title" id="world-dialog-title">World unavailable</h2>
        {#if error}
          <p class="dialog-copy">{error}</p>
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  .dialog-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(7, 10, 18, 0.7);
    backdrop-filter: blur(10px);
    z-index: 99;
  }

  .dialog-shell {
    position: fixed;
    inset: 0;
    display: grid;
    place-items: center;
    padding: 1.5rem;
    z-index: 100;
    pointer-events: none;
  }

  .world-dialog {
    position: relative;
    width: min(100%, 760px);
    max-height: min(100%, 860px);
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 18px;
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);
    overflow: hidden;
    pointer-events: auto;
  }

  .close-btn {
    position: absolute;
    top: 0.9rem;
    right: 0.9rem;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 999px;
    color: #fff;
    background: rgba(0, 0, 0, 0.28);
    transition: background 0.15s, color 0.15s;
  }

  .close-btn:hover {
    background: rgba(0, 0, 0, 0.45);
  }

  .hero {
    position: relative;
    min-height: 250px;
    display: flex;
    align-items: flex-end;
    background-color: var(--bg-card);
    background-position: center;
    background-size: cover;
  }

  .hero-scrim {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(6, 10, 20, 0.18), rgba(6, 10, 20, 0.9));
  }

  .hero-content {
    position: relative;
    width: 100%;
    padding: 1.5rem;
    color: #fff;
  }

  .eyebrow-row {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: flex-start;
  }

  .eyebrow {
    display: inline-flex;
    align-items: center;
    min-height: 28px;
    padding: 0 0.7rem;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.12);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .platform-list {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 0.4rem;
  }

  .platform-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    min-height: 28px;
    padding: 0 0.65rem;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.32);
    font-size: 0.78rem;
  }

  .world-title {
    margin: 0.85rem 0 0;
    font-size: clamp(1.6rem, 3vw, 2.4rem);
    line-height: 1.05;
  }

  .hero-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem 1rem;
    margin-top: 0.8rem;
    font-size: 0.84rem;
    color: rgba(255, 255, 255, 0.88);
  }

  .hero-meta span {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }

  .dialog-body {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-height: calc(min(100vh, 860px) - 250px);
    padding: 1.25rem;
    overflow-y: auto;
  }

  .loading-banner,
  .message-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.8rem 0.95rem;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.04);
    color: var(--text-secondary);
  }

  .error-row {
    color: #ef9a9a;
    background: rgba(239, 83, 80, 0.12);
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 0.75rem;
  }

  .stat-card {
    display: grid;
    gap: 0.35rem;
    padding: 0.95rem;
    border-radius: 14px;
    background: var(--bg-card);
    border: 1px solid var(--border);
  }

  .stat-icon {
    color: var(--accent);
  }

  .stat-value {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  .stat-label {
    font-size: 0.75rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .section {
    display: grid;
    gap: 0.7rem;
  }

  .section h3 {
    margin: 0;
    font-size: 0.84rem;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .section p {
    margin: 0;
    color: var(--text-primary);
    line-height: 1.55;
    white-space: pre-wrap;
  }

  .detail-grid {
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.8rem 0.95rem;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--border);
  }

  .detail-label {
    color: var(--text-muted);
  }

  .detail-value {
    color: var(--text-primary);
    font-weight: 600;
    text-align: right;
  }

  .tag-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
  }

  .tag {
    display: inline-flex;
    align-items: center;
    min-height: 30px;
    padding: 0 0.7rem;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.06);
    color: var(--text-secondary);
    font-size: 0.78rem;
  }

  .dialog-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.65rem;
    min-height: 260px;
    padding: 2rem 1.5rem;
    color: var(--text-secondary);
    text-align: center;
  }

  .dialog-title {
    margin: 0;
    font-size: 1rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  .dialog-copy {
    margin: 0;
    font-size: 0.84rem;
  }

  @media (max-width: 720px) {
    .dialog-shell {
      padding: 0.75rem;
    }

    .world-dialog {
      width: 100%;
      max-height: 100%;
    }

    .hero {
      min-height: 220px;
    }

    .eyebrow-row {
      flex-direction: column;
    }

    .platform-list {
      justify-content: flex-start;
    }

    .dialog-body {
      max-height: calc(100vh - 220px - 1.5rem);
      padding: 1rem;
    }

    .detail-row {
      flex-direction: column;
      gap: 0.35rem;
    }

    .detail-value {
      text-align: left;
    }
  }
</style>