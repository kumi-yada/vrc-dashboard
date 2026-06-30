<script lang="ts">
  import Icon from "@iconify/svelte";
  import type { AvatarData, AvatarUnityPackage, FileVersionAnalysis } from "../types";
  import { fetchFileAnalysis } from "../stores/auth.svelte";

  interface Props {
    avatar: AvatarData | null;
    onClose: () => void;
  }

  let { avatar, onClose }: Props = $props();

  const PERF_COLORS: Record<string, string> = {
    Excellent: "#4caf50",
    Good: "#8bc34a",
    Medium: "#ffc107",
    Poor: "#ff9800",
    VeryPoor: "#f44336",
  };

  const STAT_THRESHOLDS: Record<string, [number, number, number, number]> = {
    totalPolygons: [32_000, 70_000, 70_000, 70_000],
    totalTextureUsage: [41_943_040, 78_643_200, 115_343_360, 157_286_400],
    skinnedMeshCount: [1, 8, 16, 32],
    materialSlotsUsed: [4, 16, 32, 64],
    physBoneTransformCount: [16, 32, 64, 128],
  };

  const STAT_LABELS: Record<string, string> = {
    animatorCount: "Animator Count",
    audioSourceCount: "Audio Source Count",
    blendShapeCount: "Blend Shape Count",
    boneCount: "Bone Count",
    cameraCount: "Camera Count",
    clothCount: "Cloth Count",
    constraintCount: "Constraint Count",
    constraintDepth: "Constraint Depth",
    contactCount: "Contact Count",
    customExpressions: "Custom Expressions",
    customizeAnimationLayers: "Customize Anim Layers",
    enableEyeLook: "Eye Look Enabled",
    lightCount: "Light Count",
    lineRendererCount: "Line Renderer Count",
    lipSync: "Lip Sync",
    materialCount: "Material Count",
    materialSlotsUsed: "Material Slots Used",
    meshCount: "Mesh Count",
    meshIndices: "Mesh Indices",
    meshParticleMaxPolygons: "Mesh Particle Max Polygons",
    meshPolygons: "Mesh Polygons",
    meshVertices: "Mesh Vertices",
    particleCollisionEnabled: "Particle Collision Enabled",
    particleSystemCount: "Particle System Count",
    particleTrailsEnabled: "Particle Trails Enabled",
    physBoneColliderCount: "PhysBone Collider Count",
    physBoneCollisionCheckCount: "PhysBone Collision Checks",
    physBoneComponentCount: "PhysBone Component Count",
    physBoneTransformCount: "PhysBone Transform Count",
    physicsColliders: "Physics Colliders",
    physicsRigidbodies: "Physics Rigidbodies",
    skinnedMeshCount: "Skinned Mesh Count",
    skinnedMeshIndices: "Skinned Mesh Indices",
    skinnedMeshPolygons: "Skinned Mesh Polygons",
    skinnedMeshVertices: "Skinned Mesh Vertices",
    totalClothVertices: "Total Cloth Vertices",
    totalIndices: "Total Indices",
    totalMaxParticles: "Total Max Particles",
    totalPolygons: "Total Polygons",
    totalTextureUsage: "Total Texture Usage",
    totalVertices: "Total Vertices",
    trailRendererCount: "Trail Renderer Count",
    writeDefaultsUsed: "Write Defaults Used",
  };

  const STAT_ORDER = Object.keys(STAT_LABELS);

  const PLATFORM_LABELS: Record<string, string> = {
    standalonewindows: "Windows",
    android: "Android",
  };

  const PLATFORM_ICONS: Record<string, string> = {
    standalonewindows: "mdi:microsoft-windows",
    android: "mdi:android",
  };

  const platforms = $derived(
    [...new Set((avatar?.unityPackages ?? []).map((p) => p.platform))].filter(
      (p) => p === "standalonewindows" || p === "android",
    ),
  );

  // selectedPlatformOverride is the user's explicit tab choice; null means auto
  let selectedPlatformOverride = $state<string | null>(null);

  const selectedPlatform = $derived(
    selectedPlatformOverride !== null && platforms.includes(selectedPlatformOverride)
      ? selectedPlatformOverride
      : (platforms[0] ?? ""),
  );

  let analysisCache = $state<Record<string, FileVersionAnalysis | null>>({});
  let loadingPlatforms = $state<Record<string, boolean>>({});
  let errorPlatforms = $state<Record<string, string | null>>({});

  $effect(() => {
    if (!selectedPlatform || !avatar) return;
    if (analysisCache[selectedPlatform] !== undefined) return;
    void loadAnalysis(selectedPlatform);
  });

  function getPackageForPlatform(platform: string): AvatarUnityPackage | undefined {
    return avatar?.unityPackages?.find((p) => p.platform === platform);
  }

  function extractFileInfo(assetUrl: string): { fileId: string; version: number } | null {
    const parts = assetUrl.split("/");
    const fileIdx = parts.findIndex((p) => p.startsWith("file_"));
    if (fileIdx === -1 || fileIdx + 1 >= parts.length) return null;
    const version = parseInt(parts[fileIdx + 1], 10);
    if (Number.isNaN(version)) return null;
    return { fileId: parts[fileIdx], version };
  }

  async function loadAnalysis(platform: string) {
    const pkg = getPackageForPlatform(platform);
    if (!pkg?.assetUrl) {
      analysisCache = { ...analysisCache, [platform]: null };
      errorPlatforms = { ...errorPlatforms, [platform]: "No asset URL for this platform" };
      return;
    }

    const info = extractFileInfo(pkg.assetUrl);
    if (!info) {
      analysisCache = { ...analysisCache, [platform]: null };
      errorPlatforms = { ...errorPlatforms, [platform]: "Could not parse file URL" };
      return;
    }

    loadingPlatforms = { ...loadingPlatforms, [platform]: true };
    errorPlatforms = { ...errorPlatforms, [platform]: null };

    try {
      const result = await fetchFileAnalysis(info.fileId, info.version);
      analysisCache = { ...analysisCache, [platform]: result };
    } catch (e) {
      errorPlatforms = {
        ...errorPlatforms,
        [platform]: e instanceof Error ? e.message : String(e),
      };
      analysisCache = { ...analysisCache, [platform]: null };
    } finally {
      loadingPlatforms = { ...loadingPlatforms, [platform]: false };
    }
  }

  function retryPlatform(platform: string) {
    const next = { ...analysisCache };
    delete next[platform];
    analysisCache = next;
    void loadAnalysis(platform);
  }

  const analysis = $derived(selectedPlatform ? (analysisCache[selectedPlatform] ?? null) : null);
  const loading = $derived(selectedPlatform ? (loadingPlatforms[selectedPlatform] ?? false) : false);
  const error = $derived(selectedPlatform ? (errorPlatforms[selectedPlatform] ?? null) : null);

  function bytesToMB(bytes: number): string {
    return (bytes / 1_048_576).toFixed(2) + " MB";
  }

  function formatStatValue(key: string, value: unknown): string {
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (key === "totalTextureUsage" && typeof value === "number") return bytesToMB(value);
    if (typeof value === "number") return value.toLocaleString();
    if (Array.isArray(value)) return `[${value.length}]`;
    return String(value);
  }

  function getStatColor(key: string, value: unknown): string | null {
    if (typeof value !== "number") return null;
    const thresholds = STAT_THRESHOLDS[key];
    if (!thresholds) return null;
    const [excellent, good, medium, poor] = thresholds;
    if (value <= excellent) return "#4caf50";
    if (value <= good) return "#8bc34a";
    if (value <= medium) return "#ffc107";
    if (value <= poor) return "#ff9800";
    return "#f44336";
  }

  function getTooltipLines(key: string): string[] | null {
    const thresholds = STAT_THRESHOLDS[key];
    if (!thresholds) return null;
    const [excellent, good, medium, poor] = thresholds;
    const fmt = (v: number) =>
      key === "totalTextureUsage" ? bytesToMB(v) : v.toLocaleString();
    return [
      `Excellent: ≤ ${fmt(excellent)}`,
      `Good:      ≤ ${fmt(good)}`,
      `Medium:    ≤ ${fmt(medium)}`,
      `Poor:      ≤ ${fmt(poor)}`,
    ];
  }

  const imageUrl = $derived(avatar?.thumbnailImageUrl ?? avatar?.imageUrl ?? "");

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
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="dialog-backdrop" onclick={onClose} aria-hidden="true"></div>

