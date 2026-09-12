import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

await import('../features/kana/vocabulary-examples.js');

const examples = globalThis.KANA_SPRINT_VOCABULARY_EXAMPLES;
const vocabularySource = readFileSync(resolve('features/kana/vocabulary.js'), 'utf8');
const stageSource = vocabularySource.split('const WORDS =')[0];
const wordIds = [...stageSource.matchAll(/^\s*\["([^"]+)",\s*"/gm)].map(match => match[1]);

test('every vocabulary word has a complete example sentence', () => {
  assert.equal(Object.keys(examples).length, wordIds.length);
  wordIds.forEach(id => {
    const example = examples[id];
    assert.ok(example, `${id} is missing an example`);
    assert.equal(example.length >= 2, true, `${id} needs Japanese and English`);
    assert.ok(example[0].trim().length > 2, `${id} needs a Japanese sentence`);
    assert.ok(example[1].trim().length > 2, `${id} needs an English translation`);
  });
});

test('each example contains the vocabulary term or its declared focus text', () => {
  const wordTerms = new Map(
    [...stageSource.matchAll(/^\s*\["([^"]+)",\s*"([^"]+)"/gm)]
      .map(match => [match[1], match[2].replace('～', '')]),
  );
  wordIds.forEach(id => {
    const [sentence, , focus] = examples[id];
    assert.ok(sentence.includes(focus || wordTerms.get(id)), `${id} is not present in its example`);
  });
});
