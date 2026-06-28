<script lang="ts">
  import Icon from "@iconify/svelte";
  // import { writeText } from "@tauri-apps/plugin-clipboard-manager";

  interface Props {
    onClose: () => void;
  }

  let { onClose }: Props = $props();

  let urlInput = $state("");
  let isResolving = $state(false);
  let error = $state<string | null>(null);

  function parseBilibiliUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      
      // Check if it's a bilibili URL
      if (!urlObj.hostname.includes("bilibili.com")) {
        return null;
      }

      // Extract the video ID from the path
      // Format: /video/BV1eo7N6nEU8/ or /video/BV1eo7N6nEU8
      const match = urlObj.pathname.match(/\/video\/(BV[a-zA-Z0-9]+)/);
      
      if (!match || !match[1]) {
        return null;
      }

      return match[1];
    } catch {
      // Invalid URL format
      return null;
    }
  }

  async function handleResolve() {
    error = null;

    if (!urlInput.trim()) {
      error = "Please enter a URL";
      return;
    }

    const videoId = parseBilibiliUrl(urlInput);

    if (!videoId) {
      error = "Not a valid Bilibili URL";
      return;
    }

    isResolving = true;

    try {
      const resolvedUrl = `https://ckapi.sevenbrothers.cn/bili/api?id=${videoId}`;
      urlInput = resolvedUrl;

      // Copy to clipboard
      // Problems installing deps
      // await writeText(resolvedUrl);
    } catch (e) {
      error = e instanceof Error ? e.message : "Failed to copy to clipboard";
    } finally {
      isResolving = false;
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      onClose();
    } else if (event.key === "Enter") {
      void handleResolve();
    }
  }
</script>

<svelte:document onkeydown={handleKeydown} />

<div class="dialog-backdrop" onclick={onClose} aria-hidden="true"></div>

<div
  class="dialog-shell"
  role="dialog"
  aria-modal="true"
  aria-labelledby="utility-dialog-title"
>
  <div class="utility-dialog">
    <div class="dialog-actions">
      <button class="close-btn" type="button" title="Close" onclick={onClose}>
        <Icon icon="mdi:close" width="1.125rem" />
      </button>
    </div>

    <div class="dialog-content">
      <h2 class="dialog-title" id="utility-dialog-title">
        <Icon icon="mdi:tools" width="1.25rem" />
        Utilities
      </h2>

      <div class="utility-section">
        <h3 class="section-title">Bilibili URL Resolver</h3>
        <p class="section-description">
          Convert a Bilibili video URL to a direct API link
        </p>

        <div class="input-group">
          <input
            type="text"
            class="url-input"
            placeholder="https://www.bilibili.com/video/BV..."
            bind:value={urlInput}
            disabled={isResolving}
            aria-label="Bilibili URL"
          />
        </div>

        {#if error}
          <div class="error-message">
            <Icon icon="mdi:alert-circle-outline" width="1rem" />
            {error}
          </div>
        {/if}

        <button
          class="resolve-btn"
          type="button"
          onclick={handleResolve}
          disabled={isResolving || !urlInput.trim()}
        >
          {#if isResolving}
            <Icon icon="mdi:loading" width="1rem" class="spinning" />
            Resolving...
          {:else}
            <Icon icon="mdi:check-circle-outline" width="1rem" />
            Resolve
          {/if}
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  .dialog-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(7, 10, 18, 0.7);
    backdrop-filter: blur(10px);
    z-index: 50;
  }

  .dialog-shell {
    position: fixed;
    inset: 0;
    display: grid;
    place-items: center;
    padding: 1.5rem;
    pointer-events: none;
    z-index: 100;
  }

  .utility-dialog {
    position: relative;
    width: min(100%, 540px);
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 18px;
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);
    overflow: hidden;
    pointer-events: auto;
  }

  .dialog-actions {
    position: absolute;
    top: 0.9rem;
    right: 0.9rem;
    display: flex;
    gap: 0.4rem;
    z-index: 20;
  }

  .close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--ui-control-size-md);
    height: var(--ui-control-size-md);
    border-radius: 999px;
    color: var(--text-secondary);
    background: rgba(255, 255, 255, 0.04);
    transition:
      background 0.15s,
      color 0.15s;
  }

  .close-btn:hover {
    color: var(--text-primary);
    background: rgba(255, 255, 255, 0.1);
  }

  .dialog-content {
    padding: 1.25rem;
  }

  .dialog-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0 0 1.25rem;
    font-size: 1.125rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  .utility-section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1rem;
    background: var(--bg-primary);
    border: 1px solid var(--border);
    border-radius: 12px;
  }

  .section-title {
    margin: 0;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .section-description {
    margin: 0;
    font-size: 0.8rem;
    color: var(--text-secondary);
    line-height: 1.4;
  }

  .input-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .url-input {
    width: 100%;
    padding: 0.65rem 0.85rem;
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--text-primary);
    font-size: 0.85rem;
    transition: all 0.15s;
  }

  .url-input:focus {
    outline: none;
    border-color: rgba(76, 175, 80, 0.6);
    box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.15);
  }

  .url-input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .url-input::placeholder {
    color: var(--text-muted);
  }

  .error-message {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.6rem 0.75rem;
    background: rgba(239, 83, 80, 0.1);
    border: 1px solid rgba(239, 83, 80, 0.3);
    border-radius: 8px;
    font-size: 0.8rem;
    color: #ef9a9a;
  }

  .resolve-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0.75rem;
    background: rgba(76, 175, 80, 0.15);
    border: 1px solid rgba(76, 175, 80, 0.3);
    border-radius: 8px;
    font-size: 0.88rem;
    font-weight: 600;
    color: var(--accent);
    transition: all 0.15s;
  }

  .resolve-btn:hover:enabled {
    background: rgba(76, 175, 80, 0.25);
    border-color: rgba(76, 175, 80, 0.5);
  }

  .resolve-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  :global(.spinning) {
    animation: utility-spin 1s linear infinite;
  }

  @keyframes utility-spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 520px) {
    .dialog-shell {
      padding: 1rem;
      align-items: end;
    }

    .utility-dialog {
      width: 100%;
    }
  }
</style>
