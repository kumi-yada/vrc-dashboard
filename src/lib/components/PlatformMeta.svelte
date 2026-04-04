<script lang="ts">
  import Icon from "@iconify/svelte";
  import { PLATFORM_META, type SupportedPlatform } from "../types";

  export let platforms: SupportedPlatform[] = [];
  export let showLabels: boolean = false;
</script>

<div class="platform-list">
  {#each platforms as platform (platform)}
    {#if showLabels}
      <span class="platform-pill">
        <Icon icon={PLATFORM_META[platform].icon} width={14} />
        {PLATFORM_META[platform].label}
      </span>
    {:else}
      <Icon icon={PLATFORM_META[platform].icon} width={14} />
    {/if}
  {/each}
</div>

<style>
  .platform-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    min-height: 28px;
    padding: 0 0.65rem;
    font-size: 0.78rem;
  }

  .platform-list {
    position: absolute;
    top: 0.4rem;
    right: 0.4rem;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.2rem 0.35rem;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.72);
    color: #fff;
    backdrop-filter: blur(6px);
  }

</style>
