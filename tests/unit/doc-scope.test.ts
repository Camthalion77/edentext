import { describe, it, expect, vi } from 'vitest';
import { pickSlot } from '../../src/lib/storage/docScope';

const NOW = 1_700_000_000_000;
const MIN = 60_000;

describe('pickSlot', () => {
  it('gives the first tab of any browser the unsuffixed slot', () => {
    expect(pickSlot({}, NOW)).toBe('');
  });

  it('mints a new document while every one is held', () => {
    const id = pickSlot({ '': NOW - 1000 }, NOW);
    // Minted in the same millisecond, the next one still steers clear of it.
    expect(id).not.toBe('');
    for (let i = 0; i < 2e4; i++) expect(pickSlot({ '': NOW - 1000, [id]: NOW }, NOW)).not.toBe(id);
  });

  it('takes up the most recent document no tab holds', () => {
    // Negative = a tab signed off; the stamp still says how recently it was used.
    expect(pickSlot({ '': -(NOW - 9 * MIN), d2: -(NOW - 2 * MIN) }, NOW)).toBe('d2');
  });

  it('counts a marker nobody has refreshed in ten minutes as abandoned', () => {
    expect(pickSlot({ '': NOW - 11 * MIN, d2: NOW - 1 * MIN }, NOW)).toBe('');
  });
});

describe('deleteDocument', () => {
  it('drops the first document by its registered names and another by its suffix', async () => {
    localStorage.clear();
    sessionStorage.setItem('edentext-tab-doc', 'd9');
    vi.resetModules();
    const scope = await import('../../src/lib/storage/docScope');
    scope.docKey('edentext-doc');
    const released = String(-(Date.now() - MIN));
    localStorage.setItem('edentext-live@', released);
    localStorage.setItem('edentext-doc', '{"content":[{"text":"Erstes"}]}');
    localStorage.setItem('edentext-live@d1', released);
    localStorage.setItem('edentext-doc@d1', '{"content":[{"text":"Hallo"}]}');
    localStorage.setItem('edentext-theme', 'dark');

    expect(scope.listDocuments().map((d) => [d.id, d.mine, d.label])).toEqual([
      ['d9', true, ''], ['', false, 'Erstes'], ['d1', false, 'Hallo'],
    ]);
    scope.deleteDocument('');
    scope.deleteDocument('d1');
    scope.deleteDocument('d9'); // the open one stays
    const keys = Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i));
    expect(keys.sort()).toEqual(['edentext-live@d9', 'edentext-theme']);
  });
});
