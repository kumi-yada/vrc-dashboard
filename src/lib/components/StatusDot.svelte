<script lang="ts">
  interface Props {
    status: string;
    active?: boolean;
    size?: number;
    borderWidth?: number;
    borderColor?: string;
    bottom?: string;
    right?: string;
  }

  let {
    status,
    active = false,
    size = 12,
    borderWidth = 1.5,
    borderColor = "var(--bg-card)",
    bottom = "0px",
    right = "0px",
  }: Props = $props();

  function getStatusColor(status: string, active?: boolean): string {
    if (active) {
      return "transparent";
    }

    const colors: Record<string, string> = {
      offline: "#9E9E9E",
      active: "#4CAF50",
      "join me": "#2196F3",
      "ask me": "#FF9800",
      busy: "#F44336",
    };

    return colors[status?.toLowerCase()] || "#9E9E9E";
  }

  let color = $derived(getStatusColor(status, active));
</script>

<span
  class="status-dot"
  style:background-color={color}
  style:width={`calc(${size}px * var(--ui-scale, 1))`}
  style:height={`calc(${size}px * var(--ui-scale, 1))`}
  style:border-width={`calc(${borderWidth}px * var(--ui-scale, 1))`}
  style:border-color={borderColor}
  style:bottom={bottom}
  style:right={right}
></span>

<style>
  .status-dot {
    position: absolute;
    border-radius: 50%;
    border-style: solid;
    box-sizing: border-box;
  }
</style>