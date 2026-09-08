(() => {
  "use strict";

  function normalize(value) {
    return String(value ?? "").normalize("NFKC").toLowerCase()
      .replace(/[\u30a1-\u30f6]/g, char => String.fromCharCode(char.charCodeAt(0) - 0x60))
      .replace(/[\s\p{P}~～]/gu, "");
  }

  function normalizeRomaji(value) {
    return String(value ?? "").normalize("NFKC").toLowerCase()
      .replaceAll("ā", "aa").replaceAll("ī", "ii").replaceAll("ū", "uu").replaceAll("ē", "ee").replaceAll("ō", "ou")
      .replace(/[^a-z]/g, "");
  }

  function matches(question, value) {
    const input = normalize(value);
    if (!input) return false;
    const digits = String(question.number);
    return [digits, question.number.toLocaleString("en-US"), question.kanji, question.hiragana]
      .some(candidate => normalize(candidate) === input);
  }

  function matchesRomaji(question, value) {
    const input = normalizeRomaji(value);
    return Boolean(input) && input === normalizeRomaji(question.romaji);
  }

  function interpretation(question, value) {
    if (!matches(question, value)) return "";
    return `${question.hiragana} (${question.number.toLocaleString("en-US")})`;
  }

  function createSession(Recognition, update) {
    let active = null;
    let timer = null;
    let snapshot = { status: "idle", text: "", message: "" };
    const emit = patch => { snapshot = { ...snapshot, ...patch }; update(snapshot); };
    function cancel() {
      const previous = active;
      active = null;
      clearTimeout(timer);
      if (previous) { try { previous.abort(); } catch {} }
    }
    function start() {
      cancel();
      try {
        const recognition = new Recognition();
        active = recognition;
        recognition.lang = "ja-JP";
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
        let finalText = "";
        emit({ status: "starting", text: "", message: "Allow microphone access to begin." });
        recognition.onstart = () => {
          if (active === recognition) emit({ status: "listening", message: "Listening… Say the Japanese number." });
        };
        recognition.onresult = event => {
          if (active !== recognition) return;
          finalText = "";
          let interim = "";
          for (let index = 0; index < event.results.length; index++) {
            if (event.results[index].isFinal) finalText += event.results[index][0].transcript;
            else interim += event.results[index][0].transcript;
          }
          emit({ text: finalText + interim });
        };
        recognition.onerror = event => {
          if (active !== recognition) return;
          const messages = {
            "not-allowed": "Microphone access was denied. Allow it in browser settings or type your answer.",
            "service-not-allowed": "Speech recognition is unavailable. Try Chrome or Edge, or type your answer.",
            "audio-capture": "No microphone is available. Check your microphone or type your answer.",
            "network": "Couldn’t connect to speech recognition. Try again or type your answer.",
            "language-not-supported": "Japanese recognition is unavailable in this browser. Try Chrome or Edge, or type your answer.",
            "no-speech": "No speech was heard. Try again when you’re ready."
          };
          cancel();
          emit({ status: "error", text: "", message: messages[event.error] || "Couldn’t recognize that. Try again or type your answer." });
        };
        recognition.onend = () => {
          if (active !== recognition) return;
          active = null;
          clearTimeout(timer);
          emit({
            status: finalText.trim() ? "review" : "error",
            text: finalText,
            message: finalText.trim() ? "Is that what you said? Submit or try again." : "No complete speech was recognized. Try again."
          });
        };
        recognition.start();
        timer = setTimeout(() => {
          if (active !== recognition) return;
          cancel();
          emit({ status: "error", text: "", message: "Recognition timed out. Try again or type your answer." });
        }, 20000);
      } catch {
        cancel();
        emit({ status: "error", text: "", message: "Speech recognition couldn’t start. Try again or type your answer." });
      }
    }
    function stop() {
      if (!active || snapshot.status === "processing") return;
      emit({ status: "processing", message: "Finishing recognition…" });
      try { active.stop(); } catch {
        cancel();
        emit({ status: "error", text: "", message: "Please try again." });
      }
    }
    return { start, stop, cancel };
  }

  globalThis.KANA_SPRINT_NUMBERS_SPEAKING = { normalize, matches, matchesRomaji, interpretation, createSession };
})();
