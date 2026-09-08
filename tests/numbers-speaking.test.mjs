import assert from 'node:assert/strict';
import test from 'node:test';

await import('../features/kana/numbers-speaking.js');
const { matches, matchesRomaji, interpretation, createSession } = globalThis.KANA_SPRINT_NUMBERS_SPEAKING;

const fortyTwo = { number: 42, kanji: '四十二', hiragana: 'よんじゅうに', romaji: 'yonjuuni' };

test('number speaking accepts exact equivalent written forms without fuzzy matching', () => {
  for (const value of ['42', '４２', '四十二', 'よんじゅうに。', 'ヨンジュウニ']) {
    assert.equal(matches(fortyTwo, value), true, value);
  }
  for (const value of ['', '40', '四十', 'よんじゅう', 'よんじゅうさん']) {
    assert.equal(matches(fortyTwo, value), false, value);
  }
});

test('number speaking supports an exact romaji typing fallback and a readable interpretation', () => {
  assert.equal(matchesRomaji(fortyTwo, ' yon-juu-ni '), true);
  assert.equal(matchesRomaji(fortyTwo, 'yonjuusan'), false);
  assert.equal(interpretation(fortyTwo, '四十二'), 'よんじゅうに (42)');
  assert.equal(interpretation(fortyTwo, '四十'), '');
});

class Recognition {
  static instances = [];
  constructor() { Recognition.instances.push(this); }
  start() { this.onstart(); }
  stop() { this.stopped = true; }
  abort() { this.aborted = true; this.onend?.(); }
  result(text, final) { this.onresult({ results: [Object.assign([{ transcript: text }], { isFinal: final })] }); }
}

test('number speech waits for a final Japanese transcript before review', () => {
  let state;
  const session = createSession(Recognition, value => { state = value; });
  session.start();
  const recognition = Recognition.instances.at(-1);
  assert.equal(recognition.lang, 'ja-JP');
  recognition.result('四十', false);
  assert.equal(state.status, 'listening');
  session.stop();
  assert.equal(state.status, 'processing');
  recognition.result('四十二', true);
  recognition.onend();
  assert.equal(state.status, 'review');
  assert.equal(state.text, '四十二');
  session.cancel();
});

test('number speech errors remain retryable and cannot become answers', () => {
  let state;
  const session = createSession(Recognition, value => { state = value; });
  session.start();
  Recognition.instances.at(-1).onerror({ error: 'network' });
  assert.equal(state.status, 'error');
  assert.match(state.message, /connect/);
  assert.equal(state.text, '');
});
