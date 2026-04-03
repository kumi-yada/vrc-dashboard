<script lang="ts">
  import Icon from "@iconify/svelte";

  interface Props {
    activeTab: string;
    onTabChange: (tab: string) => void;
  }

  let { activeTab, onTabChange }: Props = $props();

  const tabs = [
    { id: "friends", label: "Friends", icon: "mdi:account-group" },
    { id: "worlds", label: "Worlds", icon: "mdi:earth" },
    { id: "photos", label: "Photos", icon: "mdi:image-multiple" },
  ];
</script>

<nav class="topbar">
  <div class="tabs">
    {#each tabs as tab}
      <button
        class="tab"
        class:active={activeTab === tab.id}
        onclick={() => onTabChange(tab.id)}
      >
        <Icon icon={tab.icon} width={18} />
        {tab.label}
      </button>
    {/each}
  </div>
  <div class="actions">
    <button class="icon-btn" title="Notifications">
      <Icon icon="mdi:bell-outline" width={22} />
    </button>
    <button class="icon-btn" title="Profile">
      <Icon icon="mdi:account" width={22} />
    </button>
  </div>
</nav>

<style>
  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--topbar-bg);
    padding: 0 1rem;
    height: 48px;
    flex-shrink: 0;
    border-bottom: 1px solid var(--border);
  }

  .tabs {
    display: flex;
    gap: 0.25rem;
  }

  .tab {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-size: 0.9rem;
    color: var(--text-secondary);
    transition: all 0.15s;
  }

  .tab:hover {
    color: var(--text-primary);
    background: rgba(255, 255, 255, 0.05);
  }

  .tab.active {
    color: var(--text-primary);
    background: rgba(76, 175, 80, 0.15);
  }

  .actions {
    display: flex;
    gap: 0.25rem;
  }

  .icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    color: var(--text-secondary);
    transition: all 0.15s;
  }

  .icon-btn:hover {
    color: var(--text-primary);
    background: rgba(255, 255, 255, 0.05);
  }
</style>
