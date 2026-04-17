<script lang="ts">
  import Icon from "@iconify/svelte";
  import { searchWorlds, fetchWorld } from "../stores/auth.svelte";
  import { getFavorites } from "../stores/favorites.svelte";
  import type { InstanceGroup, WorldData } from "../types";
  import WorldCard from "./WorldCard.svelte";
  import WorldDialog from "./WorldDialog.svelte";

  interface Props {
    refreshToken: number;
    onRefresh?: () => void;
  }

  let { refreshToken, onRefresh }: Props = $props();

  const PAGE_SIZE = 20;

  let worlds = $state<WorldData[]>([]);
  let tagInput = $state("");
  let tags = $state<string[]>([]);
  let sortField = $state("popularity");
  let order = $state<"ascending" | "descending">("descending");
  let loading = $state(false);
  let loadingMore = $state(false);
  let error = $state<string | null>(null);
  let hasMore = $state(true);
  let offset = $state(0);
  let lastRefreshToken = -1;
  let loadGeneration = 0;

  // Favorites filter
  const favorites = getFavorites();
  let favoriteFilter = $state<string | null>(null);
  let favFilterOpen = $state(false);

  // World dialog state
  let selectedWorld = $state<WorldData | null>(null);
  let selectedGroup = $state<InstanceGroup | null>(null);
  let worldLoading = $state(false);
  let worldError = $state<string | null>(null);
  let worldDialogOpen = $state(false);
  let worldRequestToken = 0;

  async function loadWorlds(reset: boolean) {
    if (reset) {
      worlds = [];
      offset = 0;
      hasMore = true;
      error = null;
    }

    const gen = ++loadGeneration;
    const currentOffset = reset ? 0 : offset;

    if (reset) {
      loading = true;
    } else {
      loadingMore = true;
    }

    try {
      if (favoriteFilter) {
        const group = favorites.groups.find((g) => g.id === favoriteFilter);
        if (!group || group.worldIds.length === 0) {
          if (gen !== loadGeneration) return;
          worlds = [];
          offset = 0;
          hasMore = false;
          error = null;
          return;
        }
        const ids = group.worldIds.slice(currentOffset, currentOffset + PAGE_SIZE);
        const results = await Promise.all(ids.map((id) => fetchWorld(id)));
        if (gen !== loadGeneration) return;
        worlds = reset ? results : [...worlds, ...results];
        offset = currentOffset + results.length;
        hasMore = currentOffset + results.length < group.worldIds.length;
        error = null;
      } else {
        const results = await searchWorlds(
          "",
          tags,
          currentOffset,
          PAGE_SIZE,
          sortField,
          order,
        );
        if (gen !== loadGeneration) return;
        worlds = reset ? results : [...worlds, ...results];
        offset = currentOffset + results.length;
        hasMore = results.length === PAGE_SIZE;
        error = null;
      }
    } catch (e) {
      if (gen !== loadGeneration) return;
      error = e instanceof Error ? e.message : String(e);
    } finally {
      if (gen === loadGeneration) {
        loading = false;
        loadingMore = false;
      }
    }
  }

  const PREDEFINED_TAGS: { tag: string; label: string }[] = [
    { tag: "system_labs", label: "Labs" },
    { tag: "author_tag_game", label: "Game" },
  ];

  let presetOpen = $state(false);

  function clickOutside(node: HTMLElement) {
    function handle(event: MouseEvent) {
      if (!node.contains(event.target as Node)) {
        presetOpen = false;
      }
    }
    document.addEventListener("mousedown", handle, true);
    return {
      destroy() {
        document.removeEventListener("mousedown", handle, true);
      },
    };
  }

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  function scheduleReload() {
    if (debounceTimer !== null) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      void loadWorlds(true);
    }, 300);
  }

  const SORT_FIELDS = [
    "popularity",
    "favorites",
    "random",
    "shuffle",
    "trust",
    "magic",
    "created",
    "heat",
  ] as const;

  let sortOpen = $state(false);

  function clickOutsideSort(node: HTMLElement) {
    function handle(event: MouseEvent) {
      if (!node.contains(event.target as Node)) {
        sortOpen = false;
      }
    }
    document.addEventListener("mousedown", handle, true);
    return {
      destroy() {
        document.removeEventListener("mousedown", handle, true);
      },
    };
  }

  function clickOutsideFavFilter(node: HTMLElement) {
    function handle(event: MouseEvent) {
      if (!node.contains(event.target as Node)) {
        favFilterOpen = false;
      }
    }
    document.addEventListener("mousedown", handle, true);
    return {
      destroy() {
        document.removeEventListener("mousedown", handle, true);
      },
    };
  }

  $effect(() => {
    // track tags reactively
    tags.length;
    scheduleReload();
  });

  $effect(() => {
    sortField;
    order;
    scheduleReload();
  });

  $effect(() => {
    favoriteFilter;
    scheduleReload();
  });

  $effect(() => {
    if (refreshToken === lastRefreshToken) return;
    lastRefreshToken = refreshToken;
    if (refreshToken >= 0) {
      ++loadGeneration;
      if (debounceTimer !== null) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
      }
      void loadWorlds(true);
    }
  });

  function addTag(raw: string) {
    const tag = raw.startsWith("author_tag_") ? raw : `author_tag_${raw}`;
    if (!tags.includes(tag)) {
      tags = [...tags, tag];
    }
  }

  function togglePreset(tag: string) {
    if (tags.includes(tag)) {
      tags = tags.filter((t) => t !== tag);
    } else {
      tags = [...tags, tag];
    }
  }

  function handleTagKeydown(event: KeyboardEvent) {
    if (event.key === "Enter") {
      event.preventDefault();
      const trimmed = tagInput.trim();
      if (trimmed) addTag(trimmed);
      tagInput = "";
    } else if (
      event.key === "Backspace" &&
      tagInput === "" &&
      tags.length > 0
    ) {
      tags = tags.slice(0, -1);
    }
  }

  function removeTag(tag: string) {
    tags = tags.filter((t) => t !== tag);
  }

  function closeWorldDialog() {
    worldDialogOpen = false;
    worldLoading = false;
    worldError = null;
    selectedWorld = null;
    selectedGroup = null;
  }

  async function handleWorldOpen(world: WorldData) {
    worldDialogOpen = true;
    selectedWorld = world;
    selectedGroup = null;
    worldLoading = true;
    worldError = null;

    const requestToken = ++worldRequestToken;

    try {
      const full = await fetchWorld(world.id);
      if (requestToken !== worldRequestToken) return;
      selectedWorld = full;
    } catch (e) {
      if (requestToken !== worldRequestToken) return;
      worldError = e instanceof Error ? e.message : String(e);
    } finally {
      if (requestToken === worldRequestToken) {
        worldLoading = false;
      }
    }
  }

  async function handleInstanceOpen(group: InstanceGroup) {
    worldDialogOpen = true;
    selectedWorld = group.instance?.world ?? null;
    selectedGroup = group;
    worldLoading = true;
    worldError = null;

    const requestToken = ++worldRequestToken;

    try {
      const full = await fetchWorld(group.parsed.worldId);
      if (requestToken !== worldRequestToken) return;
      selectedWorld = full;
    } catch (e) {
      if (requestToken !== worldRequestToken) return;
      if (!selectedWorld) {
        selectedWorld = group.instance?.world ?? null;
      }
      worldError = e instanceof Error ? e.message : String(e);
    } finally {
      if (requestToken === worldRequestToken) {
        worldLoading = false;
      }
    }
  }
