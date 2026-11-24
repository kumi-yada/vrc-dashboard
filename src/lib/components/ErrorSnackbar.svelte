<script lang="ts">
  import Icon from "@iconify/svelte";
  import { t } from "../stores/i18n.svelte";
  import { getErrors, type ErrorToast } from "../stores/errors.svelte";
  import ErrorDialog from "./ErrorDialog.svelte";

  const errors = getErrors();

  let detailsToast = $state<ErrorToast | null>(null);

  function openDetails(toast: ErrorToast) {
    if (toast.kind !== "error") return;
    errors.dismiss(toast.id);
    detailsToast = toast;
  }
</script>

{#if errors.toasts.length}
  <div class="snackbar-stack" role="region" aria-label={t("error.detailsTitle")}>
    {#each errors.toasts as toast (toast.id)}
      <div class="snackbar" class:success={toast.kind === "success"} role="alert">
        <button
          class="snackbar-body"
          type="button"
          title={toast.kind === "error" ? t("error.detailsHint") : undefined}
          onclick={() => openDetails(toast)}
        >
          <Icon
            icon={toast.kind === "success" ? "mdi:check-circle" : "mdi:alert-circle"}
            width="1.1rem"
            class="snackbar-icon"
          />
          <span class="snackbar-message">{toast.message}</span>
          {#if toast.kind === "error"}
            <Icon icon="mdi:information-outline" width="0.95rem" class="snackbar-hint" />
          {/if}
        </button>
        <button
          class="snackbar-close"
          type="button"
          title={t("common.close")}
          onclick={() => errors.dismiss(toast.id)}
        >
          <Icon icon="mdi:close" width="0.9rem" />
        </button>
      </div>
    {/each}
  </div>
{/if}

{#if detailsToast}
  <ErrorDialog toast={detailsToast} onClose={() => (detailsToast = null)} />
{/if}

<style>
  .snackbar-stack {
    position: fixed;
    bottom: calc(1rem + env(safe-area-inset-bottom, 0px));
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    width: min(100% - 2rem, 26rem);
    z-index: 300;
    pointer-events: none;
  }

  .snackbar {
    display: flex;
    align-items: stretch;
    background: var(--bg-secondary);
    border: 1px solid rgba(255, 107, 107, 0.45);
    border-radius: 10px;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
    overflow: hidden;
    pointer-events: auto;
    animation: snackbar-in 0.18s ease-out;
  }

  .snackbar.success {
    border-color: rgba(76, 175, 80, 0.55);
  }

  .snackbar-body {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
    min-width: 0;
    padding: 0.6rem 0.75rem;
    text-align: left;
    font-size: 0.82rem;
    color: var(--text-primary);
    transition: background 0.15s;
  }

  .snackbar-body:hover {
    background: var(--bg-card-hover);
  }

  :global(.snackbar .snackbar-icon) {
    color: #ff6b6b;
    flex-shrink: 0;
  }

  :global(.snackbar.success .snackbar-icon) {
    color: var(--accent);
  }

  .snackbar-message {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  :global(.snackbar .snackbar-hint) {
    color: var(--text-muted);
    flex-shrink: 0;
  }

  .snackbar-close {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 0.6rem;
    color: var(--text-muted);
    border-left: 1px solid var(--border);
    transition:
      background 0.15s,
      color 0.15s;
  }

  .snackbar-close:hover {
    color: var(--text-primary);
    background: var(--bg-card-hover);
  }

  @keyframes snackbar-in {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 560px) {
    .snackbar-stack {
      bottom: calc(0.5rem + env(safe-area-inset-bottom, 0px));
      width: calc(100% - 1rem);
    }
  }
</style>
