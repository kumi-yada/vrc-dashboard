<script lang="ts">
  import Icon from "@iconify/svelte";
  import { t } from "../stores/i18n.svelte";
  import type { ErrorToast } from "../stores/errors.svelte";
  import { registerBackHandler } from "../stores/back-button.svelte";
  import { isAndroid } from "../utils/platform";

  interface Props {
    toast: ErrorToast;
    onClose: () => void;
  }

  let { toast, onClose }: Props = $props();

  $effect(() => {
    if (!isAndroid) return;
    return registerBackHandler(() => {
      onClose();
      return true;
    });
  });

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
  aria-labelledby="error-dialog-title"
>
  <div class="error-dialog">
    <div class="dialog-actions">
      <button class="close-btn" type="button" title={t("common.close")} onclick={onClose}>
        <Icon icon="mdi:close" width="1.125rem" />
      </button>
    </div>

    <div class="dialog-content">
      <h2 class="dialog-title" id="error-dialog-title">
        <Icon icon="mdi:alert-circle-outline" width="1.25rem" />
        {t("error.detailsTitle")}
      </h2>

      <p class="error-summary">{toast.message}</p>
      <pre class="error-details">{toast.details}</pre>
    </div>
  </div>
</div>

<style>
  .dialog-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(7, 10, 18, 0.7);
    backdrop-filter: blur(10px);
    z-index: 400;
  }

  .dialog-shell {
    position: fixed;
    inset: 0;
    display: grid;
    place-items: center;
    padding: 1.5rem;
    pointer-events: none;
    z-index: 500;
  }

  .error-dialog {
    position: relative;
    width: min(100%, 540px);
    max-height: min(100%, 860px);
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 18px;
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);
    overflow-y: auto;
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
    margin: 0 0 1rem;
    font-size: 1.125rem;
    font-weight: 700;
    color: #ff6b6b;
  }

  .error-summary {
    margin: 0 0 0.75rem;
    font-size: 0.88rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .error-details {
    margin: 0;
    padding: 0.75rem;
    max-height: 16rem;
    overflow-y: auto;
    background: var(--bg-primary);
    border: 1px solid var(--border);
    border-radius: 8px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 0.75rem;
    line-height: 1.5;
    color: #ef9a9a;
    white-space: pre-wrap;
    word-break: break-word;
    user-select: text;
  }

  @media (max-width: 520px) {
    .dialog-shell {
      padding: 0.75rem;
    }

    .error-dialog {
      width: 100%;
      max-height: calc(100dvh - 1.5rem);
    }
  }
</style>
