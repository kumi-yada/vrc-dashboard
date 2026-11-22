<script lang="ts">
  import Icon from "@iconify/svelte";
  import { invoke } from "@tauri-apps/api/core";
  import { openUrl } from "@tauri-apps/plugin-opener";
  import {
    SUPPORTED_PLATFORMS,
    type CreateInstanceRegion,
    type CreateInstanceType,
    type InstanceData,
    type InstanceGroup,
    type SupportedPlatform,
    type WorldData,
  } from "../types";
  import PlatformMeta from "./PlatformMeta.svelte";
  import {
    createInstance,
    getAuth,
    fetchInstance,
    fetchFavoriteGroups,
    fetchFavorites,
    addApiFavorite,
    removeApiFavorite,
  } from "../stores/auth.svelte";
  import { parseInstanceId, visibilityLabel, regionLabel } from "../utils/instance";
  import { getI18n, t, tp } from "../stores/i18n.svelte";
  import { reportError } from "../stores/errors.svelte";
  import {
    getFavorites,
    createGroup,
    toggleWorldInGroup,
    deleteGroup,
    getGroupsForWorld,
  } from "../stores/favorites.svelte";
  import {
    getSavedInstances,
    toggleSavedInstance,
  } from "../stores/saved-instances.svelte";
  import { registerBackHandler } from "../stores/back-button.svelte";
  import { isAndroid } from "../utils/platform";
  import type { ApiFavoriteGroup } from "../types";

  interface Props {
    world: WorldData | null;
    group?: InstanceGroup | null;
    onClose: () => void;
    onOpenInstance?: (group: InstanceGroup) => void | Promise<void>;
    loading?: boolean;
    error?: string | null;
  }

  let {
    world,
    group,
    onClose,
    onOpenInstance,
    loading = false,
    error = null,
  }: Props = $props();

  $effect(() => {
    if (!isAndroid) return;
    return registerBackHandler(() => {
      onClose();
      return true;
    });
  });

  const imageUrl = $derived(world?.imageUrl ?? world?.thumbnailImageUrl ?? "");
  const platformList = $derived(
    [...new Set(world?.unityPackages?.map((pkg) => pkg.platform) ?? [])].filter(
      (platform): platform is SupportedPlatform =>
        SUPPORTED_PLATFORMS.includes(platform as SupportedPlatform),
    ),
  );
  const publishedDate = $derived(
    formatDate(
      world?.publicationDate && world?.publicationDate !== "none"
        ? world?.publicationDate
        : (world?.created_at ?? ""),
    ),
  );
  const instanceCount = $derived(world?.slimInstances?.length ?? 0);
  const auth = getAuth();
  const i18n = getI18n();

  const CREATE_INSTANCE_REGIONS: CreateInstanceRegion[] = [
    "us",
    "use",
    "eu",
    "jp",
  ];
  const CREATE_INSTANCE_REGION_LABELS: Record<CreateInstanceRegion, string> = {
    us: "region.usw",
    use: "region.use",
    eu: "region.eu",
    jp: "region.jp",
  };
  const CREATE_INSTANCE_TYPES: CreateInstanceType[] = [
    "friends",
    "hidden",
    "private",
    "privateplus",
    "public",
  ];
  const CREATE_INSTANCE_TYPE_LABELS: Record<CreateInstanceType, string> = {
    friends: "itype.friends",
    hidden: "itype.hidden",
    private: "itype.private",
    privateplus: "itype.privateplus",
    public: "itype.public",
  };

  // Favorites
  const favorites = getFavorites();
  let favOpen = $state(false);
  let newGroupName = $state("");
  const activeGroupIds = $derived(world ? getGroupsForWorld(world.id) : []);

  // Saved instances (bookmarks)
  const savedInstances = getSavedInstances();
  const instanceSaved = $derived(
    group ? savedInstances.instances.some((s) => s.location === group.location) : false,
  );

  // VRChat API favorites
  let apiGroups = $state<ApiFavoriteGroup[]>([]);
  let apiCurrentFavorite = $state<{ id: string; tag: string } | null>(null);
  let apiLoading = $state(false);

  const isFavorited = $derived(activeGroupIds.length > 0 || apiCurrentFavorite !== null);

  // Create instance
  let createOpen = $state(false);
  let createRegion = $state<CreateInstanceRegion>("us");
  let createType = $state<CreateInstanceType>("friends");
  let createInvitePlus = $state(false);
  let createLoading = $state(false);
  let createError = $state<string | null>(null);
  type InviteState = "idle" | "loading" | "success" | "error";
  let inviteState = $state<InviteState>("idle");
  const inviteLocation = $derived(group?.location ?? "");

  // Watch for an open slot when the instance is full
  const WATCH_POLL_INTERVAL_MS = 5000;
  const WATCH_MAX_CONSECUTIVE_ERRORS = 12;
  let watchingForSlot = $state(false);
  let watchedInstance = $state<InstanceData | null>(null);
  let watchTimer: ReturnType<typeof setTimeout> | null = null;
  let watchErrorCount = 0;

  const displayInstance = $derived(watchedInstance ?? group?.instance ?? null);
  const isInstanceFull = $derived(
    displayInstance !== null &&
      displayInstance.capacity > 0 &&
      displayInstance.userCount >= displayInstance.capacity,
  );

  $effect(() => {
    void group?.location;
    stopWatchingForSlot();
    watchedInstance = null;
    return () => stopWatchingForSlot();
  });
  const requiresOwnerId = $derived(createType !== "public");
  const createDisabled = $derived(
    createLoading ||
      !world?.id ||
      (requiresOwnerId && !auth.user?.id),
  );

  function clickOutsideFav(node: HTMLElement) {
    function handle(event: MouseEvent) {
      if (!node.contains(event.target as Node)) {
        favOpen = false;
        createOpen = false;
      }
    }
    document.addEventListener("mousedown", handle, true);
    return {
      destroy() {
        document.removeEventListener("mousedown", handle, true);
      },
    };
  }

  function handleNewGroupKeydown(event: KeyboardEvent) {
    if (event.key === "Enter") {
      event.preventDefault();
      const name = newGroupName.trim();
      if (name && world) {
        const group = createGroup(name);
        toggleWorldInGroup(group.id, world.id);
        newGroupName = "";
      }
    }
  }

  function resetCreateForm() {
    createRegion = "us";
    createType = "friends";
    createInvitePlus = false;
    createError = null;
  }

  async function loadApiGroupData() {
    if (!world?.id) return;
    apiLoading = true;
    try {
      const [groups, allFavs] = await Promise.all([
        fetchFavoriteGroups(),
        fetchFavorites("world"),
      ]);
      apiGroups = groups.filter(g => g.type === "world");
      const match = allFavs.find(f => f.favoriteId === world!.id);
      apiCurrentFavorite = match?.tags[0] ? { id: match.id, tag: match.tags[0] } : null;
    } catch {
      // silently ignore
    } finally {
      apiLoading = false;
    }
  }

  function toggleFavPanel() {
    if (!favOpen) {
      createOpen = false;
      createError = null;
      loadApiGroupData();
    }
    favOpen = !favOpen;
  }

  async function toggleApiGroup(group: ApiFavoriteGroup) {
    const groupTag = group.name;
    if (apiCurrentFavorite?.tag === groupTag) {
      await removeApiFavorite(apiCurrentFavorite.id);
      apiCurrentFavorite = null;
    } else {
      if (apiCurrentFavorite) {
        await removeApiFavorite(apiCurrentFavorite.id);
      }
      const result = await addApiFavorite(world!.id, "world", [groupTag]);
      apiCurrentFavorite = { id: result.id, tag: groupTag };
    }
  }

  function toggleCreatePanel() {
    if (createLoading) return;
    if (!createOpen) {
      favOpen = false;
      createError = null;
    }
    createOpen = !createOpen;
    if (!createOpen) {
      resetCreateForm();
    }
  }

  function getErrorMessage(value: unknown): string {
    return value instanceof Error ? value.message : String(value);
  }

  function buildCreatedGroup(created: InstanceData): InstanceGroup | null {
    const location = created.id || `${created.worldId}:${created.instanceId}`;
    const parsed = parseInstanceId(location);
    if (!parsed) {
      return null;
    }

    let ownerName = "";
    if (parsed.ownerId && auth.user?.id === parsed.ownerId) {
      ownerName = auth.user.displayName;
    }

    return {
      location,
      parsed,
      instance: created,
      ownerName,
      friends: [],
    };
  }

  async function handleInviteInstance() {
    if (!inviteLocation || inviteState === "loading") return;
    inviteState = "loading";

    try {
      await invoke("invite_myself_to_instance", { location: inviteLocation });
      inviteState = "success";
    } catch (e) {
      inviteState = "error";
      reportError(t("error.inviteFailed"), e);
    } finally {
      setTimeout(() => {
        inviteState = "idle";
      }, 2000);
    }
  }

  function stopWatchingForSlot() {
    if (watchTimer !== null) {
      clearTimeout(watchTimer);
      watchTimer = null;
    }
    watchErrorCount = 0;
    watchingForSlot = false;
  }

  async function pollInstanceForSlot() {
    if (!watchingForSlot || !inviteLocation) return;

    try {
      const instance = await fetchInstance(inviteLocation);
      if (!watchingForSlot) return;
      watchErrorCount = 0;
      watchedInstance = instance;

      if (instance.userCount < instance.capacity) {
        stopWatchingForSlot();
        await handleInviteInstance();
        return;
      }
    } catch {
      watchErrorCount += 1;
      if (watchErrorCount >= WATCH_MAX_CONSECUTIVE_ERRORS) {
        stopWatchingForSlot();
        return;
      }
    }

    if (watchingForSlot) {
      watchTimer = setTimeout(() => {
        void pollInstanceForSlot();
      }, WATCH_POLL_INTERVAL_MS);
    }
  }

  function toggleWatchForSlot() {
    if (watchingForSlot) {
      stopWatchingForSlot();
      return;
    }
    if (!inviteLocation || !isInstanceFull) return;
    watchingForSlot = true;
    void pollInstanceForSlot();
  }

  async function handleCreateInstance() {
    if (!world?.id || createLoading) {
      return;
    }

    const ownerId = createType === "public" ? undefined : auth.user?.id;
    if (createType !== "public" && !ownerId) {
      createError = t("world.createNeedLogin");
      return;
    }

    createLoading = true;
    createError = null;

    try {
      const created = await createInstance({
        worldId: world.id,
        type: createType === "privateplus" ? "private" : createType,
        region: createRegion,
        ownerId,
        canRequestInvite: createType === "privateplus",
      });

      const createdGroup = buildCreatedGroup(created);
      if (!createdGroup) {
        createError = t("world.createErrorOpen");
        return;
      }

      createOpen = false;
      resetCreateForm();

      if (onOpenInstance) {
        onClose();
        queueMicrotask(() => {
          void onOpenInstance(createdGroup);
        });
      }

    } catch (e) {
      createError = getErrorMessage(e);
    } finally {
      createLoading = false;
    }
  }

  const TAG_PREFIX_CATEGORIES: Array<[string, string]> = [
    ["author_tag_", "author"],
    ["content_", "content"],
    ["system_", "system"],
    ["language_", "language"],
    ["platform_", "platform"],
    ["feature_", "feature"],
    ["admin_", "admin"],
  ];

  function tagCategory(tag: string): string {
    for (const [prefix, category] of TAG_PREFIX_CATEGORIES) {
      if (tag.startsWith(prefix)) return category;
    }
    return "other";
  }

  function formatDate(dateStr: string): string {
    if (!dateStr) return "";

    return new Date(dateStr).toLocaleDateString(i18n.tag, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  async function handleWorldOpen() {
    if (!world?.id) return;

    const parsed = group ? parseInstanceId(group.location) : null;
    if (parsed) {
      await openUrl(
        `https://vrchat.com/home/launch?worldId=${encodeURIComponent(parsed.worldId)}&instanceId=${parsed.instancePart}`,
      );
      return;
    }

    await openUrl(
      `https://vrchat.com/home/world/${encodeURIComponent(world.id)}`,
    );
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      if (createOpen) {
        createOpen = false;
        createError = null;
      } else if (favOpen) {
        favOpen = false;
      } else {
        onClose();
      }
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
    <button class="close-btn" type="button" title={t("common.close")} onclick={onClose}>
      <Icon icon="mdi:close" width={18} />
    </button>

    {#if world}
      <div class="fav-dropdown" use:clickOutsideFav>
        {#if world.id}
          <button
            class="copy-id-btn"
            title={t("world.copyId")}
            onclick={() => navigator.clipboard.writeText(world.id)}
            type="button"
          >
            <Icon icon="mdi:content-copy" width={16} />
          </button>
        {/if}
        <button
          class="fav-btn"
          class:fav-active={isFavorited}
          type="button"
          title={isFavorited ? t("world.editFavorites") : t("world.addToFavorites")}
          onclick={toggleFavPanel}
        >
          <Icon
            icon={isFavorited ? "mdi:star" : "mdi:star-outline"}
            width={18}
          />
        </button>
        <button
          class="create-instance-btn"
          class:active={createOpen}
          type="button"
          title={t("world.createInstance")}
          onclick={toggleCreatePanel}
        >
          <Icon icon="mdi:server-plus" width={18} />
        </button>
        {#if group}
          <button
            class="bookmark-btn"
            class:saved={instanceSaved}
            type="button"
            title={instanceSaved ? t("world.bookmarkRemove") : t("world.bookmarkSave")}
            onclick={() => toggleSavedInstance(group.location)}
          >
            <Icon
              icon={instanceSaved ? "mdi:bookmark" : "mdi:bookmark-outline"}
              width={18}
            />
          </button>
        {/if}
        {#if inviteLocation}
          {#if isInstanceFull}
            <button
              class="invite-instance-btn watch-btn"
              class:watch-active={watchingForSlot}
              class:watch-success={inviteState === "success"}
              type="button"
              title={watchingForSlot
                ? t("invite.watchSlotStop")
                : t("invite.watchSlot")}
              onclick={toggleWatchForSlot}
            >
              {#if inviteState === "success"}
                <Icon icon="mdi:check" width={16} />
              {:else if watchingForSlot}
                <Icon icon="mdi:bell-ring" width={16} />
              {:else}
                <Icon icon="mdi:bell-plus-outline" width={16} />
              {/if}
            </button>
          {:else}
            <button
              class="invite-instance-btn invite-instance-btn--{inviteState}"
              type="button"
              title={t("invite.myself")}
              onclick={handleInviteInstance}
            >
              {#if inviteState === "loading"}
                <Icon icon="mdi:loading" width={16} class="spinning" />
              {:else if inviteState === "success"}
                <Icon icon="mdi:check" width={16} />
              {:else if inviteState === "error"}
                <Icon icon="mdi:alert" width={16} />
              {:else}
                <Icon icon="mdi:email-arrow-right-outline" width={16} />
              {/if}
            </button>
          {/if}
        {/if}
        {#if favOpen}
          <div class="fav-panel">
            <p class="fav-panel-title">{t("world.favPanelTitle")}</p>
            {#if favorites.groups.length === 0}
              <p class="fav-empty">{t("world.favEmpty")}</p>
            {:else}
              {#each favorites.groups as group (group.id)}
                <div class="fav-group-row">
                  <button
                    type="button"
                    class="fav-group-btn"
                    class:active={activeGroupIds.includes(group.id)}
                    onclick={() => toggleWorldInGroup(group.id, world.id)}
                  >
                    <Icon
                      icon={activeGroupIds.includes(group.id)
                        ? "mdi:star"
                        : "mdi:star-outline"}
                      width={14}
                    />
                    {group.name}
                    <span class="fav-group-count">{group.worldIds.length}</span>
                  </button>
                  <button
                    type="button"
                    class="fav-delete-btn"
                    title={t("world.favDeleteGroup")}
                    onclick={() => deleteGroup(group.id)}
                  >
                    <Icon icon="mdi:trash-can-outline" width={13} />
                  </button>
                </div>
              {/each}
            {/if}
            <p class="fav-panel-title" style="margin-top: 8px">{t("world.apiFavTitle")}</p>
            {#if apiLoading}
              <p class="fav-empty">{t("world.apiFavLoading")}</p>
            {:else if apiGroups.length === 0}
              <p class="fav-empty">{t("world.apiFavEmpty")}</p>
            {:else}
              {#each apiGroups as group (group.id)}
                <div class="fav-group-row">
                  <button
                    type="button"
                    class="fav-group-btn"
                    class:active={apiCurrentFavorite?.tag === group.name}
                    onclick={() => toggleApiGroup(group)}
                  >
                    <Icon
                      icon={apiCurrentFavorite?.tag === group.name ? "mdi:star" : "mdi:star-outline"}
                      width={14}
                    />
                    {group.displayName}
                  </button>
                </div>
              {/each}
            {/if}
            <div class="fav-new-row">
              <input
                class="fav-new-input"
                type="text"
                placeholder={t("world.newGroupPlaceholder")}
                bind:value={newGroupName}
                onkeydown={handleNewGroupKeydown}
              />
              <button
                type="button"
                class="fav-new-btn"
                disabled={!newGroupName.trim()}
                onclick={() => {
                  const name = newGroupName.trim();
                  if (name && world) {
                    const group = createGroup(name);
                    toggleWorldInGroup(group.id, world.id);
                    newGroupName = "";
                  }
                }}
              >
                <Icon icon="mdi:plus" width={16} />
              </button>
            </div>
          </div>
        {/if}
        {#if createOpen}
          <div class="create-panel">
            <p class="fav-panel-title">{t("world.createTitle")}</p>

            <label class="create-field" for="create-region-select">
              <span>{t("world.createRegion")}</span>
              <select
                id="create-region-select"
                class="create-select"
                bind:value={createRegion}
              >
                {#each CREATE_INSTANCE_REGIONS as regionOption (regionOption)}
                  <option value={regionOption}>
                    {t(CREATE_INSTANCE_REGION_LABELS[regionOption])}
                  </option>
                {/each}
              </select>
            </label>

            <label class="create-field" for="create-type-select">
              <span>{t("world.createType")}</span>
              <select
                id="create-type-select"
                class="create-select"
                bind:value={createType}
              >
                {#each CREATE_INSTANCE_TYPES as typeOption (typeOption)}
                  <option value={typeOption}>
                    {t(CREATE_INSTANCE_TYPE_LABELS[typeOption])}
                  </option>
                {/each}
              </select>
            </label>

            {#if createType !== "public" && !auth.user?.id}
              <p class="create-help create-help-error">
                {t("world.createNeedUserId")}
              </p>
            {/if}

            {#if createError}
              <p class="create-help create-help-error">{createError}</p>
            {/if}

            <button
              type="button"
              class="create-submit-btn"
              disabled={createDisabled}
              onclick={handleCreateInstance}
            >
              {#if createLoading}
                <Icon icon="mdi:loading" width={14} class="spinning" />
                {t("world.creating")}
              {:else}
                <Icon icon="mdi:plus" width={14} />
                {t("world.create")}
              {/if}
            </button>
          </div>
        {/if}
      </div>

      
    {/if}

    {#if world}
      <button
        class="hero"
        type="button"
        onclick={handleWorldOpen}
        title={group ? t("notif.openInstance") : t("world.openVrchat")}
        aria-label={group
          ? t("notif.openInstance")
          : t("world.openWorldAria", { name: world.name })}
        style:background-image={imageUrl ? `url(${imageUrl})` : undefined}
      >
        <div class="hero-scrim"></div>
        {#if platformList.length > 0}
          <PlatformMeta platforms={platformList} showLabels={true} />
        {/if}
        <div class="hero-content">
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
                {tp("world.publicInstancesOne", "world.publicInstancesOther", instanceCount)}
              </span>
            {/if}
          </div>
        </div>
      </button>

      <div class="dialog-body">
        {#if loading}
          <div class="loading-banner">
            <Icon icon="mdi:loading" width={16} class="spinning" />
            {t("world.refreshing")}
          </div>
        {/if}

        {#if error}
          <div class="message-row error-row">
            <Icon icon="mdi:alert-circle-outline" width={16} />
            <span>{error}</span>
          </div>
        {/if}

        {#if group}
          <section class="instance-section">
            <div class="detail-row">
              <div class="detail-label">{t("world.owner")}</div>
              <div class="detail-value">{group.ownerName ?? "—"}</div>
            </div>

            <div class="detail-row">
              <div class="detail-label">{t("world.users")}</div>
              <div class="detail-value">
                {displayInstance?.userCount ?? 0}/{displayInstance?.capacity}
              </div>
            </div>

            <div class="detail-row">
              <div class="detail-label">{t("world.type")}</div>
              <div class="detail-value">
                {visibilityLabel(group.parsed.visibility)}
              </div>
            </div>

            <div class="detail-row">
              <div class="detail-label">{t("world.region")}</div>
              <div class="detail-value">
                {regionLabel(group.parsed.region)}
              </div>
            </div>
          </section>
        {/if}
        {#if world.description}
          <section class="section">
            <h3>{t("world.about")}</h3>
            <p>{world.description}</p>
          </section>
        {/if}

        {#if world.tags && world.tags.length > 0}
          <section class="section">
            <h3>{t("world.tags")}</h3>
            <div class="tag-list">
              {#each world.tags as tag (tag)}
                {@const category = tagCategory(tag)}
                <span class="tag tag-{category}">{tag}</span>
              {/each}
            </div>
          </section>
        {/if}
      </div>
    {:else if loading}
      <div class="dialog-state">
        <Icon icon="mdi:loading" width={24} class="spinning" />
        <h2 class="dialog-title" id="world-dialog-title">{t("world.loading")}</h2>
      </div>
    {:else}
      <div class="dialog-state">
        <Icon icon="mdi:earth-off" width={24} />
        <h2 class="dialog-title" id="world-dialog-title">{t("world.unavailable")}</h2>
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
    display: flex;
    flex-direction: column;
  }

  .close-btn {
    position: absolute;
    top: 0.9rem;
    right: 0.9rem;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 999px;
    color: #fff;
    background: rgba(0, 0, 0, 0.28);
    z-index: 100;
    transition:
      background 0.15s,
      color 0.15s;
  }

  .close-btn:hover {
    background: rgba(0, 0, 0, 0.45);
  }

  /* Favorites */
  .fav-dropdown {
    position: absolute;
    top: 0.9rem;
    right: calc(0.9rem + 32px + 0.4rem);
    z-index: 10;
  }

  .fav-dropdown {
    display: flex;
    gap: 0.4rem;
    align-items: center;
  }

  .fav-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 999px;
    color: rgba(255, 255, 255, 0.8);
    background: rgba(0, 0, 0, 0.28);
    transition:
      background 0.15s,
      color 0.15s;
  }

  .fav-btn:hover {
    background: rgba(0, 0, 0, 0.45);
    color: #fff;
  }

  .fav-btn.fav-active {
    color: #ffd740;
  }

  .create-instance-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 999px;
    color: rgba(255, 255, 255, 0.8);
    background: rgba(0, 0, 0, 0.28);
    transition:
      background 0.15s,
      color 0.15s;
  }

  .create-instance-btn:hover {
    background: rgba(0, 0, 0, 0.45);
    color: #fff;
  }

  .create-instance-btn.active {
    color: #81c784;
  }

  .bookmark-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 999px;
    color: rgba(255, 255, 255, 0.8);
    background: rgba(0, 0, 0, 0.28);
    transition:
      background 0.15s,
      color 0.15s;
  }

  .bookmark-btn:hover {
    background: rgba(0, 0, 0, 0.45);
    color: #fff;
  }

  .bookmark-btn.saved {
    color: #ffd740;
  }

  .invite-instance-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 999px;
    color: rgba(255, 255, 255, 0.8);
    background: rgba(0, 0, 0, 0.28);
    transition:
      background 0.15s,
      color 0.15s;
  }

  .invite-instance-btn:hover {
    background: rgba(0, 0, 0, 0.45);
    color: #fff;
  }

  .invite-instance-btn--success {
    color: var(--accent);
  }

  .invite-instance-btn--error {
    color: #ff6b6b;
  }

  .invite-instance-btn.watch-active {
    color: var(--accent);
    animation: watch-pulse 1.6s ease-in-out infinite;
  }

  .invite-instance-btn.watch-success {
    color: var(--accent);
  }

  @keyframes watch-pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.4;
    }
  }

  .fav-panel {
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    background: var(--bg-card, #1e1e2e);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 0.6rem;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    min-width: 220px;
    max-width: 280px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
  }

  .create-panel {
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    background: var(--bg-card, #1e1e2e);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 0.65rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-width: 240px;
    max-width: 300px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
  }

  .create-field {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.78rem;
    color: var(--text-secondary);
  }

  .create-select {
    height: 32px;
    border-radius: 7px;
    border: 1px solid var(--border);
    background: rgba(255, 255, 255, 0.05);
    color: var(--text-primary);
    padding: 0 0.5rem;
    font-size: 0.82rem;
  }

  .create-select:focus {
    outline: none;
    border-color: var(--accent);
  }

  .create-checkbox {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    font-size: 0.8rem;
    color: var(--text-secondary);
  }

  .create-checkbox input {
    margin: 0;
  }

  .create-help {
    margin: 0;
    font-size: 0.76rem;
    color: var(--text-muted);
  }

  .create-help-error {
    color: #ef9a9a;
  }

  .create-submit-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.3rem;
    height: 32px;
    border-radius: 8px;
    border: none;
    background: var(--accent);
    color: #fff;
    font-size: 0.82rem;
    font-weight: 600;
    transition: background 0.15s;
  }

  .create-submit-btn:hover:not(:disabled) {
    background: var(--accent-hover);
  }

  .create-submit-btn:disabled {
    opacity: 0.5;
    cursor: default;
  }

  .fav-panel-title {
    margin: 0 0 0.15rem;
    padding: 0 0.4rem;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-muted);
  }

  .fav-empty {
    margin: 0;
    padding: 0.2rem 0.4rem;
    font-size: 0.8rem;
    color: var(--text-muted);
  }

  .fav-group-row {
    display: flex;
    align-items: center;
    gap: 0.3rem;
  }

  .fav-group-btn {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    flex: 1;
    padding: 0.4rem 0.6rem;
    border-radius: 7px;
    font-size: 0.83rem;
    color: var(--text-secondary);
    text-align: left;
    cursor: pointer;
    transition:
      background 0.12s,
      color 0.12s;
    overflow: hidden;
  }

  .fav-group-btn:hover {
    background: rgba(255, 255, 255, 0.06);
    color: var(--text-primary);
  }

  .fav-group-btn.active {
    color: #ffd740;
  }

  .fav-group-count {
    margin-left: auto;
    font-size: 0.75rem;
    color: var(--text-muted);
    flex-shrink: 0;
  }

  .fav-delete-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border-radius: 6px;
    color: var(--text-muted);
    flex-shrink: 0;
    transition:
      background 0.12s,
      color 0.12s;
  }

  .fav-delete-btn:hover {
    background: rgba(239, 83, 80, 0.15);
    color: #ef5350;
  }

  .fav-new-row {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    margin-top: 0.15rem;
    padding-top: 0.4rem;
    border-top: 1px solid var(--border);
  }

  .fav-new-input {
    flex: 1;
    height: 30px;
    padding: 0 0.6rem;
    border-radius: 7px;
    font-size: 0.82rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--border);
    color: var(--text-primary);
    transition: border-color 0.15s;
  }

  .fav-new-input:focus {
    outline: none;
    border-color: var(--accent);
  }

  .fav-new-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border-radius: 7px;
    background: var(--accent);
    color: #fff;
    flex-shrink: 0;
    transition: background 0.15s;
  }

  .fav-new-btn:hover:not(:disabled) {
    background: var(--accent-hover);
  }

  .fav-new-btn:disabled {
    opacity: 0.45;
    cursor: default;
  }

  .hero {
    position: relative;
    min-height: 250px;
    display: flex;
    align-items: flex-end;
    width: 100%;
    padding: 0;
    background-color: var(--bg-card);
    background-position: center;
    background-size: cover;
    text-align: left;
    transition: transform 0.15s ease;
  }

  .hero:hover {
    transform: translateY(-1px);
  }

  .hero:focus-visible {
    outline: 2px solid rgba(76, 175, 80, 0.75);
    outline-offset: -2px;
  }

  .hero-scrim {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      180deg,
      rgba(6, 10, 20, 0.18),
      rgba(6, 10, 20, 0.9)
    );
  }

  .hero-content {
    position: relative;
    width: 100%;
    padding: 1.5rem;
    color: #fff;
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

  .copy-id-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 999px;
    color: rgba(255, 255, 255, 0.8);
    background: rgba(0, 0, 0, 0.28);
    border: none;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }

  .copy-id-btn:hover {
    background: rgba(0, 0, 0, 0.45);
    color: #fff;
  }

  .dialog-body {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1.25rem;
    overflow-y: auto;
    flex: 1;
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

  .instance-section {
    display: flex;
    gap: 1rem;
    font-size: 0.8rem;
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

  .detail-row {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
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

  .tag-content {
    color: #ffb74d;
    background: rgba(255, 152, 0, 0.12);
    border: 1px solid rgba(255, 152, 0, 0.35);
  }

  .tag-system {
    color: #ce93d8;
    background: rgba(156, 39, 176, 0.12);
    border: 1px solid rgba(156, 39, 176, 0.35);
  }

  .tag-language {
    color: #4dd0e1;
    background: rgba(0, 188, 212, 0.12);
    border: 1px solid rgba(0, 188, 212, 0.35);
  }

  .tag-platform {
    color: #81c784;
    background: rgba(76, 175, 80, 0.12);
    border: 1px solid rgba(76, 175, 80, 0.35);
  }

  .tag-feature {
    color: #90caf9;
    background: rgba(33, 150, 243, 0.12);
    border: 1px solid rgba(33, 150, 243, 0.35);
  }

  .tag-admin {
    color: #f48fb1;
    background: rgba(233, 30, 99, 0.12);
    border: 1px solid rgba(233, 30, 99, 0.35);
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
      place-items: center;
    }

    .world-dialog {
      width: 100%;
      height: 100%;
      max-height: calc(100dvh - 1.5rem);
    }

    .hero {
      min-height: 220px;
    }

    .dialog-body {
      padding: 1rem;
    }
  }
</style>
