<script lang="ts">
  import Icon from "@iconify/svelte";
  import { openUrl } from "@tauri-apps/plugin-opener";
  import { fetchOwnPrints, getAuth } from "../stores/auth.svelte";
  import type { PrintData } from "../types";

  interface Props {
    refreshToken: number;
    onRefresh?: () => void;
  }

  let { refreshToken, onRefresh }: Props = $props();

  const auth = getAuth();
  let prints = $state.raw<PrintData[]>([]);
  let loading = $state(false);
  let error = $state<string | null>(null);
  let requestToken = 0;
  let lastRefreshToken = -1;
  let lastLoadedUserId: string | null = null;

  function formatDate(value: string): string {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  }

  async function loadPrints(force = false): Promise<void> {
    const userId = auth.user?.id;

    if (!userId) {
      prints = [];
      error = null;
      loading = false;
      return;
    }

    if (!force && loading) {
      return;
    }

    loading = true;
    error = null;
    const currentRequest = ++requestToken;

    try {
      const result = await fetchOwnPrints(userId);

      if (currentRequest !== requestToken) {
        return;
      }

      prints = result;
      lastLoadedUserId = userId;
    } catch (value) {
      if (currentRequest !== requestToken) {
        return;
      }

      error = value instanceof Error ? value.message : String(value);
    } finally {
      if (currentRequest === requestToken) {
        loading = false;
      }
    }
  }

  async function openAuthorProfile(authorId: string | undefined) {
    if (!authorId) return;
    await openUrl(
      `https://vrchat.com/home/user/${encodeURIComponent(authorId)}`,
    );
  }

  async function openWorldPage(worldId: string | undefined) {
    if (!worldId) return;
    await openUrl(
      `https://vrchat.com/home/world/${encodeURIComponent(worldId)}`,
    );
  }

  let selectedPrint: PrintData | null = $state(null);

  function openLightbox(print: PrintData) {
    selectedPrint = print;
  }

  function closeLightbox() {
    selectedPrint = null;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") closeLightbox();
  }

  $effect(() => {
    const userId = auth.user?.id;

    if (!userId) {
      prints = [];
      error = null;
      loading = false;
      lastLoadedUserId = null;
      return;
    }

    if (lastLoadedUserId !== userId && !loading) {
      void loadPrints();
    }
  });

  $effect(() => {
    if (refreshToken === lastRefreshToken) {
      return;
    }

    lastRefreshToken = refreshToken;

    if (refreshToken > 0) {
      void loadPrints(true);
    }
  });
</script>

