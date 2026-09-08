(() => {
  "use strict";

  // Explicit spellings keep matching predictable: no fuzzy acceptance of a wrong word.
  const spellings = {
    ohayou: "お早う", "ohayou-gozaimasu": "お早うございます", konnichiwa: "今日は", konbanwa: "今晩は",
    sayounara: "さよなら", "oyasumi-nasai": "お休みなさい", arigatou: "有難う|ありがとう", "arigatou-gozaimasu": "有難うございます",
    sumimasen: "済みません", ittekimasu: "行ってきます|行って来ます", itterasshai: "行ってらっしゃい", tadaima: "只今",
    "okaeri-nasai": "お帰りなさい", itadakimasu: "頂きます", "gochisousama-deshita": "ご馳走様でした|ごちそう様でした",
    hajimemashite: "初めまして|始めまして", "yoroshiku-onegaishimasu": "よろしくお願いします|宜しくお願いします", anou: "あのー",
    daigaku: "大学", koukou: "高校", gakusei: "学生", daigakusei: "大学生", ryuugakusei: "留学生", sensei: "先生",
    "suffix-nensei": "年生", ichinensei: "一年生|1年生", senkou: "専攻", watashi: "私", tomodachi: "友達|友だち",
    "suffix-jin": "人", nihonjin: "日本人", namae: "名前", ima: "今", gozen: "午前", gogo: "午後", "suffix-ji": "時",
    ichiji: "一時|1時", han: "半", nijihan: "二時半|2時半|2時30分", nihon: "日本", "suffix-go": "語", nihongo: "日本語",
    "suffix-sai": "歳|才", denwa: "電話", "suffix-ban": "番", bangou: "番号", "nan-nani": "何", kankoku: "韓国", chuugoku: "中国",
    "ajia-kenkyuu": "アジア研究", keizai: "経済", kougaku: "工学", "kokusai-kankei": "国際関係", seiji: "政治", seibutsugaku: "生物学",
    bungaku: "文学", rekishi: "歴史", isha: "医者", kaishain: "会社員", kangoshi: "看護師", koukousei: "高校生", shufu: "主婦|主夫",
    daigakuinsei: "大学院生", bengoshi: "弁護士", okaasan: "お母さん", otousan: "お父さん", oneesan: "お姉さん", oniisan: "お兄さん",
    imouto: "妹", otouto: "弟", dare: "誰", ginkou: "銀行", toshokan: "図書館", yuubinkyoku: "郵便局",
    oishii: "美味しい", sakana: "魚", tonkatsu: "豚カツ|豚かつ", niku: "肉", yasai: "野菜", kasa: "傘", kaban: "鞄",
    kutsu: "靴", saifu: "財布", jitensha: "自転車", shinbun: "新聞", tiishatsu: "ティーシャツ", tokei: "時計", boushi: "帽子", hon: "本",
    eigo: "英語", "suffix-en": "円", takai: "高い", onegaishimasu: "お願いします", kudasai: "下さい", "gomen-nasai": "ご免なさい",
    "mata-ne": "またね", wakarimasu: "分かります|判ります|解ります", wakarimasen: "分かりません|判りません|解りません",
    daijoubu: "大丈夫", kazoku: "家族", hito: "人", kyou: "今日", ashita: "明日", kinou: "昨日", asa: "朝", hiru: "昼", yoru: "夜",
    jikan: "時間", iku: "行く", kuru: "来る", kaeru: "帰る", shigoto: "仕事", mizu: "水", ocha: "お茶", gohan: "ご飯|御飯",
    asagohan: "朝ご飯|朝御飯|朝ごはん", taberu: "食べる", nomu: "飲む", mise: "店", eki: "駅", densha: "電車", kuruma: "車",
    migi: "右", hidari: "左", massugu: "真っ直ぐ|真っすぐ", iriguchi: "入口|入り口", deguchi: "出口"
  };
  function normalize(value) {
    return String(value).normalize("NFKC").toLowerCase()
      .replace(/[\u30a1-\u30f6]/g, char => String.fromCharCode(char.charCodeAt(0) - 0x60))
      .replace(/[\s\p{P}~～]/gu, "");
  }
  function matches(word, transcript) {
    const input = normalize(transcript);
    const accepted = [...word.jp.split(/[／/]/), ...(spellings[word.id] || "").split("|")];
    return Boolean(input) && accepted.some(value => normalize(value) === input);
  }

  const romajiPairs = {
    kya: "きゃ", kyu: "きゅ", kyo: "きょ", sha: "しゃ", shu: "しゅ", sho: "しょ", cha: "ちゃ", chu: "ちゅ", cho: "ちょ",
    nya: "にゃ", nyu: "にゅ", nyo: "にょ", hya: "ひゃ", hyu: "ひゅ", hyo: "ひょ", mya: "みゃ", myu: "みゅ", myo: "みょ",
    rya: "りゃ", ryu: "りゅ", ryo: "りょ", gya: "ぎゃ", gyu: "ぎゅ", gyo: "ぎょ", ja: "じゃ", ju: "じゅ", jo: "じょ",
    bya: "びゃ", byu: "びゅ", byo: "びょ", pya: "ぴゃ", pyu: "ぴゅ", pyo: "ぴょ", shi: "し", chi: "ち", tsu: "つ", fu: "ふ",
    ka: "か", ki: "き", ku: "く", ke: "け", ko: "こ", sa: "さ", su: "す", se: "せ", so: "そ", ta: "た", te: "て", to: "と",
    na: "な", ni: "に", nu: "ぬ", ne: "ね", no: "の", ha: "は", hi: "ひ", he: "へ", ho: "ほ", ma: "ま", mi: "み", mu: "む", me: "め", mo: "も",
    ya: "や", yu: "ゆ", yo: "よ", ra: "ら", ri: "り", ru: "る", re: "れ", ro: "ろ", wa: "わ", wo: "を",
    ga: "が", gi: "ぎ", gu: "ぐ", ge: "げ", go: "ご", za: "ざ", ji: "じ", zu: "ず", ze: "ぜ", zo: "ぞ",
    da: "だ", de: "で", do: "ど", ba: "ば", bi: "び", bu: "ぶ", be: "べ", bo: "ぼ", pa: "ぱ", pi: "ぴ", pu: "ぷ", pe: "ぺ", po: "ぽ",
    a: "あ", i: "い", u: "う", e: "え", o: "お"
  };
  function normalizeRomaji(value) {
    return String(value).normalize("NFKC").toLowerCase()
      .replaceAll("ā", "aa").replaceAll("ī", "ii").replaceAll("ū", "uu").replaceAll("ē", "ee").replaceAll("ō", "ou")
      .replace(/[^a-z]/g, "");
  }
  function romajiToHiragana(value) {
    const input = String(value).normalize("NFKC").toLowerCase()
      .replaceAll("ā", "aa").replaceAll("ī", "ii").replaceAll("ū", "uu").replaceAll("ē", "ee").replaceAll("ō", "ou");
    let output = "";
    for (let index = 0; index < input.length;) {
      const char = input[index];
      if (/[^a-z]/.test(char)) { index++; continue; }
      if (char !== "n" && char === input[index + 1] && /[bcdfghjklmpqrstvwxyz]/.test(char)) {
        output += "っ";
        index++;
        continue;
      }
      if (char === "n" && input[index + 1] === "n" && /[aiueoy]/.test(input[index + 2] || "")) {
        output += "ん";
        index++;
        continue;
      }
      if (char === "n" && (index === input.length - 1 || input[index + 1] === "'" || (!/[aiueoy]/.test(input[index + 1]) && input[index + 1] !== "n"))) {
        output += "ん";
        index += input[index + 1] === "'" ? 2 : 1;
        continue;
      }
      let found = false;
      for (const length of [3, 2, 1]) {
        const kana = romajiPairs[input.slice(index, index + length)];
        if (!kana) continue;
        output += kana;
        index += length;
        found = true;
        break;
      }
      if (!found) { output += char; index++; }
    }
    return output;
  }
  function matchesRomaji(word, value) {
    return Boolean(normalizeRomaji(value)) && normalizeRomaji(value) === normalizeRomaji(word.romaji);
  }
  function interpretation(words, transcript) {
    const known = words.find(word => matches(word, transcript));
    if (known) return known.jp;
    const raw = String(transcript).normalize("NFKC").trim();
    if (/^[\u3040-\u30ffー\s、。！？]+$/.test(raw)) {
      return raw.replace(/[\u30a1-\u30f6]/g, char => String.fromCharCode(char.charCodeAt(0) - 0x60));
    }
    return "";
  }

  // A new instance per attempt prevents late callbacks from changing another question.
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
      let recognition;
      try {
        recognition = new Recognition();
        active = recognition;
        recognition.lang = "ja-JP";
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
        let finalText = "";
        emit({ status: "starting", text: "", message: "Allow microphone access to begin." });
        recognition.onstart = () => {
          if (active !== recognition) return;
          emit({ status: "listening", message: "Listening… Say the Japanese expression." });
        };
        recognition.onresult = event => {
          if (active !== recognition) return;
          finalText = "";
          let interim = "";
          for (let i = 0; i < event.results.length; i++) {
            if (event.results[i].isFinal) finalText += event.results[i][0].transcript;
            else interim += event.results[i][0].transcript;
          }
          emit({ text: finalText + interim });
        };
        recognition.onerror = event => {
          if (active !== recognition) return;
          const messages = {
            "not-allowed": "Microphone access was denied. Allow it in browser settings or type your answer.",
            "service-not-allowed": "Speech recognition is unavailable. Try Chrome or type your answer.",
            "audio-capture": "No microphone is available. Check your microphone or type your answer.",
            "network": "Couldn’t connect to speech recognition. Try again or type your answer.",
            "language-not-supported": "Japanese recognition is unavailable in this browser. Try Chrome or type your answer.",
            "no-speech": "No speech was heard. Try again when you’re ready."
          };
          cancel();
          emit({ status: "error", text: "", message: messages[event.error] || "Couldn’t recognize that. Try again or type your answer." });
        };
        recognition.onend = () => {
          if (active !== recognition) return;
          active = null;
          clearTimeout(timer);
          emit({ status: finalText.trim() ? "review" : "error", text: finalText,
            message: finalText.trim() ? "Is that what you said? Submit or try again." : "No complete speech was recognized. Try again." });
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
      try { active.stop(); } catch { cancel(); emit({ status: "error", text: "", message: "Please try again." }); }
    }
    return { start, stop, cancel };
  }
  globalThis.KANA_SPRINT_VOCABULARY_SPEAKING = { normalize, matches, matchesRomaji, romajiToHiragana, interpretation, createSession };
})();
