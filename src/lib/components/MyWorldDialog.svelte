<script lang="ts">
  import Icon from "@iconify/svelte";
  import { openUrl } from "@tauri-apps/plugin-opener";
  import {
    PLATFORM_META,
    SUPPORTED_PLATFORMS,
    type SupportedPlatform,
    type WorldData,
  } from "../types";

  interface Props {
    world: WorldData | null;
    onClose: () => void;
  }

  let { world, onClose }: Props = $props();

  const imageUrl = $derived(world?.thumbnailImageUrl ?? world?.imageUrl ?? "");

  const platformList = $derived(
    [...new Set(world?.unityPackages?.map((pkg) => pkg.platform) ?? [])].filter(
      (platform): platform is SupportedPlatform =>
        SUPPORTED_PLATFORMS.includes(platform as SupportedPlatform),
    ),
  );

  const publishedDate = $derived(
    world?.publicationDate && world.publicationDate !== "none"
      ? world.publicationDate
      : "",
  );

  const labsDate = $derived(
    world?.labsPublicationDate && world.labsPublicationDate !== "none"
      ? world.labsPublicationDate
      : "",
  );

  const activeInstances = $derived(world?.slimInstances?.length ?? 0);

  const stats = $derived(
    world
      ? ([
          ["Favorites", (world.favorites ?? 0).toLocaleString()],
          ["Visits", (world.visits ?? 0).toLocaleString()],
          ["Capacity", String(world.capacity ?? 0)],
          world.recommendedCapacity
            ? ["Recommended", String(world.recommendedCapacity)]
            : null,
          ["Occupants", String(world.occupants ?? 0)],
          activeInstances > 0 ? ["Active Instances", String(activeInstances)] : null,
          world.heat !== undefined ? ["Heat", String(world.heat)] : null,
          world.popularity !== undefined ? ["Popularity", String(world.popularity)] : null,
          world.created_at ? ["Created", formatDate(world.created_at)] : null,
          world.updated_at ? ["Updated", formatDate(world.updated_at)] : null,
          publishedDate ? ["Published", formatDate(publishedDate)] : null,
          labsDate ? ["Labs", formatDate(labsDate)] : null,
        ].filter(Boolean) as [string, string][])
      : [],
  );

  let copied = $state(false);
  let copyTimer: ReturnType<typeof setTimeout> | undefined;

  async function copyWorldId() {
    if (!world?.id) return;
    try {
      await navigator.clipboard.writeText(world.id);
      copied = true;
      clearTimeout(copyTimer);
      copyTimer = setTimeout(() => (copied = false), 1500);
    } catch {
      copied = false;
    }
  }

  function formatDate(dateStr: string | undefined): string {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(d);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") onClose();
  }

  async function handleWorldOpen() {
    if (!world?.id) return;
    await openUrl(`https://vrchat.com/home/world/${encodeURIComponent(world.id)}`);
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="dialog-backdrop" onclick={onClose} aria-hidden="true"></div>

<div
  class="dialog-shell"
  role="dialog"
  aria-modal="true"
  aria-label={world?.name ?? "World Details"}
>
  <div class="dialog">
    <div class="dialog-header">
      <div class="header-info">
        <button
          class="header-thumbnail thumbnail-link"
          type="button"
          onclick={() => void handleWorldOpen()}
          aria-label={`Open ${world?.name ?? "world"} in VRChat`}
        >
          {#if imageUrl}
            <img src={imageUrl} alt={world?.name} />
          {:else}
            <div class="thumb-placeholder">
              <Icon icon="mdi:earth" width={24} />
            </div>
          {/if}
        </button>
        <div class="header-text">
          <h2 class="dialog-title">{world?.name ?? ""}</h2>
          <div class="header-badges">
            {#if world?.releaseStatus}
              <span class="release-badge" class:public={world.releaseStatus === "public"}>
                {world.releaseStatus}
              </span>
            {/if}
            {#each platformList as platform (platform)}
              {@const meta = PLATFORM_META[platform]}
              <span class="platform-icon" title={meta?.label ?? platform}>
                <Icon icon={meta?.icon ?? "mdi:help-circle"} width={14} />
              </span>
            {/each}
          </div>
        </div>
      </div>
      <button class="close-btn" type="button" onclick={onClose} aria-label="Close">
        <Icon icon="mdi:close" width={20} />
      </button>
    </div>

    <div class="dialog-body">
      {#if world?.id}
        <div class="id-row">
          <span class="file-label">World ID</span>
          <div class="id-value-wrapper">
            <code class="id-value">{world.id}</code>
            <button
              class="copy-btn"
              class:copied
              type="button"
              onclick={() => void copyWorldId()}
              title="Copy world ID"
              aria-label="Copy world ID"
            >
              <Icon icon={copied ? "mdi:check" : "mdi:content-copy"} width={16} />
            </button>
          </div>
        </div>
      {/if}

      {#if world?.description}
        <p class="description">{world.description}</p>
      {/if}

      {#if stats.length > 0}
        <div class="stats-grid">
          {#each stats as [label, value] (label)}
            <div class="stat-row">
              <span class="stat-label">{label}</span>
              <span class="stat-value">{value}</span>
            </div>
          {/each}
        </div>
      {/if}

      {#if world?.tags && world.tags.length > 0}
        {@const authorTags = world.tags.filter((t) => t.startsWith("author_tag_"))}
        {#if authorTags.length > 0}
          <div class="tags">
            {#each authorTags as tag (tag)}
              <span class="tag">{tag.replace("author_tag_", "")}</span>
            {/each}
          </div>
        {/if}
      {/if}
    </div>
  </div>
</div>

<style>
  .dialog-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.65);
    backdrop-filter: blur(4px);
    z-index: 100;
  }

  .dialog-shell {
    position: fixed;
    inset: 0;
    display: grid;
    place-items: center;
    padding: 1rem;
    pointer-events: none;
    z-index: 101;
  }

  .dialog {
    pointer-events: auto;
    background: var(--bg-primary);
    border: 1px solid var(--border);
    border-radius: 12px;
    width: min(640px, 100%);
    max-height: min(88vh, 700px);
    display: flex;
    flex-direction: column;
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
    overflow: hidden;
  }

  @media (max-width: 720px) {
    .dialog-shell {
      padding: 0.75rem;
    }

    .dialog {
      width: 100%;
      height: 100%;
      max-height: calc(100dvh - 1.5rem);
    }
  }

  .dialog-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    padding: 1rem 1rem 0.75rem;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }

  .header-info {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    min-width: 0;
  }

  .header-thumbnail {
    flex-shrink: 0;
    width: 56px;
    height: 56px;
    border-radius: 8px;
    overflow: hidden;
  }

  .thumbnail-link {
    padding: 0;
    border: 1px solid var(--border);
    background: transparent;
    cursor: pointer;
    transition:
      border-color 0.15s ease,
      transform 0.15s ease;
  }

  .thumbnail-link:hover,
  .thumbnail-link:focus-visible {
    border-color: var(--accent);
    transform: translateY(-1px);
  }

  .header-thumbnail img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .thumb-placeholder {
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.06);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
  }

  .header-text {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    min-width: 0;
  }

  .dialog-title {
    margin: 0;
    font-size: 1rem;
    font-weight: 700;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .header-badges {
    display: flex;
    gap: 0.4rem;
    align-items: center;
    flex-wrap: wrap;
  }

  .release-badge {
    display: inline-block;
    font-size: 0.7rem;
    color: var(--text-muted);
    text-transform: capitalize;
  }

  .release-badge.public {
    color: var(--accent);
  }

  .platform-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--text-secondary);
  }

  .close-btn {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 6px;
    color: var(--text-secondary);
    transition: all 0.15s;
    margin-top: -0.2rem;
  }

  .close-btn:hover {
    background: rgba(255, 255, 255, 0.08);
    color: var(--text-primary);
  }

  .dialog-body {
    flex: 1;
    overflow-y: auto;
    padding: 0.75rem 1rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .id-row {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 0.6rem 0.75rem;
  }

  .file-label {
    font-size: 0.7rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .id-value-wrapper {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 0;
  }

  .id-value {
    flex: 1;
    min-width: 0;
    font-family: monospace;
    font-size: 0.78rem;
    color: var(--text-primary);
    overflow-x: auto;
    white-space: nowrap;
  }

  .copy-btn {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    color: var(--text-secondary);
    transition: all 0.15s;
    cursor: pointer;
  }

  .copy-btn:hover {
    background: rgba(255, 255, 255, 0.08);
    color: var(--text-primary);
  }

  .copy-btn.copied {
    color: #4caf50;
  }

  .description {
    margin: 0;
    font-size: 0.82rem;
    line-height: 1.5;
    color: var(--text-secondary);
    white-space: pre-wrap;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0;
    border: 1px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
  }

  @media (max-width: 480px) {
    .stats-grid {
      grid-template-columns: 1fr;
    }
  }

  .stat-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.35rem 0.6rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    gap: 0.5rem;
  }

  .stat-row:nth-child(odd) {
    background: rgba(255, 255, 255, 0.02);
  }

  .stat-label {
    font-size: 0.75rem;
    color: var(--text-secondary);
    min-width: 0;
    flex: 1;
  }

  .stat-value {
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--text-primary);
    white-space: nowrap;
    flex-shrink: 0;
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }

  .tag {
    font-size: 0.7rem;
    color: var(--text-secondary);
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--border);
    border-radius: 999px;
    padding: 0.1rem 0.5rem;
  }
</style>