</script>

<div class="worlds-page">
  <div class="subheader">
    <div class="search">
      <div class="search-wrapper" class:has-tags={tags.length > 0}>
        <Icon icon="mdi:tag-multiple-outline" width={18} class="search-icon" />
        {#each tags as tag (tag)}
          <span class="tag-chip">
            {tag}
            <button
              type="button"
              class="tag-remove"
              aria-label="Remove tag {tag}"
              onclick={() => removeTag(tag)}
            >
              <Icon icon="mdi:close" width={12} />
            </button>
          </span>
        {/each}
        <input
          type="text"
          class="tag-input"
          placeholder={tags.length === 0
            ? "Type a tag and press Enter"
            : "Add another tag…"}
          bind:value={tagInput}
          onkeydown={handleTagKeydown}
        />
      </div>
      <div class="preset-dropdown" use:clickOutside>
        <button
          type="button"
          class="preset-btn"
          title="Add predefined tags"
          onclick={() => (presetOpen = !presetOpen)}
        >
          <Icon icon="mdi:tag-plus-outline" width={18} />
          <Icon icon="mdi:chevron-down" width={13} class="chevron" />
        </button>
        {#if presetOpen}
          <div class="preset-panel">
            {#each PREDEFINED_TAGS as { tag, label } (tag)}
              <button
                type="button"
                class="preset-item"
                class:active={tags.includes(tag)}
                onclick={() => togglePreset(tag)}
              >
                <Icon
                  icon={tags.includes(tag)
                    ? "mdi:check-circle"
                    : "mdi:circle-outline"}
                  width={14}
                />
                {label}
              </button>
            {/each}
          </div>
        {/if}
      </div>
      <div class="preset-dropdown" use:clickOutsideSort>
        <button
          type="button"
          class="preset-btn"
          title="Sort by"
          onclick={() => (sortOpen = !sortOpen)}
        >
          <Icon icon="mdi:sort" width={18} />
          <span class="sort-label">{sortField}</span>
          <Icon icon="mdi:chevron-down" width={13} class="chevron" />
        </button>
        {#if sortOpen}
          <div class="preset-panel">
            {#each SORT_FIELDS as field (field)}
              <button
                type="button"
                class="preset-item"
                class:active={sortField === field}
                onclick={() => {
                  sortField = field;
                  sortOpen = false;
                }}
              >
                <Icon
                  icon={sortField === field
                    ? "mdi:check-circle"
                    : "mdi:circle-outline"}
                  width={14}
                />
                {field}
              </button>
            {/each}
          </div>
        {/if}
      </div>
      <button
        type="button"
        class="order-btn"
        title={order === "descending" ? "Descending" : "Ascending"}
        onclick={() => {
          order = order === "descending" ? "ascending" : "descending";
        }}
      >
        <Icon
          icon={order === "descending"
            ? "mdi:sort-descending"
            : "mdi:sort-ascending"}
          width={18}
        />
      </button>
    </div>
    <div class="controls">
      <div class="preset-dropdown" use:clickOutsideFavFilter>
        <button
          type="button"
          class="preset-btn"
          class:fav-filter-active={favoriteFilter !== null}
          title="Filter by favorite group"
          onclick={() => (favFilterOpen = !favFilterOpen)}
        >
          <Icon
            icon={favoriteFilter !== null ? "mdi:star" : "mdi:star-outline"}
            width={16}
            class={favoriteFilter !== null ? "fav-star-active" : ""}
          />
          <span class="sort-label">
            {favoriteFilter
              ? (favorites.groups.find((g) => g.id === favoriteFilter)?.name ?? "Favorites")
              : "Favorites"}
          </span>
          <Icon icon="mdi:chevron-down" width={13} class="chevron" />
        </button>
        {#if favFilterOpen}
          <div class="preset-panel fav-filter-panel">
            <button
              type="button"
              class="preset-item"
              class:active={favoriteFilter === null}
              onclick={() => {
                favoriteFilter = null;
                favFilterOpen = false;
              }}
            >
              <Icon
                icon={favoriteFilter === null ? "mdi:check-circle" : "mdi:circle-outline"}
                width={14}
              />
              All worlds
            </button>
            {#if favorites.groups.length > 0}
              <div class="fav-filter-separator"></div>
              {#each favorites.groups as group (group.id)}
                <button
                  type="button"
                  class="preset-item"
                  class:active={favoriteFilter === group.id}
                  onclick={() => {
                    favoriteFilter = group.id;
                    favFilterOpen = false;
                  }}
                >
                  <Icon
                    icon={favoriteFilter === group.id
                      ? "mdi:check-circle"
                      : "mdi:circle-outline"}
                    width={14}
                  />
                  {group.name}
                  <span class="fav-filter-count">{group.worldIds.length}</span>
                </button>
              {/each}
            {:else}
              <p class="fav-filter-empty">No favorite groups yet</p>
            {/if}
          </div>
        {/if}
      </div>
      <button
        class="refresh-btn"
        onclick={onRefresh}
        disabled={loading || loadingMore}
        title="Refresh"
      >
        <Icon
          icon="mdi:refresh"
          width={20}
          class={loading || loadingMore ? "spinning" : ""}
        />
      </button>
      {#if worlds.length > 0}
        <span class="count"
          >{worlds.length} world{worlds.length === 1 ? "" : "s"}</span
        >
      {/if}
    </div>
  </div>

  <div class="content">
    {#if loading}
      <div class="state-view">
        <Icon icon="mdi:loading" width={32} class="spinning" />
        <p>Loading worlds…</p>
      </div>
    {:else if error && worlds.length === 0}
      <div class="state-view error-view">
        <Icon icon="mdi:alert-circle-outline" width={32} />
        <p>{error}</p>
        <button class="retry-btn" onclick={() => void loadWorlds(true)}
          >Retry</button
        >
      </div>
    {:else if worlds.length === 0}
      <div class="state-view">
        <Icon icon="mdi:earth-off" width={48} />
        <p>No worlds found</p>
      </div>
    {:else}
      <div class="worlds-grid">
        {#each worlds as world (world.id)}
          <WorldCard {world} onWorldOpen={handleWorldOpen} />
        {/each}
      </div>

      {#if error}
        <div class="load-error">
          <Icon icon="mdi:alert-circle-outline" width={14} />
          <span>{error}</span>
        </div>
      {/if}

      {#if hasMore}
        <div class="load-more-row">
          <button
            class="load-more-btn"
            onclick={() => void loadWorlds(false)}
            disabled={loadingMore}
          >
            {#if loadingMore}
              <Icon icon="mdi:loading" width={16} class="spinning" />
              Loading…
            {:else}
              Load more
            {/if}
          </button>
        </div>
      {/if}
    {/if}
  </div>
</div>

{#if worldDialogOpen}
  <WorldDialog
    world={selectedWorld}
    group={selectedGroup}
    loading={worldLoading}
    error={worldError}
    onClose={closeWorldDialog}
    onOpenInstance={handleInstanceOpen}
  />
{/if}

<style>
  .worlds-page {
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
    flex-shrink: 0;
  }

  .search {
    display: flex;
    gap: 1rem;
    flex: 1;
  }

  .search-wrapper {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.4rem;
    background: var(--bg-input);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 0.35rem 0.75rem;
    flex: 1;
    max-width: 800px;
    color: var(--text-muted);
    min-height: 38px;
    transition: border-color 0.15s;
  }

  .search-wrapper:focus-within {
    border-color: var(--accent);
  }

  .tag-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 999px;
    padding: 0.15rem 0.55rem;
    font-size: 0.75rem;
    color: var(--text-primary);
    white-space: nowrap;
  }

  .tag-remove {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    color: var(--text-muted);
    transition: color 0.12s;
    cursor: pointer;
  }

  .tag-remove:hover {
    color: var(--text-primary);
  }

  .tag-input {
    flex: 1;
    min-width: 180px;
    font-size: 0.9rem;
    background: transparent;
    color: var(--text-primary);
  }

  .preset-dropdown {
    position: relative;
    flex-shrink: 0;
  }

  .preset-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    padding: 0.35rem 0.6rem;
    border-radius: 8px;
    background: var(--bg-input);
    border: 1px solid var(--border);
    color: var(--text-secondary);
    cursor: pointer;
    transition:
      border-color 0.15s,
      color 0.15s;
    height: 38px;
    white-space: nowrap;
  }

  .preset-btn:hover {
    border-color: var(--accent);
    color: var(--text-primary);
  }

  .sort-label {
    font-size: 0.83rem;
    text-transform: capitalize;
  }

  .order-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0 0.6rem;
    border-radius: 8px;
    background: var(--bg-input);
    border: 1px solid var(--border);
    color: var(--text-secondary);
    cursor: pointer;
    transition:
      border-color 0.15s,
      color 0.15s;
    height: 38px;
    flex-shrink: 0;
  }

  .order-btn:hover {
    border-color: var(--accent);
    color: var(--text-primary);
  }

  .preset-panel {
    position: absolute;
    top: calc(100% + 4px);
    right: 0;
    z-index: 50;
    background: var(--bg-card, #1e1e2e);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 0.4rem;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    min-width: 160px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  }

  .preset-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 0.6rem;
    border-radius: 6px;
    font-size: 0.83rem;
    color: var(--text-secondary);
    text-align: left;
    cursor: pointer;
    transition:
      background 0.12s,
      color 0.12s;
    white-space: nowrap;
  }

  .preset-item:hover {
    background: rgba(255, 255, 255, 0.06);
    color: var(--text-primary);
  }

  .preset-item.active {
    color: var(--accent);
  }

  .controls {
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

  .count {
    font-size: 0.9rem;
    color: var(--text-secondary);
    white-space: nowrap;
  }

  .content {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .worlds-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: 0.5rem;
  }

  @media (max-width: 560px) {
    .worlds-grid {
      grid-template-columns: minmax(240px, 1fr);
    }
  }

  .state-view {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    flex: 1;
    min-height: 200px;
    color: var(--text-muted);
  }

  .error-view {
    color: #ef5350;
  }

  .retry-btn {
    background: var(--accent);
    color: #fff;
    padding: 0.5rem 1.25rem;
    border-radius: 6px;
    font-size: 0.9rem;
    transition: background 0.2s;
    cursor: pointer;
  }

  .retry-btn:hover {
    background: var(--accent-hover);
  }

  .load-error {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.82rem;
    color: #ef9a9a;
    padding: 0.5rem 0;
  }

  .load-more-row {
    display: flex;
    justify-content: center;
    padding: 0.5rem 0 0.25rem;
  }

  .load-more-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.55rem 1.5rem;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.07);
    color: var(--text-primary);
    font-size: 0.88rem;
    transition:
      background 0.15s,
      opacity 0.15s;
    cursor: pointer;
  }

  .load-more-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.12);
  }

  .load-more-btn:disabled {
    opacity: 0.6;
    cursor: default;
  }

  :global(.spinning) {
    animation: spin 1s linear infinite;
  }

  :global(.fav-star-active) {
    color: #ffd740;
  }

  .fav-filter-active {
    border-color: #ffd740 !important;
    color: #ffd740 !important;
  }

  .fav-filter-panel {
    left: auto;
    right: 0;
  }

  .fav-filter-separator {
    height: 1px;
    background: var(--border);
    margin: 0.2rem 0;
  }

  .fav-filter-count {
    margin-left: auto;
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .fav-filter-empty {
    margin: 0;
    padding: 0.3rem 0.6rem;
    font-size: 0.8rem;
    color: var(--text-muted);
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
</style>
