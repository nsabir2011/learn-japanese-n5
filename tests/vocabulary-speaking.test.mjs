import assert from 'node:assert/strict';
import test from 'node:test';
await import('../features/kana/vocabulary-speaking.js');
const { matches, createSession } = globalThis.KANA_SPRINT_VOCABULARY_SPEAKING;

test('speaking accepts kana, kanji, width and punctuation variants without fuzzy matches', () => {
  const word = { id: 'mizu', jp: 'みず' };
  for (const value of ['水', 'みず。', 'ミズ', ' ﾐｽﾞ！ ']) assert.equal(matches(word, value), true, value);
  for (const value of ['', ' ', 'みす', '水です', 'お茶']) assert.equal(matches(word, value), false, value);
  assert.equal(matches({ id: 'nan-nani', jp: 'なん／なに' }, 'なに'), true);
  assert.equal(matches({ id: 'suffix-en', jp: '～えん' }, '円'), true);
  assert.equal(matches({ id: 'ichiji', jp: 'いちじ' }, '１時'), true);
  assert.equal(matches({ id: 'arigatou-gozaimasu', jp: 'ありがとうございます' }, 'ありがとう'), false);
});

class Recognition {
  static instances = [];
  constructor() { Recognition.instances.push(this); }
  start() { this.onstart(); }
  stop() { this.stopped = true; }
  abort() { this.aborted = true; this.onend?.(); }
  result(text, final) { this.onresult({ results: [Object.assign([{ transcript: text }], { isFinal: final })] }); }
}

test('interim speech and Stop cannot submit until a final result and end', () => {
  let state;
  const session = createSession(Recognition, value => { state = value; });
  session.start();
  const recognition = Recognition.instances.at(-1);
  assert.equal(recognition.lang, 'ja-JP');
  recognition.result('み', false);
  assert.equal(state.status, 'listening');
  session.stop();
  assert.equal(state.status, 'processing');
  recognition.result('水', true);
  assert.equal(state.status, 'processing');
  recognition.onend();
  assert.equal(state.status, 'review');
  assert.equal(state.text, '水');
  session.cancel();
});

test('retry and navigation ignore results from cancelled recognition', () => {
  let state;
  const session = createSession(Recognition, value => { state = value; });
  session.start();
  const old = Recognition.instances.at(-1);
  session.start();
  const latest = Recognition.instances.at(-1);
  old.result('wrong question', true);
  old.onend();
  assert.equal(state.text, '');
  latest.result('水', true);
  latest.onend();
  assert.equal(state.text, '水');
  session.cancel();
  latest.onerror({ error: 'network' });
  assert.equal(state.status, 'review');
});

test('permission errors and silence are recoverable, never reviewable answers', () => {
  let state;
  const session = createSession(Recognition, value => { state = value; });
  session.start();
  Recognition.instances.at(-1).onerror({ error: 'not-allowed' });
  assert.equal(state.status, 'error');
  assert.match(state.message, /denied/);
  session.start();
  Recognition.instances.at(-1).result('partial', false);
  Recognition.instances.at(-1).onend();
  assert.equal(state.status, 'error');
  assert.equal(state.text, '');
  session.cancel();
});