<svelte:document on:keydown={handleKeydown} />
<div class="photos-page">
  <div class="subheader">
    <div class="section-label">
      <Icon icon="mdi:image-multiple" width={18} />
      <span>Your VRChat Prints</span>
    </div>
    <div class="online-info">
      <button
        class="refresh-btn"
        onclick={onRefresh}
        disabled={loading}
        title="Refresh"
      >
        <Icon
          icon="mdi:refresh"
          width={20}
          class={loading ? "spinning" : ""}
        />
      </button>
      <span class="online-count">Signed in as {auth.user?.displayName}</span>
    </div>
  </div>
  <div class="content">
    {#if loading && prints.length === 0}
    <div class="state-panel">
      <Icon
        icon="mdi:loading"
        width={32}
        style="animation: spin 1s linear infinite;"
      />
      <p>Loading prints...</p>
    </div>
  {:else if error}
    <div class="state-panel error-panel">
      <Icon icon="mdi:alert-circle-outline" width={32} />
      <p>{error}</p>
      <button
        class="retry-btn"
        type="button"
        onclick={() => void loadPrints(true)}>Retry</button
      >
    </div>
  {:else if prints.length === 0}
    <div class="state-panel">
      <Icon icon="mdi:image-off-outline" width={48} />
      <p>No prints found</p>
    </div>
  {:else}
    <div class="photos-grid">
      {#each prints as print (print.id)}
        <article class="photo-card">
          <button
            class="photo-frame"
            title="Open larger view"
            onclick={() => openLightbox(print)}
          >
            <img
              src={print.files.image}
              alt={`Print from ${print.worldName}`}
              loading="lazy"
            />
          </button>

          <div class="photo-meta">
            <div class="meta-row">
              <div>
                <h3>{print.worldName}</h3>
                <p class="author-line">By {print.authorName}</p>
              </div>
              <span class="date-chip">{formatDate(print.timestamp)}</span>
            </div>

            {#if print.note}
              <p class="note">{print.note}</p>
            {/if}

            <div class="details-row">
              <button
                class="detail-pill author-pill"
                title={`Open ${print.authorName} profile`}
                onclick={() => openAuthorProfile(print.authorId)}
              >
                <Icon icon="mdi:account" width={14} />
                {print.authorName}
              </button>
              <button
                class="detail-pill world-pill"
                title={`Open ${print.worldName}`}
                onclick={() => openWorldPage(print.worldId)}
              >
                <Icon icon="mdi:earth" width={14} />
                {print.worldName}
              </button>
            </div>
          </div>
        </article>
      {/each}
    </div>
  {/if}

  {#if selectedPrint}
    <div class="lightbox" onclick={closeLightbox}>
      <div class="lightbox-inner">
        <button
          class="close-btn"
          type="button"
          aria-label="Close"
          onclick={closeLightbox}>&times;</button
        >
        <div class="lightbox-image">
          <img
            src={selectedPrint.files.image}
            alt={`Print from ${selectedPrint.worldName}`}
          />
        </div>
        <div class="lightbox-meta">
          <h3>{selectedPrint.worldName}</h3>
          <p class="author-line">
            By {selectedPrint.authorName} · {formatDate(
              selectedPrint.timestamp,
            )}
          </p>
          {#if selectedPrint.note}
            <p class="note">{selectedPrint.note}</p>
          {/if}
        </div>
      </div>
    </div>
  {/if}
  </div>
</div>

<style>
  .photos-page {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;
  }

  .subheader {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 1rem;
    gap: 1rem;
    border-bottom: 1px solid var(--border);
  }

  .section-label {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
    color: var(--text-secondary);
    min-height: 38px;
  }

  .online-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-shrink: 0;
  }

  .refresh-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 6px;
    color: var(--text-secondary);
    transition: all 0.15s;
  }

  .refresh-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.05);
    color: var(--text-primary);
  }

  .refresh-btn:disabled {
    opacity: 0.5;
  }

  .online-count {
    font-size: 0.9rem;
    color: var(--text-secondary);
    white-space: nowrap;
  }

  .content {
    flex: 1;
    overflow-y: auto;
    padding: 1.25rem 1rem 1rem;
  }

  :global(.spinning) {
    animation: spin 1s linear infinite;
  }

  .photos-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1rem;
    align-content: start;
  }

  .photo-card {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid var(--border);
    border-radius: 16px;
    background: linear-gradient(
        180deg,
        rgba(255, 255, 255, 0.02),
        rgba(255, 255, 255, 0)
      ),
      var(--bg-card);
    box-shadow: 0 16px 32px rgba(0, 0, 0, 0.18);
  }

  .photo-frame {
    aspect-ratio: 4 / 3;
    background: rgba(0, 0, 0, 0.2);
  }

  .photo-frame img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .photo-meta {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1rem;
  }

  .meta-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.75rem;
  }

  h3 {
    font-size: 1rem;
    line-height: 1.3;
    color: var(--text-primary);
  }

  .author-line {
    margin-top: 0.2rem;
    color: var(--text-secondary);
    font-size: 0.88rem;
  }

  .date-chip {
    flex-shrink: 0;
    border-radius: 999px;
    padding: 0.35rem 0.65rem;
    background: rgba(76, 175, 80, 0.12);
    color: var(--text-secondary);
    font-size: 0.75rem;
  }

  .note {
    color: var(--text-primary);
    line-height: 1.45;
    white-space: pre-wrap;
  }

  .details-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .detail-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    border-radius: 999px;
    padding: 0.4rem 0.7rem;
    background: rgba(255, 255, 255, 0.04);
    color: var(--text-secondary);
    font-size: 0.8rem;
  }

  .state-panel {
    min-height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    color: var(--text-secondary);
    text-align: center;
  }

  .error-panel {
    color: #ffb4ab;
  }

  .retry-btn {
    border-radius: 999px;
    padding: 0.55rem 1rem;
    background: rgba(76, 175, 80, 0.16);
    color: var(--text-primary);
  }
  .lightbox {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.6);
    padding: 1.5rem;
  }

  .lightbox-inner {
    max-width: 1100px;
    width: 100%;
    max-height: 90vh;
    background: var(--bg-card);
    border-radius: 12px;
    overflow: auto;
    position: relative;
    padding: 1rem;
    box-shadow: 0 24px 48px rgba(0, 0, 0, 0.5);
  }

  .lightbox-image img {
    width: 100%;
    height: auto;
    display: block;
    border-radius: 8px;
    object-fit: contain;
  }

  .lightbox-meta {
    margin-top: 0.75rem;
    color: var(--text-secondary);
  }

  .close-btn {
    position: absolute;
    right: 0.6rem;
    top: 0.45rem;
    background: transparent;
    color: var(--text-primary);
    border: none;
    font-size: 1.6rem;
    line-height: 1;
    padding: 0.25rem 0.5rem;
    cursor: pointer;
  }

  .photo-frame img[role="button"] {
    cursor: zoom-in;
  }
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }

    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 720px) {
    .photos-grid {
      grid-template-columns: 1fr;
    }

    .meta-row {
      flex-direction: column;
    }
  }
</style>
