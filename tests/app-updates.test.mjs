import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = readFileSync(resolve(root, 'shared/app-updates.js'), 'utf8');

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
  };
}

function updateHarness({ currentReleaseId, local = {}, fetchManifest }) {
  const windowListeners = new Map();
  const documentListeners = new Map();
  const localStorage = memoryStorage(local);
  let fetchCount = 0;
  const context = vm.createContext({
    URL,
    CustomEvent: class CustomEvent {
      constructor(type, init = {}) { this.type = type; this.detail = init.detail; }
    },
    console: { warn() {} },
    document: {
      baseURI: 'https://example.test/trainer/vocabulary.html',
      readyState: 'loading',
      addEventListener(type, listener) { documentListeners.set(type, listener); },
    },
    fetch: async () => {
      fetchCount += 1;
      return { ok: true, json: async () => fetchManifest(fetchCount) };
    },
    history: { state: null, replaceState() {} },
    kanaAppRelease: {
      currentReleaseId,
      pageScope: 'vocabulary',
      manifestUrl: './content/releases.json',
    },
    localStorage,
    location: {
      href: 'https://example.test/trainer/vocabulary.html',
      replace() {},
    },
    sessionStorage: memoryStorage(),
    addEventListener(type, listener) { windowListeners.set(type, listener); },
  });
  vm.runInContext(source, context);

  return {
    dispatchRelease(releaseId) {
      windowListeners.get('kana-sprint-release-observed')?.({ detail: { releaseId } });
    },
    fireDOMContentLoaded() { documentListeners.get('DOMContentLoaded')?.(); },
    get fetchCount() { return fetchCount; },
    localStorage,
  };
}

async function settleAsyncWork() {
  await new Promise((resolve) => setImmediate(resolve));
  await new Promise((resolve) => setImmediate(resolve));
}

test('release history order advances from sequence 9 to sequence 10', async () => {
  const harness = updateHarness({
    currentReleaseId: '2026-09-08.10',
    local: { kanaSprintLastLoadedReleaseV1: '2026-09-08.9' },
    fetchManifest: () => ({
      releases: [
        { id: '2026-09-08.9', changes: [] },
        { id: '2026-09-08.10', changes: [{ pages: ['all'], text: 'Fix' }] },
      ],
    }),
  });

  harness.fireDOMContentLoaded();
  await settleAsyncWork();

  assert.equal(
    harness.localStorage.getItem('kanaSprintLastLoadedReleaseV1'),
    '2026-09-08.10',
  );
});

test('a stale manifest does not suppress a later retry for the same release', async () => {
  const harness = updateHarness({
    currentReleaseId: '2026-09-08.1',
    fetchManifest: (requestNumber) => ({
      releases: requestNumber === 1
        ? [{ id: '2026-09-08.1', changes: [] }]
        : [
            { id: '2026-09-08.1', changes: [] },
            { id: '2026-09-08.2', changes: [] },
          ],
    }),
  });

  harness.dispatchRelease('2026-09-08.2');
  await settleAsyncWork();
  harness.dispatchRelease('2026-09-08.2');
  await settleAsyncWork();

  assert.equal(harness.fetchCount, 2);
});