<div
  class="dialog-shell"
  role="dialog"
  aria-modal="true"
  aria-label={avatar?.name ?? "Avatar Details"}
>
  <div class="dialog">
    <div class="dialog-header">
      <div class="header-info">
        <div class="header-thumbnail">
          {#if imageUrl}
            <img src={imageUrl} alt={avatar?.name} />
          {:else}
            <div class="thumb-placeholder">
              <Icon icon="mdi:human" width={24} />
            </div>
          {/if}
        </div>
        <div class="header-text">
          <h2 class="dialog-title">{avatar?.name ?? ""}</h2>
          <div class="header-badges">
            {#if avatar?.performanceRating}
              <span
                class="perf-badge"
                style="color: {PERF_COLORS[avatar.performanceRating] ?? 'var(--text-muted)'}; border-color: {PERF_COLORS[avatar.performanceRating] ?? 'var(--text-muted)'};"
              >
                {avatar.performanceRating}
              </span>
            {/if}
            {#if avatar?.releaseStatus}
              <span class="release-badge" class:public={avatar.releaseStatus === "public"}>
                {avatar.releaseStatus}
              </span>
            {/if}
          </div>
        </div>
      </div>
      <button class="close-btn" type="button" onclick={onClose} aria-label="Close">
        <Icon icon="mdi:close" width={20} />
      </button>
    </div>

    {#if platforms.length > 1}
      <div class="platform-tabs">
        {#each platforms as platform (platform)}
          <button
            class="platform-tab"
            class:active={selectedPlatform === platform}
            type="button"
            onclick={() => (selectedPlatformOverride = platform)}
          >
            <Icon icon={PLATFORM_ICONS[platform] ?? "mdi:help-circle"} width={14} />
            {PLATFORM_LABELS[platform] ?? platform}
          </button>
        {/each}
      </div>
    {/if}

    <div class="dialog-body">
      {#if loading}
        <div class="state-view">
          <Icon icon="mdi:loading" width={28} class="spinning" />
          <p>Loading analysis…</p>
        </div>
      {:else if error}
        <div class="state-view error-view">
          <Icon icon="mdi:alert-circle-outline" width={28} />
          <p>{error}</p>
          <button
            class="retry-btn"
            type="button"
            onclick={() => retryPlatform(selectedPlatform)}
          >
            Retry
          </button>
        </div>
      {:else if !analysis}
        <div class="state-view">
          <Icon icon="mdi:chart-bar" width={28} />
          <p>No analysis data available</p>
        </div>
      {:else}
        <div class="file-info">
          <div class="file-info-row">
            <span class="file-label">File Size</span>
            <span class="file-value">{bytesToMB(analysis.fileSize)}</span>
          </div>
          <div class="file-info-row">
            <span class="file-label">Uncompressed</span>
            <span class="file-value">{bytesToMB(analysis.uncompressedSize)}</span>
          </div>
          {#if analysis.created_at}
            <div class="file-info-row">
              <span class="file-label">Uploaded</span>
              <span class="file-value">{formatDate(analysis.created_at)}</span>
            </div>
          {/if}
          {#if analysis.performanceRating}
            <div class="file-info-row">
              <span class="file-label">Performance</span>
              <span
                class="file-value"
                style="color: {PERF_COLORS[analysis.performanceRating] ?? 'inherit'};"
              >
                {analysis.performanceRating}
              </span>
            </div>
          {/if}
        </div>

        {#if analysis.avatarStats}
          {@const stats = analysis.avatarStats}
          <div class="stats-grid">
            {#each STAT_ORDER as key (key)}
              {#if key in stats}
                {@const rawValue = (stats as Record<string, unknown>)[key]}
                {@const color = getStatColor(key, rawValue)}
                {@const tooltip = getTooltipLines(key)}
                <div class="stat-row" class:has-tooltip={tooltip !== null}>
                  <span class="stat-label">{STAT_LABELS[key] ?? key}</span>
                  <span class="stat-value" style={color ? `color: ${color};` : ""}>
                    {formatStatValue(key, rawValue)}
                  </span>
                  {#if tooltip}
                    <div class="stat-tooltip">
                      {#each tooltip as line (line)}
                        <div class="tooltip-line">{line}</div>
                      {/each}
                    </div>
                  {/if}
                </div>
              {/if}
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

  .perf-badge {
    display: inline-block;
    font-size: 0.7rem;
    font-weight: 600;
    padding: 0.1rem 0.45rem;
    border-radius: 999px;
    border: 1px solid;
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

  .platform-tabs {
    display: flex;
    gap: 0.25rem;
    padding: 0.5rem 1rem 0;
    flex-shrink: 0;
  }

  .platform-tab {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.3rem 0.7rem;
    border-radius: 6px;
    font-size: 0.82rem;
    color: var(--text-secondary);
    border: 1px solid transparent;
    transition: all 0.15s;
    cursor: pointer;
  }

  .platform-tab:hover {
    color: var(--text-primary);
    background: rgba(255, 255, 255, 0.05);
  }

  .platform-tab.active {
    color: var(--text-primary);
    border-color: var(--border);
    background: rgba(255, 255, 255, 0.06);
  }

  .dialog-body {
    flex: 1;
    overflow-y: auto;
    padding: 0.75rem 1rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .state-view {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    min-height: 120px;
    color: var(--text-muted);
  }

  .state-view p {
    margin: 0;
    font-size: 0.88rem;
  }

  .error-view {
    color: #ef9a9a;
  }

  .retry-btn {
    background: var(--accent);
    color: #fff;
    padding: 0.4rem 1rem;
    border-radius: 6px;
    font-size: 0.85rem;
    cursor: pointer;
    transition: background 0.15s;
  }

  .retry-btn:hover {
    background: var(--accent-hover);
  }

  .file-info {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 0.6rem 0.75rem;
  }

  .file-info-row {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    min-width: 100px;
  }

  .file-label {
    font-size: 0.7rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .file-value {
    font-size: 0.85rem;
    color: var(--text-primary);
    font-weight: 500;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0;
    border: 1px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
  }

  .stat-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.35rem 0.6rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    gap: 0.5rem;
    position: relative;
  }

  .stat-row:nth-child(odd) {
    background: rgba(255, 255, 255, 0.02);
  }

  .stat-row.has-tooltip:hover .stat-tooltip {
    display: flex;
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

  .stat-tooltip {
    display: none;
    flex-direction: column;
    gap: 0.15rem;
    position: absolute;
    bottom: calc(100% + 4px);
    right: 0;
    z-index: 10;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 0.4rem 0.6rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    pointer-events: none;
    min-width: 160px;
  }

  .tooltip-line {
    font-size: 0.72rem;
    color: var(--text-secondary);
    white-space: pre;
    font-family: monospace;
  }

  :global(.spinning) {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
</style>
