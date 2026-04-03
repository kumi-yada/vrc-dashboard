<script lang="ts">
  import { login, getAuth } from "../stores/auth.svelte";

  const auth = getAuth();
  let tokenInput = $state("");

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (!tokenInput.trim()) return;
    await login(tokenInput.trim());
  }
</script>

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
