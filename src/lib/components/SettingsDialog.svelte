<script lang="ts">
  import { loadRetention, saveRetention, volatile, type Retention } from '../storage/docScope';
  import { t } from '../i18n/i18n.svelte';

  // App-wide settings that belong to no ribbon tab, one section each.
  let { open = $bindable(false) }: { open?: boolean } = $props();

  let dialogEl = $state<HTMLDialogElement | null>(null);
  let retention = $state<Retention>(loadRetention());
  const LEVELS: Retention[] = ['keep', 'closed', 'none'];

  $effect(() => {
    const el = dialogEl;
    if (!el) return;
    if (open && !el.open) { retention = loadRetention(); el.showModal(); }
    else if (!open && el.open) el.close();
  });
</script>

<dialog
  bind:this={dialogEl}
  onclose={() => (open = false)}
  onclick={(e) => e.target === dialogEl && (open = false)}
  aria-label={t().settings.title}
>
  <div class="body">
    <h2>{t().settings.title}</h2>

    <fieldset>
      <legend>{t().settings.documents}</legend>
      {#each LEVELS as level (level)}
        <label>
          <input type="radio" name="retention" checked={retention === level} onchange={() => saveRetention((retention = level))} />
          <span>{t().settings.retention[level]}{#if level === 'none'}<em>{t().settings.noneHint}</em>{/if}</span>
        </label>
      {/each}
      <em>{t().settings.protectedHint}</em>
      {#if (retention === 'none') !== volatile}<strong>{t().settings.restartNeeded}</strong>{/if}
    </fieldset>

    <div class="actions">
      <button onclick={() => (open = false)}>{t().common.close}</button>
    </div>
  </div>
</dialog>

<style>
  dialog {
    /* The global reset zeroes every margin, which also takes the auto centring a
       modal <dialog> gets by default. */
    margin: auto;
    border: 1px solid var(--w-border-strong);
    border-radius: 8px;
    padding: 0;
    background: var(--color-surface);
    color: var(--color-text);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }

  dialog::backdrop { background: rgba(0, 0, 0, 0.35); }

  .body {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: min(520px, calc(100vw - 32px));
    max-height: 80vh;
    overflow-y: auto;
    padding: 18px 20px 16px;
    font-family: var(--font-sans);
    font-size: 0.85rem;
  }

  h2 { font-size: 1rem; }
  fieldset { border: 0; display: flex; flex-direction: column; gap: 4px; }
  legend { font-weight: 600; margin-bottom: 4px; }
  label { display: flex; align-items: baseline; gap: 8px; }
  em { display: block; font-style: normal; color: var(--color-text-muted); font-size: 0.78rem; }
  strong { font-weight: 600; font-size: 0.78rem; }

  .actions { display: flex; justify-content: flex-end; padding-top: 4px; }

  button {
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    background: var(--color-surface);
    color: var(--color-text);
    padding: 4px 12px;
    font: inherit;
    cursor: pointer;
  }
  button:hover { background: var(--color-btn-hover); }
</style>
