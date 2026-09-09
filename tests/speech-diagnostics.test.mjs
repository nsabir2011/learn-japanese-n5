import assert from 'node:assert/strict';
import test from 'node:test';

await import('../shared/speech-diagnostics.js');
const Diagnostics = globalThis.KANA_SPRINT_SPEECH_DIAGNOSTICS;

function memoryStorage() {
  const values = new Map();
  return {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
  };
}

test('diagnostics save only correct resolution chains with useful retry evidence', () => {
  const storage = memoryStorage();
  const firstTry = Diagnostics.begin({ activity: 'vocabulary', targetId: 'mizu', expected: 'みず' }, 1000);
  Diagnostics.addAttempt(firstTry, { attemptId: 'a', outcome: 'accepted', transcript: '水' });
  assert.equal(Diagnostics.resolve(firstTry, 'speech-correct', { storage, now: 2000 }), false);

  const speechRecovery = Diagnostics.begin({ activity: 'vocabulary', targetId: 'senkou', expected: 'わたしのせんこうです', promptStyle: 'context' }, 3000);
  Diagnostics.addAttempt(speechRecovery, { attemptId: 'a', outcome: 'mismatch', transcript: '私の先行です', confidence: .82 });
  Diagnostics.addAttempt(speechRecovery, { attemptId: 'a', outcome: 'mismatch', transcript: 'duplicate' });
  Diagnostics.addAttempt(speechRecovery, { attemptId: 'b', outcome: 'accepted', transcript: '私の専攻です', confidence: .9 });
  assert.equal(Diagnostics.resolve(speechRecovery, 'speech-correct', { storage, now: 5000 }), true);

  const typedRecovery = Diagnostics.begin({ activity: 'vocabulary', targetId: 'suffix-go', expected: 'にほんご', promptStyle: 'suffix-context' }, 6000);
  Diagnostics.addAttempt(typedRecovery, { attemptId: 'c', outcome: 'mismatch', transcript: '日本後' });
  assert.equal(Diagnostics.resolve(typedRecovery, 'typed-correct', { storage, now: 7000 }), true);

  const records = Diagnostics.read(storage, 7000).records;
  assert.equal(records.length, 2);
  assert.deepEqual(records.map(record => record.resolution), ['speech-correct', 'typed-correct']);
  assert.equal(records[0].attemptCount, 2);
  assert.equal('audio' in records[0], false);
});

test('summaries separate recovery types and rank repeated transcript friction', () => {
  const summary = Diagnostics.summarize([
    { activity: 'vocabulary', targetId: 'senkou', expected: 'せんこう', resolution: 'speech-correct', attemptCount: 2, attempts: [{ outcome: 'mismatch', transcript: '先行' }, { outcome: 'accepted', transcript: '専攻' }] },
    { activity: 'vocabulary', targetId: 'senkou', expected: 'せんこう', resolution: 'typed-correct', attemptCount: 1, attempts: [{ outcome: 'mismatch', transcript: '先行' }] },
  ]);
  assert.equal(summary.total, 2);
  assert.equal(summary.speechRecoveries, 1);
  assert.equal(summary.typedRecoveries, 1);
  assert.deepEqual(summary.frequentTargets[0].transcripts[0], ['先行', 2]);
});

test('diagnostics retain only recent records and cap local history', () => {
  const storage = memoryStorage();
  const now = 40 * 24 * 60 * 60 * 1000;
  storage.setItem(Diagnostics.STORAGE_KEY, JSON.stringify({ version: 1, records: [
    { resolvedAt: 1 },
    ...Array.from({ length: 105 }, (_, index) => ({ resolvedAt: now - 1000 + index })),
  ] }));
  const records = Diagnostics.read(storage, now).records;
  assert.equal(records.length, Diagnostics.MAX_RECORDS);
  assert.ok(records.every(record => record.resolvedAt > now - 30 * 24 * 60 * 60 * 1000));
});
