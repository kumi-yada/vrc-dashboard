<script lang="ts">
  interface Props {
    status: string;
    size?: number;
    borderWidth?: number;
    borderColor?: string;
    bottom?: string;
    right?: string;
  }

  let {
    status,
    size = 8,
    borderWidth = 1.5,
    borderColor = "var(--bg-card)",
    bottom = "0px",
    right = "0px",
  }: Props = $props();

  function getStatusColor(state: string): string {
    const colors: Record<string, string> = {
      offline: "#9E9E9E",
      active: "#4CAF50",
      "join me": "#2196F3",
      "ask me": "#FF9800",
      busy: "#F44336",
    };

    return colors[state?.toLowerCase()] || "#9E9E9E";
  }

  let color = $derived(getStatusColor(status));
</script>

<span
  class="status-dot"
  style:background-color={color}
  style:width={`${size}px`}
  style:height={`${size}px`}
  style:border-width={`${borderWidth}px`}
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