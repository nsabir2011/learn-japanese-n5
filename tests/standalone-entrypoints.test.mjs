import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const entrypoints = [
  'index.html',
  'hiragana_sprint.html',
  'katakana_sprint.html',
  'kana_sprint.html',
  'vocabulary.html',
  'numbers.html',
  'settings.html',
  'guided/player.html',
];

const stylesheetsWithLocalAssets = [
  'features/kana/hiragana-fonts.css',
  'features/kana/katakana-fonts.css',
];

test('standalone HTML entrypoints only reference files that exist', () => {
  for (const entrypoint of entrypoints) {
    const htmlPath = resolve(root, entrypoint);
    const html = readFileSync(htmlPath, 'utf8');
    const references = [...html.matchAll(/(?:href|src)="(\.{1,2}\/[^"#?]+)(?:[?#][^"]*)?"/g)];

    for (const [, reference] of references) {
      const target = resolve(dirname(htmlPath), reference);
      assert.ok(existsSync(target), `${entrypoint} references missing file ${reference}`);
    }
  }
});

test('the root launcher links to every learning experience', () => {
  const html = readFileSync(resolve(root, 'index.html'), 'utf8');
  for (const target of [
    './hiragana_sprint.html',
    './katakana_sprint.html',
    './kana_sprint.html',
    './vocabulary.html',
    './numbers.html',
    './settings.html',
    './guided/player.html?lesson=1',
  ]) {
    assert.ok(html.includes(`href="${target}"`), `root launcher does not link to ${target}`);
  }
});

test('the root launcher reports live cloud-sync status', () => {
  const html = readFileSync(resolve(root, 'index.html'), 'utf8');
  const sync = readFileSync(resolve(root, 'shared/progress-sync.js'), 'utf8');
  assert.match(html, /src="\.\/shared\/progress-sync\.js/);
  assert.match(html, /class="status pill">Cloud sync connecting…<\/span>/);
  assert.doesNotMatch(html, /offline-ready/);
  assert.match(sync, /pill\.textContent = 'Auto-saved on this device'/);
  assert.match(sync, /DOMContentLoaded', showDeviceOnlyStatus/);
});

test('the compact Kana Mix icon uses the launcher card class', () => {
  const html = readFileSync(resolve(root, 'index.html'), 'utf8');
  const css = readFileSync(resolve(root, 'features/home/styles.css'), 'utf8');
  assert.match(html, /class="activity-card mix-card"/);
  assert.match(css, /\.mix-card \.kana-pair/);
});

test('all kana sprints expose separate Fonts and Settings management tabs', () => {
  const trainer = readFileSync(resolve(root, 'features/kana/trainer.js'), 'utf8');
  assert.match(trainer, /label:"Manage",tabs:\["fonts","settingsdata"\]/);
  assert.match(trainer, /dataset\.tab="settingsdata";tab\.textContent="Settings"/);
  assert.doesNotMatch(trainer, /practiceFontSettingsBody/);
});

test('vocabulary feedback explains the meaning of a selected wrong choice', () => {
  const vocabulary = readFileSync(resolve(root, 'features/kana/vocabulary.js'), 'utf8');
  const styles = readFileSync(resolve(root, 'features/kana/vocabulary.css'), 'utf8');
  assert.match(vocabulary, /const selectedWord = !correct && selectedId \? WORDS\.find\(word => word\.id === selectedId\) : null/);
  assert.match(vocabulary, /vocab-feedback-choice-label/);
  assert.match(vocabulary, /Meaning: \$\{selectedWord\.meaning\}/);
  assert.match(styles, /\.vocab-feedback-choice/);
});

test('vocabulary choices reveal pronunciation or Japanese text only after answering', () => {
  const vocabulary = readFileSync(resolve(root, 'features/kana/vocabulary.js'), 'utf8');
  const styles = readFileSync(resolve(root, 'features/kana/vocabulary.css'), 'utf8');
  assert.match(vocabulary, /options\.classList\.remove\("is-answered"\)/);
  assert.match(vocabulary, /class="vocab-choice-secondary" aria-hidden="true">\$\{choice\.romaji\}/);
  assert.match(vocabulary, /class="vocab-choice-secondary vocab-choice-japanese-secondary" aria-hidden="true">\$\{choice\.jp\}/);
  assert.match(vocabulary, /options\.classList\.add\("is-answered"\)/);
  assert.match(vocabulary, /querySelectorAll\("\.vocab-choice-secondary"\)\.forEach\(detail => detail\.removeAttribute\("aria-hidden"\)\)/);
  assert.match(styles, /\.vocab-options:not\(\.is-answered\) \.vocab-choice-secondary\{display:none\}/);
  assert.match(styles, /\.vocab-choice-japanese-secondary/);
});

test('vocabulary scopes separate guided sequencing from all-word practice', () => {
  const vocabulary = readFileSync(resolve(root, 'features/kana/vocabulary.js'), 'utf8');
  assert.match(vocabulary, /adaptive: "Guided course", all: "All vocabulary"/);
  assert.match(vocabulary, /<option value="all">All vocabulary<\/option>/);
  assert.match(vocabulary, /if \(scope === "all"\) return WORDS/);
  assert.match(vocabulary, /all: "All words"/);
  assert.match(vocabulary, /const reviewPool = adaptive \? introducedWords\(\) : pool/);
  assert.match(vocabulary, /practicedEarly \? "Practiced early"/);
});

test('vocabulary review queue stays scoped and counts each word once', () => {
  const vocabulary = readFileSync(resolve(root, 'features/kana/vocabulary.js'), 'utf8');
  assert.match(vocabulary, /function regularReviewPool/);
  assert.match(vocabulary, /function reviewPoolForScope/);
  assert.match(vocabulary, /return scope === "trouble" \? weakWords\(pool\) : pool/);
  assert.match(vocabulary, /function wordIsDue/);
  assert.match(vocabulary, /function dueReviewBreakdown/);
  assert.match(vocabulary, /const words = pool\.filter\(word => wordIsDue\(word\)\)/);
  assert.match(vocabulary, /return dueReviewBreakdown\(\)\.total/);
  assert.match(vocabulary, /id="vocabDueSummary"/);
  assert.match(vocabulary, /id="vocabDueBreakdown"/);
  assert.match(vocabulary, /one shared review queue/);
  assert.doesNotMatch(vocabulary, /function dueModes/);
  assert.match(vocabulary, /Only weak words from the selected regular scope/);
  assert.match(vocabulary, /Recent misses in \$\{troubleSourceScope\}/);
});

test('vocabulary pacing interleaves new words with normal due reviews and prioritizes urgent retries', () => {
  const vocabulary = readFileSync(resolve(root, 'features/kana/vocabulary.js'), 'utf8');
  assert.match(vocabulary, /function paceMixLabel/);
  assert.match(vocabulary, /function urgentReviewEntries/);
  assert.match(vocabulary, /if \(urgent\.length\) return \{\s*\.\.\.selectReviewEntry\(urgent\)/);
  assert.match(vocabulary, /const decision = Scheduler\.nextIntroductionDecision\(state\.pace, state\.newWordCredit\)/);
  assert.match(vocabulary, /if \(due\.length\) return \{\s*\.\.\.selectReviewWord\(due, recent, true\)/);
  assert.match(vocabulary, /const scheduledChoice = selectReviewWord\(scheduled, recent, false, false\)/);
  assert.match(vocabulary, /return `\$\{state\.pace\}% new \/ \$\{100 - state\.pace\}% review target`/);
});

test('vocabulary uses global unlocks with one shared urgent schedule', () => {
  const vocabulary = readFileSync(resolve(root, 'features/kana/vocabulary.js'), 'utf8');
  assert.match(vocabulary, /const UNIFIED_REVIEW_MODEL = "unified-v1"/);
  assert.match(vocabulary, /urgentMode: "", urgentRetryPending: false/);
  assert.match(vocabulary, /progress\.urgentRetryPending = progress\.lastWasCorrect === false/);
  assert.match(vocabulary, /const wasUrgentRetry = progress\.urgentRetryPending && progress\.urgentMode === currentMode/);
  assert.match(vocabulary, /Scheduler\.nextReviewSchedule\(progress\.mastery, scheduleCorrect, state\.total, now\)/);
  assert.match(vocabulary, /return progress\.introduced && progress\.seen > 0 && progress\.mastery >= 72/);
  assert.match(vocabulary, /if \(wasUrgentRetry\) \{\s*progress\.urgentRetryPending = false;/);
});

test('vocabulary introduction and TTS controls have keyboard access', () => {
  const vocabulary = readFileSync(resolve(root, 'features/kana/vocabulary.js'), 'utf8');
  assert.match(vocabulary, /Practice this word <kbd>Enter<\/kbd>/);
  assert.match(vocabulary, /aria-keyshortcuts="Enter"/);
  assert.match(vocabulary, /setTimeout\(\(\) => \$\("#vocabStartCheck"\)\?\.focus\(\), 0\)/);
  assert.match(vocabulary, /Play again <kbd>R<\/kbd>/);
  assert.match(vocabulary, /Replay Japanese <kbd>R<\/kbd>/);
  assert.doesNotMatch(vocabulary, /Replay as often as you need, or press <kbd>R<\/kbd>/);
  assert.doesNotMatch(vocabulary, /Press <kbd>R<\/kbd> to replay the audio/);
  assert.doesNotMatch(vocabulary, /<kbd>R<\/kbd> to hear it/);
  assert.match(vocabulary, /if \(key === "r"/);
  assert.match(vocabulary, /phase === "introduction" \? \$\("#vocabIntroSpeech"\)/);
});

test('vocabulary answer choices support an adaptive default and manual override', () => {
  const vocabulary = readFileSync(resolve(root, 'features/kana/vocabulary.js'), 'utf8');
  assert.match(vocabulary, /choiceCount: "auto"/);
  assert.match(vocabulary, /<select id="vocabChoiceCount"><option value="auto">Auto \(adaptive\)<\/option><option value="4">4 choices<\/option><option value="6">6 choices<\/option><option value="8">8 choices<\/option><option value="not-used" disabled>Not used for speaking<\/option><\/select>/);
  assert.match(vocabulary, /if \(state\.choiceCount !== "auto"\) return Number\(state\.choiceCount\)/);
  assert.match(vocabulary, /currentChoiceCount = choices\.length/);
  assert.match(vocabulary, /state\.choiceCount = CHOICE_COUNT_VALUES\.includes\(event\.target\.value\) \? event\.target\.value : "auto"/);
  assert.match(vocabulary, /Uses \$\{state\.choiceCount\} choices from the next question/);
});

test('vocabulary offers a silent bidirectional written mode', () => {
  const vocabulary = readFileSync(resolve(root, 'features/kana/vocabulary.js'), 'utf8');
  assert.match(vocabulary, /<option value="written-both">Japanese ↔ English \(written\)<\/option>/);
  assert.match(vocabulary, /if \(state\.questionFormat === "written-both"\) return \["written", "recall"\]/);
  assert.match(vocabulary, /"written-both": "Silent practice alternates between Japanese text → English and English → Japanese\."/);
  assert.match(vocabulary, /\["written", "spoken", "recall", "speaking", "written-both", "mixed"\]/);
});

test('published entrypoints receive the inline navigation progress bar', () => {
  const prepareScript = readFileSync(resolve(root, 'scripts/prepare-site-assets.mjs'), 'utf8');
  const progressScript = readFileSync(resolve(root, 'shared/navigation-progress.js'), 'utf8');
  const progressStyles = readFileSync(resolve(root, 'shared/navigation-progress.css'), 'utf8');

  assert.match(prepareScript, /navigationProgressHead/);
  assert.match(prepareScript, /html\.replace\('<head>'/);
  assert.match(progressScript, /document\.addEventListener\('click'/);
  assert.match(progressScript, /window\.addEventListener\('pageshow'/);
  assert.match(progressStyles, /html\.navigation-progress-active::before/);
  assert.match(progressStyles, /prefers-reduced-motion: reduce/);
});

test('speaking practice exposes error, kana interpretation, romaji, and post-submit states', () => {
  const vocabulary = readFileSync(resolve(root, 'features/kana/vocabulary.js'), 'utf8');
  const styles = readFileSync(resolve(root, 'features/kana/vocabulary.css'), 'utf8');
  assert.match(vocabulary, /id="vocabSpeechInterpretation"/);
  assert.match(vocabulary, /id="vocabTypeRomaji"/);
  assert.match(vocabulary, /id="vocabRomajiPreview"/);
  assert.match(vocabulary, /\$\("#vocabSpeechActions"\)\.classList\.add\("hidden"\)/);
  assert.match(styles, /vocabSpeechStatus\[data-status="error"\]/);
});

test('speaking direction keeps session controls aligned and disables answer choices', () => {
  const vocabulary = readFileSync(resolve(root, 'features/kana/vocabulary.js'), 'utf8');
  const styles = readFileSync(resolve(root, 'features/kana/vocabulary.css'), 'utf8');
  assert.match(vocabulary, /<option value="not-used" disabled>Not used for speaking<\/option>/);
  assert.match(vocabulary, /choiceSelect\.disabled = speaking/);
  assert.match(vocabulary, /Multiple-choice settings don’t apply here\./);
  assert.match(styles, /\.vocab-setup>label\{[^}]*align-self:start/);
  assert.match(styles, /\.vocab-setup small\{min-height:2\.7em/);
});

test('stylesheet asset references remain valid after source moves', () => {
  for (const stylesheet of stylesheetsWithLocalAssets) {
    const cssPath = resolve(root, stylesheet);
    const css = readFileSync(cssPath, 'utf8');
    const references = [...css.matchAll(/url\(["']?(\.{1,2}\/[^"')?#]+)/g)];

    for (const [, reference] of references) {
      const target = resolve(dirname(cssPath), reference);
      assert.ok(existsSync(target), `${stylesheet} references missing file ${reference}`);
    }
  }
});

test('frontend implementation is separated into features and content', () => {
  assert.ok(existsSync(resolve(root, 'features/kana/trainer.js')));
  assert.ok(existsSync(resolve(root, 'features/guided/player.js')));
  assert.ok(existsSync(resolve(root, 'content/kana/hiragana.js')));
  assert.ok(existsSync(resolve(root, 'content/guided/lesson-01.js')));
  assert.ok(!existsSync(resolve(root, 'lessons')));
});
