<script lang="ts">
  import Icon from "@iconify/svelte";
  import { getCurrentWindow } from "@tauri-apps/api/window";
  import { login, getAuth } from "../stores/auth.svelte";
  import { showDesktopWindowControls } from "../utils/platform";

  const auth = getAuth();
  const appWindow = getCurrentWindow();

  let tokenInput = $state("");

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (!tokenInput.trim()) return;
    await login(tokenInput.trim());
  }

  async function minimizeWindow() {
    if (!showDesktopWindowControls) return;
    await appWindow.minimize();
  }

  async function toggleMaximizeWindow() {
    if (!showDesktopWindowControls) return;
    await appWindow.toggleMaximize();
  }

  async function closeWindow() {
    if (!showDesktopWindowControls) return;
    await appWindow.close();
  }
</script>

<nav class="topbar small">
  <div class="window-drag-region" data-tauri-drag-region></div>
  {#if showDesktopWindowControls}
    <div class="window-controls">
      <button class="window-btn" title="Minimize" onclick={minimizeWindow}>
        <Icon icon="mdi:window-minimize" width={16} />
      </button>
      <button class="window-btn" title="Maximize" onclick={toggleMaximizeWindow}>
        <Icon icon="mdi:window-maximize" width={14} />
      </button>
      <button class="window-btn window-btn-close" title="Close" onclick={closeWindow}>
        <Icon icon="mdi:close" width={16} />
      </button>
    </div>
  {/if}
</nav>

<div class="login-container">
  <div class="login-card">
    <h1>VRC Dashboard</h1>
    <p class="subtitle">Enter your VRChat auth token to get started</p>

    <form onsubmit={handleSubmit}>
      <input
        type="password"
        bind:value={tokenInput}
        placeholder="authcookie_xxxxxx"
        class="token-input"
        disabled={auth.loading}
      />
      <button
        type="submit"
        class="login-btn"
        disabled={auth.loading || !tokenInput.trim()}
      >
        {auth.loading ? "Authenticating..." : "Login"}
      </button>
    </form>

    {#if auth.error}
      <p class="error">{auth.error}</p>
    {/if}

    <div class="instructions">
      <h3>How to get your auth token:</h3>
      <ol>
        <li>
          Go to <strong>vrchat.com</strong> and log in - <a
            href="https://vrchat.com"
            target="_blank">Link</a
          >
        </li>
        <li>
          Go to <strong>vrchat.com/api/1/auth</strong> - <a
            href="https://vrchat.com/api/1/auth"
            target="_blank">Link</a
          >
        </li>
        <li>Find the <code>auth</code> cookie and copy its value</li>
      </ol>
    </div>
  </div>
</div>

<style>
  .topbar {
    display: flex;
    align-items: center;
    height: 36px;
    padding: 0 0.5rem;
    gap: 0.75rem;
    background: var(--topbar-bg);
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }

  .topbar.small {
    height: 36px;
  }

  .window-drag-region {
    flex: 1;
    min-width: 4rem;
    height: 100%;
  }

  .window-controls {
    display: flex;
    gap: 0.25rem;
    margin-left: 0.25rem;
  }

  .window-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    color: var(--text-secondary);
    transition: all 0.15s;
    background: transparent;
    border: none;
  }

  .window-btn:hover {
    color: var(--text-primary);
    background: rgba(255, 255, 255, 0.03);
  }

  .window-btn-close:hover {
    color: #fff;
    background: rgba(239, 83, 80, 0.85);
  }

  .login-container {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 2rem;
  }

  .login-card {
    background: var(--bg-secondary);
    border-radius: 12px;
    padding: 2.5rem;
    max-width: 480px;
    width: 100%;
    box-shadow: 0 8px 32px var(--shadow);
  }

  h1 {
    font-size: 1.8rem;
    margin-bottom: 0.5rem;
    color: var(--accent);
  }

  .subtitle {
    color: var(--text-secondary);
    margin-bottom: 1.5rem;
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .token-input {
    background: var(--bg-input);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 0.75rem 1rem;
    font-size: 0.95rem;
    color: var(--text-primary);
    transition: border-color 0.2s;
  }

  .token-input:focus {
    border-color: var(--accent);
  }

  .login-btn {
    background: var(--accent);
    color: #fff;
    border-radius: 8px;
    padding: 0.75rem;
    font-size: 1rem;
    font-weight: 600;
    transition: background 0.2s;
  }

  .login-btn:hover:not(:disabled) {
    background: var(--accent-hover);
  }

  .login-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .error {
    color: #ef5350;
    margin-top: 0.75rem;
    font-size: 0.9rem;
  }

  .instructions {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--border);
  }

  .instructions h3 {
    font-size: 0.95rem;
    color: var(--text-secondary);
    margin-bottom: 0.75rem;
  }

  .instructions ol {
    padding-left: 1.25rem;
    color: var(--text-muted);
    font-size: 0.85rem;
    line-height: 1.8;
  }

  .instructions code {
    background: var(--bg-input);
    padding: 0.15rem 0.4rem;
    border-radius: 4px;
    font-size: 0.85rem;
  }
</style>
