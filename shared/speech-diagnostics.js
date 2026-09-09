(() => {
  "use strict";

  const STORAGE_KEY = "kanaSprintSpeechDiagnosticsV1";
  const VERSION = 1;
  const MAX_RECORDS = 100;
  const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

  function browserFamily(userAgent = globalThis.navigator?.userAgent || "") {
    if (/Edg\//.test(userAgent)) return "Edge";
    if (/Chrome\//.test(userAgent) && !/Edg\//.test(userAgent)) return "Chrome";
    if (/Firefox\//.test(userAgent)) return "Firefox";
    if (/Safari\//.test(userAgent) && !/Chrome\//.test(userAgent)) return "Safari";
    return "Other";
  }

  function validRecord(record, now = Date.now()) {
    return record && typeof record === "object" && Number(record.resolvedAt) > now - MAX_AGE_MS;
  }

  function read(storage = globalThis.localStorage, now = Date.now()) {
    try {
      const saved = JSON.parse(storage?.getItem(STORAGE_KEY));
      const records = Array.isArray(saved?.records) ? saved.records.filter(record => validRecord(record, now)).slice(-MAX_RECORDS) : [];
      return { version: VERSION, records };
    } catch {
      return { version: VERSION, records: [] };
    }
  }

  function write(records, storage = globalThis.localStorage) {
    storage?.setItem(STORAGE_KEY, JSON.stringify({ version: VERSION, records: records.slice(-MAX_RECORDS) }));
  }

  function begin(meta = {}, now = Date.now()) {
    return {
      meta: {
        activity: String(meta.activity || "unknown"),
        targetId: String(meta.targetId || "unknown"),
        expected: String(meta.expected || ""),
        promptStyle: String(meta.promptStyle || "isolated"),
        browser: String(meta.browser || browserFamily()),
      },
      startedAt: now,
      attempts: [],
      attemptIds: new Set(),
    };
  }

  function addAttempt(chain, attempt = {}) {
    if (!chain || !Array.isArray(chain.attempts)) return chain;
    const attemptId = String(attempt.attemptId || `attempt-${chain.attempts.length + 1}`);
    if (chain.attemptIds?.has(attemptId)) return chain;
    chain.attemptIds?.add(attemptId);
    chain.attempts.push({
      attemptId,
      outcome: String(attempt.outcome || "error"),
      transcript: String(attempt.transcript || ""),
      confidence: Number.isFinite(attempt.confidence) ? Math.round(attempt.confidence * 1000) / 1000 : null,
      errorCode: String(attempt.errorCode || ""),
      durationMs: Math.max(0, Math.round(Number(attempt.durationMs) || 0)),
    });
    return chain;
  }

  function resolve(chain, resolution, options = {}) {
    if (!chain || !Array.isArray(chain.attempts)) return false;
    const speechRecovery = resolution === "speech-correct" && chain.attempts.length > 1;
    const typedRecovery = resolution === "typed-correct" && chain.attempts.length > 0;
    if (!speechRecovery && !typedRecovery) return false;
    const now = Number(options.now) || Date.now();
    const storage = options.storage || globalThis.localStorage;
    const existing = read(storage, now).records;
    existing.push({
      ...chain.meta,
      resolution,
      attempts: chain.attempts.map(attempt => ({ ...attempt })),
      attemptCount: chain.attempts.length,
      startedAt: chain.startedAt,
      resolvedAt: now,
      durationMs: Math.max(0, now - chain.startedAt),
    });
    write(existing.filter(record => validRecord(record, now)), storage);
    return true;
  }

  function summarize(records = read().records) {
    const targets = new Map();
    let speechRecoveries = 0;
    let typedRecoveries = 0;
    for (const record of records) {
      if (record.resolution === "speech-correct") speechRecoveries++;
      if (record.resolution === "typed-correct") typedRecoveries++;
      const key = `${record.activity}:${record.targetId}`;
      const target = targets.get(key) || { activity: record.activity, targetId: record.targetId, expected: record.expected, chains: 0, attempts: 0, transcripts: new Map() };
      target.chains++;
      target.attempts += record.attemptCount || record.attempts?.length || 0;
      for (const attempt of record.attempts || []) {
        if (!attempt.transcript || attempt.outcome === "accepted") continue;
        target.transcripts.set(attempt.transcript, (target.transcripts.get(attempt.transcript) || 0) + 1);
      }
      targets.set(key, target);
    }
    const frequentTargets = [...targets.values()].map(target => ({
      ...target,
      transcripts: [...target.transcripts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3),
    })).sort((a, b) => b.chains - a.chains || b.attempts - a.attempts);
    return { total: records.length, speechRecoveries, typedRecoveries, frequentTargets };
  }

  function clear(storage = globalThis.localStorage) {
    storage?.removeItem(STORAGE_KEY);
  }

  globalThis.KANA_SPRINT_SPEECH_DIAGNOSTICS = Object.freeze({
    STORAGE_KEY, MAX_RECORDS, begin, addAttempt, resolve, read, summarize, clear, browserFamily,
  });
})();
