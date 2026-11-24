<script lang="ts">
  import Icon from "@iconify/svelte";
  import { fetchInventory, sendBoop } from "../stores/auth.svelte";
  import { getErrors, reportError } from "../stores/errors.svelte";
  import { t } from "../stores/i18n.svelte";
  import { registerBackHandler } from "../stores/back-button.svelte";
  import { isAndroid } from "../utils/platform";
  import {
    DEFAULT_EMOJIS,
    DEFAULT_EMOJI_ICONS,
    type InventoryItem,
    type UserProfile,
  } from "../types";

  interface Props {
    user: UserProfile;
    onClose: () => void;
  }

  let { user, onClose }: Props = $props();

  type Tab = "emoji" | "stickers" | "inventory";
  type Selection =
    | { kind: "none" }
    | { kind: "emoji"; emojiId: string }
    | { kind: "item"; item: InventoryItem };

  let tab = $state<Tab>("emoji");
  let selection = $state<Selection>({ kind: "none" });
  let inventory = $state<InventoryItem[]>([]);
  let inventoryLoading = $state(false);
  let inventoryError = $state<string | null>(null);
  let sending = $state(false);
  let inventoryRequested = false;

  const errors = getErrors();

  const tabs = $derived<{ id: Tab; label: string }[]>([
    { id: "emoji", label: t("boop.tabEmoji") },
    { id: "stickers", label: t("boop.tabStickers") },
    { id: "inventory", label: t("boop.tabInventory") },
  ]);
  const customEmojiItems = $derived(
    inventory.filter((item) => item.itemType === "emoji"),
  );
  const stickerItems = $derived(
    inventory.filter((item) => item.itemType === "sticker"),
  );
  const currentItems = $derived(
    tab === "stickers" ? stickerItems : tab === "inventory" ? inventory : [],
  );

  $effect(() => {
    if (!isAndroid) return;
    return registerBackHandler(() => {
      onClose();
      return true;
    });
  });

  $effect(() => {
    void loadInventory();
  });

  async function loadInventory() {
    if (inventoryRequested) return;
    inventoryRequested = true;
    inventoryLoading = true;
    inventoryError = null;
    try {
      inventory = await fetchInventory();
    } catch (e) {
      inventoryError = e instanceof Error ? e.message : String(e);
    } finally {
      inventoryLoading = false;
    }
  }

  function selectEmoji(emojiId: string) {
    selection =
      selection.kind === "emoji" && selection.emojiId === emojiId
        ? { kind: "none" }
        : { kind: "emoji", emojiId };
  }

  function selectItem(item: InventoryItem) {
    selection =
      selection.kind === "item" && selection.item.id === item.id
        ? { kind: "none" }
        : { kind: "item", item };
  }

  function isItemSelected(item: InventoryItem): boolean {
    return selection.kind === "item" && selection.item.id === item.id;
  }

  function itemImage(item: InventoryItem): string {
    return item.imageUrl || item.metadata?.imageUrl || "";
  }

  async function handleSend() {
    if (sending) return;
    sending = true;
    try {
      if (selection.kind === "emoji") {
        await sendBoop(user.id, { emojiId: selection.emojiId });
      } else if (selection.kind === "item") {
        await sendBoop(user.id, { inventoryItemId: selection.item.id });
      } else {
        await sendBoop(user.id, {});
      }
      errors.reportSuccess(t("boop.success", { name: user.displayName }));
      onClose();
    } catch (e) {
      reportError(t("boop.failed"), e);
    } finally {
      sending = false;
    }
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
  aria-labelledby="boop-dialog-title"
>
  <div class="boop-dialog">
    <div class="dialog-actions">
      <button class="close-btn" type="button" title={t("common.close")} onclick={onClose}>
        <Icon icon="mdi:close" width="1.125rem" />
      </button>
    </div>

    <h2 class="boop-title" id="boop-dialog-title">
      <Icon icon="mdi:gesture-tap" width="1.15rem" />
      {t("boop.title", { name: user.displayName })}
    </h2>

    <div class="boop-tabs" role="tablist" aria-label={t("boop.title", { name: user.displayName })}>
      {#each tabs as tabOption (tabOption.id)}
        <button
          class="boop-tab"
          class:active={tab === tabOption.id}
          type="button"
          role="tab"
          aria-selected={tab === tabOption.id}
          onclick={() => (tab = tabOption.id)}
        >
          {tabOption.label}
        </button>
      {/each}
    </div>

    <div class="boop-content">
      {#if tab === "emoji"}
        <div class="picker-grid">
          <button
            class="picker-item"
            class:selected={selection.kind === "none"}
            type="button"
            title={t("boop.noneHint")}
            onclick={() => (selection = { kind: "none" })}
          >
            <Icon icon="mdi:gesture-tap" width="1.4rem" />
            <span class="picker-label">{t("boop.none")}</span>
          </button>
          {#each DEFAULT_EMOJIS as emojiId (emojiId)}
            <button
              class="picker-item"
              class:selected={selection.kind === "emoji" && selection.emojiId === emojiId}
              type="button"
              title={emojiId}
              onclick={() => selectEmoji(emojiId)}
            >
              <Icon
                icon={DEFAULT_EMOJI_ICONS[emojiId] ?? "mdi:emoticon-outline"}
                width="1.4rem"
              />
            </button>
          {/each}
        </div>
        {#if customEmojiItems.length > 0}
          <h3 class="picker-section">{t("boop.custom")}</h3>
          <div class="picker-grid">
            {#each customEmojiItems as item (item.id)}
              <button
                class="picker-item item-tile"
                class:selected={isItemSelected(item)}
                type="button"
                title={item.name}
                onclick={() => selectItem(item)}
              >
                {#if itemImage(item)}
                  <img src={itemImage(item)} alt={item.name} class="picker-img" loading="lazy" />
                {:else}
                  <Icon icon="mdi:emoticon-outline" width="1.4rem" />
                {/if}
                <span class="picker-label">{item.name}</span>
              </button>
            {/each}
          </div>
        {/if}
      {:else if inventoryLoading}
        <div class="picker-status">
          <Icon icon="mdi:loading" width="1.25rem" class="spinning" />
          {t("boop.loading")}
        </div>
      {:else if inventoryError}
        <div class="picker-status error-text">
          {t("boop.loadFailed")}: {inventoryError}
        </div>
      {:else if currentItems.length === 0}
        <div class="picker-status">{t("boop.empty")}</div>
      {:else}
        <div class="picker-grid">
          {#each currentItems as item (item.id)}
            <button
              class="picker-item item-tile"
              class:selected={isItemSelected(item)}
              type="button"
              title={item.name}
              onclick={() => selectItem(item)}
            >
              {#if itemImage(item)}
                <img src={itemImage(item)} alt={item.name} class="picker-img" loading="lazy" />
              {:else}
                <Icon icon="mdi:package-variant-closed" width="1.4rem" />
              {/if}
              <span class="picker-label">{item.name}</span>
            </button>
          {/each}
        </div>
      {/if}
    </div>

    <div class="boop-footer">
      <button class="send-btn" type="button" disabled={sending} onclick={handleSend}>
        {#if sending}
          <Icon icon="mdi:loading" width="1rem" class="spinning" />
          {t("boop.sending")}
        {:else}
          <Icon icon="mdi:gesture-tap" width="1rem" />
          {t("boop.send")}
        {/if}
      </button>
    </div>
  </div>
</div>

<style>
  .dialog-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(7, 10, 18, 0.7);
    backdrop-filter: blur(10px);
    z-index: 150;
  }

  .dialog-shell {
    position: fixed;
    inset: 0;
    display: grid;
    place-items: center;
    padding: 1.5rem;
    pointer-events: none;
    z-index: 200;
  }

  .boop-dialog {
    position: relative;
    display: flex;
    flex-direction: column;
    width: min(100%, 480px);
    max-height: min(100%, 720px);
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

  .boop-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0;
    padding: 1.1rem 1.25rem 0.75rem;
    font-size: 1rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  .boop-tabs {
    display: flex;
    gap: 0.4rem;
    padding: 0 1.25rem 0.75rem;
    border-bottom: 1px solid var(--border);
  }

  .boop-tab {
    padding: 0.35rem 0.8rem;
    border: 1px solid var(--border);
    border-radius: 8px;
    font-size: 0.8rem;
    color: var(--text-secondary);
    transition: all 0.15s;
  }

  .boop-tab:hover {
    color: var(--text-primary);
    background: rgba(255, 255, 255, 0.05);
  }

  .boop-tab.active {
    color: var(--accent);
    border-color: rgba(76, 175, 80, 0.5);
    background: rgba(76, 175, 80, 0.12);
  }

  .boop-content {
    flex: 1;
    min-height: 12rem;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 0.9rem 1.25rem;
  }

  .picker-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(4rem, 1fr));
    gap: 0.45rem;
  }

  .picker-section {
    margin: 0.9rem 0 0.5rem;
    font-size: 0.72rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--text-muted);
  }

  .picker-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
    min-height: 3.4rem;
    padding: 0.4rem 0.25rem;
    border: 1px solid var(--border);
    border-radius: 10px;
    color: var(--text-secondary);
    background: var(--bg-card);
    transition: all 0.15s;
  }

  .picker-item:hover {
    color: var(--text-primary);
    background: var(--bg-card-hover);
  }

  .picker-item.selected {
    color: var(--accent);
    border-color: rgba(76, 175, 80, 0.6);
    background: rgba(76, 175, 80, 0.14);
  }

  .picker-img {
    width: 1.6rem;
    height: 1.6rem;
    object-fit: contain;
    border-radius: 4px;
  }

  .picker-label {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.68rem;
    color: var(--text-muted);
  }

  .picker-item.selected .picker-label {
    color: var(--accent);
  }

  .picker-status {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    min-height: 12rem;
    font-size: 0.84rem;
    color: var(--text-secondary);
    text-align: center;
  }

  .error-text {
    color: #ef9a9a;
  }

  .boop-footer {
    padding: 0.75rem 1.25rem 1rem;
    border-top: 1px solid var(--border);
  }

  .send-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;
    width: 100%;
    padding: 0.7rem;
    border-radius: 10px;
    font-size: 0.88rem;
    font-weight: 600;
    color: #fff;
    background: var(--accent);
    transition: background 0.15s;
  }

  .send-btn:hover:not(:disabled) {
    background: var(--accent-hover);
  }

  .send-btn:disabled {
    opacity: 0.6;
    cursor: default;
  }

  :global(.spinning) {
    animation: boop-spin 1s linear infinite;
  }

  @keyframes boop-spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 520px) {
    .dialog-shell {
      padding: 0.75rem;
    }

    .boop-dialog {
      width: 100%;
      max-height: calc(100dvh - 1.5rem);
    }
  }
</style>
