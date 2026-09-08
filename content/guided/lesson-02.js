(() => {
  "use strict";

  const choice = (id, skill, kicker, title, prompt, options, answer, correction, explanation, extras = {}) => ({
    id, type: "choice", skill, kicker, title, prompt, options, answer, correction, explanation, ...extras
  });
  const tiles = (id, skill, kicker, title, prompt, tokens, distractors, correction, explanation, extras = {}) => ({
    id, type: "tiles", skill, kicker, title, prompt, tokens, answer: tokens, distractors, learnExtras: 2,
    correction, explanation, audioText: correction, ...extras
  });
  const input = (id, skill, kicker, title, prompt, answers, correction, explanation, audioText, extras = {}) => ({
    id, type: "input", skill, kicker, title, prompt, answers, correction, explanation, audioText,
    placeholder: "Type your answer", inputMode: "text", ...extras
  });

  const COMMON_MISTAKE_GUIDANCE = {
    "これ": "これ points to a thing near the speaker.",
    "それ": "それ points to a thing near the listener.",
    "あれ": "あれ points to a thing away from both speaker and listener.",
    "この": "この cannot stand alone; it must be followed by a noun.",
    "その": "その cannot stand alone; it must be followed by a noun.",
    "あの": "あの cannot stand alone; it must be followed by a noun.",
    "ね。": "ね asks the listener to share or confirm the speaker’s view.",
    "よ。": "よ presents information the speaker wants the listener to notice or accept.",
    "じゃないです。": "A noun must come before じゃないです in this answer.",
    "たかいじゃないです。": "じゃないです negates nouns here. たかい is an い-adjective and uses a different negative form taught later."
  };

  const CHOICE_GLOSSES = {
    "これ": "this one · near the speaker",
    "それ": "that one · near the listener",
    "あれ": "that one over there · far from both",
    "どれ": "which one",
    "ここ": "here · near the speaker",
    "そこ": "there · near the listener",
    "あそこ": "over there · far from both",
    "どこ": "where",
    "ね。": "right? · invites agreement",
    "よ。": "I tell you · supplies information",
    "～をください": "please give me … · concrete item",
    "～をおねがいします": "…, please · polite request or order",
    "～をどうぞ": "here is … · offering something"
  };

  const STAGES = [
    {
      id: "point", title: "See it from both sides", short: "これ・それ・あれ・どれ", outcome: "Choose pointing words from the current speaker’s position, even when the speakers switch.",
      activities: [
        {
          id: "point-map", type: "teach", skill: "Spatial", kicker: "Scene 1 · the shop counter", title: "The word changes with the speaker",
          instruction: "Track where the object is, then ask who is speaking. English ‘this’ and ‘that’ are not enough by themselves.",
          body: `<div class="lesson-distance-scene" aria-label="A notebook is near the customer, an umbrella is near the shopkeeper, and a bicycle is far from both"><div class="lesson-scene-zone speaker"><span class="lesson-scene-person">You</span><strong>これ</strong><small>ノート</small></div><div class="lesson-scene-zone listener"><span class="lesson-scene-person">Shopkeeper</span><strong>それ</strong><small>かさ</small></div><div class="lesson-scene-zone far"><span class="lesson-scene-person">far from both</span><strong>あれ</strong><small>じてんしゃ</small></div></div><div class="lesson-model"><div class="lesson-model-row"><span>Near me</span><strong>これは ノートです。</strong></div><div class="lesson-model-row"><span>Near you</span><strong>それは かさです。</strong></div><div class="lesson-model-row"><span>Far from us</span><strong>あれは じてんしゃです。</strong></div><div class="lesson-model-row"><span>Unknown</span><strong>どれですか。</strong></div></div><div class="lesson-rule"><strong>Perspective rule:</strong> when the speaker changes, これ and それ can swap even though the object stays still.</div>`,
          audioText: "これはノートです。それはかさです。あれはじてんしゃです。"
        },
        choice("point-near-me", "Spatial", "Point from your side", "You are holding a notebook.", "What do you call the notebook?", ["これ", "それ", "あれ", "どれ"], 0, "これ", "The notebook is beside the person speaking: you."),
        choice("point-near-you", "Spatial", "Point across the counter", "The shopkeeper is holding an umbrella.", "What do you call the umbrella?", ["それ", "これ", "あれ", "どれ"], 0, "それ", "The umbrella is near the listener, the shopkeeper."),
        choice("point-far", "Spatial", "Look beyond both people", "A bicycle is parked across the street, away from you and the shopkeeper.", "Which word points to it?", ["あれ", "それ", "これ", "どれ"], 0, "あれ", "あれ marks something distant from both people."),
        choice("point-switch", "Spatial", "Switch speakers", "The shopkeeper points to the notebook still in your hand.", "What does the shopkeeper say?", ["それは ノートです。", "これは ノートです。", "あれは ノートです。", "どれは ノートです。"], 0, "それは ノートです。", "From the shopkeeper’s position, the notebook is near the listener—you.", { audioText: "それはノートです。" }),
        choice("point-which", "Grammar", "Find one among several", "Three watches are on the counter.", "How do you ask ‘Which one?’", ["どれですか。", "どこですか。", "だれですか。", "これはですか。"], 0, "どれですか。", "どれ asks which thing among alternatives.", { audioText: "どれですか。" })
      ]
    },
    {
      id: "name", title: "Name the exact thing", short: "この・その・あの・どの + noun", outcome: "Keep the distance system while naming the object directly.",
      activities: [
        {
          id: "name-map", type: "teach", skill: "Grammar", kicker: "Scene 2 · be specific", title: "Add the noun after の",
          instruction: "The れ-series can stand alone. The の-series always needs a noun immediately after it.",
          body: `<div class="lesson-contrast-board"><div><span>Stands alone</span><strong>これ／それ／あれ／どれ</strong><small>これは いくらですか。</small></div><div><span>Before a noun</span><strong>この／その／あの／どの + noun</strong><small>この とけいは いくらですか。</small></div></div><div class="lesson-model"><div class="lesson-model-row"><span>This watch</span><strong>この とけい</strong></div><div class="lesson-model-row"><span>That bag by you</span><strong>その かばん</strong></div><div class="lesson-model-row"><span>That bicycle over there</span><strong>あの じてんしゃ</strong></div><div class="lesson-model-row"><span>Which book</span><strong>どの ほん</strong></div></div><div class="lesson-rule"><strong>Question pattern:</strong> use が after どの + noun when asking which one has a property: どの ほんが にほんごの ほんですか。</div>`,
          audioText: "このとけい。そのかばん。あのじてんしゃ。どのほんですか。"
        },
        tiles("name-this-watch", "Production", "Attach the noun", "Ask: “How much is this watch?”", "Build the complete question.", ["この", "とけいは", "いくら", "です", "か。"], ["これ", "どこ", "も"], "この とけいは いくらですか。", "この must be followed by the named object とけい."),
        choice("name-that-bag", "Grammar", "Near the listener", "The bag is beside the person you are speaking to.", "Complete: ___ かばんは メアリーさんのです。", ["その", "それ", "あの", "どれ"], 0, "その かばんは メアリーさんのです。", "その directly modifies かばん and locates it near the listener.", { audioText: "そのかばんはメアリーさんのです。" }),
        tiles("name-far-bike", "Production", "Far from both", "Say: “That bicycle over there is 25,000 yen.”", "Build the statement.", ["あの", "じてんしゃは", "にまんごせんえん", "です。"], ["あれ", "その", "どれ"], "あの じてんしゃは にまんごせんえんです。", "あの modifies a named object that is far from both people."),
        choice("name-which-student", "Grammar", "Question word + が", "Several students are visible in a picture.", "Which question correctly asks ‘Which student is Japanese?’", ["どの がくせいが にほんじんですか。", "どの がくせいは にほんじんですか。", "どれ がくせいが にほんじんですか。", "どこ がくせいが にほんじんですか。"], 0, "どの がくせいが にほんじんですか。", "どの needs a noun, and question words use が rather than topic は in this pattern.", { audioText: "どのがくせいがにほんじんですか。" }),
        choice("name-person", "Culture", "Point to people politely", "Your friend Mary is standing beside you. You introduce her.", "Which phrasing is appropriate?", ["こちらは ともだちの メアリーさんです。", "これは ともだちの メアリーさんです。", "あれは メアリーさんです。", "どれは メアリーさんです。"], 0, "こちらは ともだちの メアリーさんです。", "Avoid pointing at a present person with これ／それ／あれ. こちら is a polite person-oriented expression.", { audioText: "こちらはともだちのメアリーさんです。" })
      ]
    },
    {
      id: "prices", title: "Hear and build prices", short: "Hundreds, thousands, and まん", outcome: "Understand common prices and produce the irregular readings accurately.",
      activities: [
        {
          id: "price-map", type: "teach", skill: "Prices", kicker: "Scene 3 · read the price tags", title: "The difficult prices change sound",
          instruction: "Build the number in groups, then add えん. Concentrate on the five sound changes that appear often while shopping.",
          body: `<div class="lesson-price-grid"><div><span>¥300</span><strong>さんびゃくえん</strong></div><div><span>¥600</span><strong>ろっぴゃくえん</strong></div><div><span>¥800</span><strong>はっぴゃくえん</strong></div><div><span>¥3,000</span><strong>さんぜんえん</strong></div><div><span>¥8,000</span><strong>はっせんえん</strong></div><div><span>¥20,000</span><strong>にまんえん</strong></div></div><div class="lesson-rule"><strong>Large-number rule:</strong> Japanese groups by 10,000. 20,000 is にまん; 35,000 is さんまんごせん.</div>`,
          audioText: "さんびゃくえん。ろっぴゃくえん。はっぴゃくえん。さんぜんえん。はっせんえん。にまんえん。"
        },
        input("price-800", "Listening", "Hear the tag", "What price did the shopkeeper say?", "Listen and type digits.", ["800", "¥800"], "¥800 · はっぴゃくえん", "800 uses the changed reading はっぴゃく.", "はっぴゃくえんです。", { inputMode: "text", placeholder: "¥___" }),
        choice("price-3000", "Prices", "Choose the changed sound", "The price tag says ¥3,000.", "Which reading is standard?", ["さんぜんえん", "さんせんえん", "みっせんえん", "さんびゃくえん"], 0, "さんぜんえん", "3,000 changes せん to ぜん.", { audioText: "さんぜんえんです。" }),
        input("price-34000", "Listening", "Cross まん", "Enter the complete price.", "Listen and type digits.", ["34000", "34,000", "¥34000", "¥34,000"], "¥34,000 · さんまんよんせんえん", "さんまん is 30,000; よんせん adds 4,000.", "さんまんよんせんえんです。", { inputMode: "text", placeholder: "¥__,___" }),
        tiles("price-say-12500", "Production", "Build a price", "Say: “It is 12,500 yen.”", "Build the Japanese amount.", ["いちまん", "にせん", "ごひゃくえん", "です。"], ["じゅうに", "ごせん", "まん"], "いちまん にせん ごひゃくえんです。", "12,500 is one まん, two せん, and five ひゃく."),
        choice("price-culture", "Culture", "Use current knowledge carefully", "What is the durable lesson from the currency note?", "Choose the useful generalization.", ["Japanese money uses yen, and cash may still be useful in smaller shops.", "Every Japanese shop accepts only cash.", "All Japanese banknotes always show the same portraits.", "One yen equals one dollar."], 0, "Japanese money uses yen, and cash may still be useful in smaller shops.", "Payment habits and banknote designs can change; the denomination and practical cash lesson are the durable parts.")
      ]
    },
    {
      id: "shop", title: "Buy something", short: "Ask, react, and choose", outcome: "Complete a short purchase instead of producing isolated price sentences.",
      activities: [
        {
          id: "shop-model", type: "teach", skill: "Conversation", kicker: "Scene 4 · flea-market exchange", title: "Turn the number into a purchase",
          instruction: "Learn the exchange as connected actions: enter politely, ask, react, select.",
          body: `<div class="lesson-dialogue-card"><div><span>Customer</span><strong>すみません。この かさは いくらですか。</strong></div><div><span>Vendor</span><strong>せんにひゃくえんです。</strong></div><div><span>Customer</span><strong>そうですか。じゃあ、その かさを ください。</strong></div></div><div class="lesson-model"><div class="lesson-model-row"><span>Ask</span><strong>X は いくらですか。</strong></div><div class="lesson-model-row"><span>Request an item</span><strong>X を ください。</strong></div><div class="lesson-model-row"><span>Polite request/order</span><strong>X を おねがいします。</strong></div><div class="lesson-model-row"><span>Offer</span><strong>X を どうぞ。</strong></div></div>`,
          audioText: "すみません。このかさはいくらですか。せんにひゃくえんです。そうですか。じゃあ、そのかさをください。"
        },
        tiles("shop-ask", "Production", "Open and ask", "Ask the vendor how much this hat is.", "Build the customer’s question.", ["すみません。", "この", "ぼうしは", "いくら", "です", "か。"], ["どこ", "だれの", "よ。"], "すみません。この ぼうしは いくらですか。", "すみません gets attention; この modifies ぼうし; いくら asks the price."),
        choice("shop-hear", "Listening", "Understand the answer", "What price did the vendor give?", "Listen before choosing.", ["¥3,500", "¥3,050", "¥8,500", "¥35,000"], 0, "¥3,500 · さんぜんごひゃくえん", "さんぜん is 3,000 and ごひゃく is 500.", { listenOnly: true, audioText: "さんぜんごひゃくえんです。" }),
        choice("shop-react", "Conversation", "React naturally", "The watch costs more than you expected.", "Which brief reaction fits?", ["たかいですね。", "おいしいですね。", "あそこです。", "わたしのです。"], 0, "たかいですね。", "たかい comments on the price; ね invites shared recognition.", { audioText: "たかいですね。" }),
        tiles("shop-buy", "Conversation", "Choose the item", "Tell the vendor: “Then, please give me that watch.”", "The watch is near the vendor.", ["じゃあ、", "その", "とけいを", "ください。"], ["これ", "どこ", "ですか。"], "じゃあ、その とけいを ください。", "その modifies the watch near the listener; を marks the requested item."),
        choice("shop-offer", "Conversation", "Request or offer", "The vendor is handing a bag to the customer.", "What does the vendor say?", ["かばんを どうぞ。", "かばんを ください。", "かばんを おねがいします。", "かばんは どこですか。"], 0, "かばんを どうぞ。", "どうぞ accompanies an offer or something being handed over.", { audioText: "かばんをどうぞ。" })
      ]
    },
    {
      id: "places", title: "Find what you need", short: "ここ・そこ・あそこ・どこ", outcome: "Ask where places and objects are and answer from the current viewpoint.",
      activities: [
        {
          id: "place-map", type: "teach", skill: "Spatial", kicker: "Scene 5 · around the station", title: "The same distance map works for places",
          instruction: "Use ここ, そこ, and あそこ as complete place words.",
          body: `<div class="lesson-location-strip"><div><strong>ここ</strong><span>here, by me</span></div><div><strong>そこ</strong><span>there, by you</span></div><div><strong>あそこ</strong><span>over there</span></div><div><strong>どこ</strong><span>where?</span></div></div><div class="lesson-dialogue-card"><div><span>Visitor</span><strong>すみません。ゆうびんきょくは どこですか。</strong></div><div><span>Local person</span><strong>あそこです。</strong></div><div><span>Visitor</span><strong>ありがとうございます。</strong></div></div>`,
          audioText: "すみません。ゆうびんきょくはどこですか。あそこです。ありがとうございます。"
        },
        tiles("place-ask", "Production", "Ask for a place", "Ask: “Where is the bank?”", "Build the polite question.", ["すみません。", "ぎんこうは", "どこ", "です", "か。"], ["どれ", "いくら", "だれ"], "すみません。ぎんこうは どこですか。", "The place is the topic, and どこ asks for its location."),
        choice("place-near-me", "Spatial", "Answer from your position", "You are standing beside the library.", "How do you answer ‘Where is the library?’", ["ここです。", "そこです。", "あそこです。", "どれです。"], 0, "ここです。", "ここ identifies the place near the speaker."),
        choice("place-near-you", "Spatial", "Across the counter", "The restroom is beside the restaurant worker you are asking.", "What answer does the worker give?", ["ここです。", "そこです。", "あそこです。", "どこです。"], 0, "ここです。", "The worker is speaking, so the place beside the worker is ここ from that speaker’s viewpoint."),
        choice("place-far", "Listening", "Follow the pointing answer", "Where did the speaker say the convenience store is?", "Listen and choose.", ["Over there, away from both people", "Here by the speaker", "There by the listener", "The speaker does not know"], 0, "あそこ · over there", "あそこ locates it away from both people.", { listenOnly: true, audioText: "コンビニはあそこですよ。" }),
        tiles("place-book", "Production", "Find an object", "Ask where the English book is.", "Build the question.", ["えいごの", "ほんは", "どこ", "です", "か。"], ["どの", "だれの", "いくら"], "えいごの ほんは どこですか。", "Location words can locate objects as well as buildings.")
      ]
    },
    {
      id: "belong", title: "Return what belongs to someone", short: "だれの・も・noun negation", outcome: "Ask ownership, correct a wrong guess, and connect matching facts.",
      activities: [
        {
          id: "belong-model", type: "teach", skill: "Ownership", kicker: "Scene 6 · a lost wallet", title: "Ask, correct, and connect facts",
          instruction: "These three patterns make a useful lost-property conversation.",
          body: `<div class="lesson-dialogue-card"><div><span>Stranger</span><strong>これは だれの さいふですか。</strong></div><div><span>Mary</span><strong>わたしの さいふです。</strong></div></div><div class="lesson-model"><div class="lesson-model-row"><span>Whose?</span><strong>だれの + noun</strong></div><div class="lesson-model-row"><span>Not a noun</span><strong>noun じゃないです</strong></div><div class="lesson-model-row"><span>Also</span><strong>parallel topic + も</strong></div></div><div class="lesson-rule"><strong>Scope matters:</strong> も replaces は on the item that shares the fact. The noun must remain before じゃないです in a negative answer.</div>`,
          audioText: "これはだれのさいふですか。わたしのさいふです。"
        },
        tiles("belong-ask", "Ownership", "Ask ownership", "Ask: “Whose umbrella is this?”", "Build the question.", ["これは", "だれの", "かさ", "です", "か。"], ["どこの", "いくら", "も"], "これは だれの かさですか。", "だれの directly modifies the owned noun かさ."),
        choice("belong-mine", "Grammar", "Omit the repeated noun", "Someone asks: これは だれの さいふですか。 It is yours.", "Which short answer is natural?", ["わたしのです。", "わたしです。", "だれのです。", "わたしもです。"], 0, "わたしのです。", "の can stand for the already-understood owned object: ‘mine.’", { audioText: "わたしのです。" }),
        tiles("belong-negative", "Production", "Correct a guess", "Say: “It is not Takeshi’s bag. It is Mary’s bag.”", "Build the correction.", ["たけしさんの", "かばんじゃないです。", "メアリーさんの", "かばんです。"], ["かばんは", "も", "どこ"], "たけしさんの かばんじゃないです。メアリーさんの かばんです。", "Keep the noun before じゃないです, then supply the correct owner."),
        choice("belong-negative-form", "Grammar", "Choose noun negation", "Yamada is not a student.", "Which sentence uses the Lesson 2 pattern correctly?", ["やまださんは がくせいじゃないです。", "やまださんは じゃないです。", "やまださんは がくせいですじゃない。", "やまださんも がくせいです。"], 0, "やまださんは がくせいじゃないです。", "じゃないです follows the noun being negated.", { audioText: "やまださんはがくせいじゃないです。" }),
        choice("belong-adjective-trap", "Grammar", "Keep the boundary clear", "Nouns and adjectives behave differently.", "Which sentence should you avoid producing with this noun-negation rule?", ["この とけいは たかいじゃないです。", "これは にくじゃないです。", "メアリーさんは にほんじんじゃないです。", "これは わたしの かばんじゃないです。"], 0, "Avoid: この とけいは たかいじゃないです。", "たかい is an い-adjective. Its negative is taught later; this noun rule cannot be transferred to it."),
        tiles("belong-mo", "Production", "Share the same fact", "Takeshi is Japanese. Say: “Yui is Japanese, too.”", "Build the second sentence.", ["ゆいさんも", "にほんじん", "です。"], ["ゆいさんは", "じゃない", "どれ"], "ゆいさんも にほんじんです。", "も replaces は after the second person, who shares the same description.")
      ]
    },
    {
      id: "stance", title: "Share or supply information", short: "ね and よ", outcome: "Choose ね when seeking shared agreement and よ when supplying information.",
      activities: [
        {
          id: "stance-model", type: "teach", skill: "Conversation", kicker: "Scene 7 · what does the listener know?", title: "The ending shows your stance",
          instruction: "Decide whether you want the listener to agree or whether you are giving the listener useful information.",
          body: `<div class="lesson-contrast-board"><div><span>Shared view</span><strong>たかいですね。</strong><small>Expensive, isn't it?</small></div><div><span>New assurance</span><strong>おいしいですよ。</strong><small>It is delicious, I assure you.</small></div></div><div class="lesson-rule"><strong>Choose from context:</strong> ね reaches toward the listener for confirmation. よ pushes information toward the listener.</div>`,
          audioText: "たかいですね。おいしいですよ。"
        },
        choice("stance-ne", "Conversation", "Invite agreement", "You and your friend both see a ¥68,000 computer.", "Complete: たかいです__", ["ね。", "よ。", "か。", "も。"], 0, "たかいですね。", "Both people can see the high price, so ね invites agreement.", { audioText: "たかいですね。" }),
        choice("stance-yo", "Conversation", "Supply information", "Your friend thinks tonkatsu may be fish. You know it is meat.", "Complete: とんかつは にくです__", ["よ。", "ね。", "か。", "の。"], 0, "とんかつは にくですよ。", "よ marks this as information the listener should take in.", { audioText: "とんかつはにくですよ。" }),
        choice("stance-listen", "Listening", "Hear the speaker’s stance", "What is the speaker doing?", "Listen and choose.", ["Seeking agreement about the price", "Strongly correcting the listener", "Asking whose item it is", "Offering the item"], 0, "たかいですね。 · seeking agreement", "The final ね invites the listener to share the observation.", { listenOnly: true, audioText: "このかばんはたかいですね。" }),
        tiles("stance-build", "Production", "Reassure the customer", "Say: “This ramen is delicious, I assure you.”", "Build the statement.", ["この", "ラーメンは", "おいしいです", "よ。"], ["ね。", "どこ", "じゃないです"], "この ラーメンは おいしいですよ。", "The worker is supplying useful information, so よ fits the interaction.")
      ]
    },
    {
      id: "restaurant", title: "Order lunch", short: "Menu, food, and polite requests", outcome: "Understand a short restaurant exchange and place an order politely.",
      activities: [
        {
          id: "restaurant-model", type: "teach", skill: "Conversation", kicker: "Scene 8 · lunch", title: "Follow the whole restaurant exchange",
          instruction: "Listen for each person’s job: welcome, offer, ask, clarify, correct, and order.",
          body: `<div class="lesson-dialogue-card restaurant"><div><span>Staff</span><strong>いらっしゃいませ。メニューを どうぞ。</strong></div><div><span>Customer</span><strong>どうも。これは なんですか。</strong></div><div><span>Staff</span><strong>どれですか。ああ、とんかつです。</strong></div><div><span>Customer</span><strong>さかなですか。</strong></div><div><span>Staff</span><strong>いいえ、さかなじゃないです。にくです。おいしいですよ。</strong></div><div><span>Customer</span><strong>じゃあ、これを おねがいします。</strong></div></div><div class="lesson-menu-strip"><span>ていしょく</span><span>カレー</span><span>うどん</span><span>ラーメン</span><span>サンドイッチ</span><span>コーヒー</span></div>`,
          audioText: "いらっしゃいませ。メニューをどうぞ。どうも。これはなんですか。どれですか。ああ、とんかつです。さかなですか。いいえ、さかなじゃないです。にくです。おいしいですよ。じゃあ、これをおねがいします。"
        },
        choice("restaurant-welcome", "Listening", "Enter the restaurant", "What did the staff member say?", "Listen and choose the conversational job.", ["Welcoming a customer", "Asking the price", "Saying goodbye", "Requesting the menu"], 0, "いらっしゃいませ。 · welcoming a customer", "Shop and restaurant staff use いらっしゃいませ to welcome customers.", { listenOnly: true, audioText: "いらっしゃいませ。" }),
        choice("restaurant-offer", "Conversation", "Receive the menu", "The staff member hands you the menu.", "Which phrase belongs to the staff member?", ["メニューを どうぞ。", "メニューを ください。", "メニューを おねがいします。", "メニューは どこですか。"], 0, "メニューを どうぞ。", "どうぞ accompanies the offered menu.", { audioText: "メニューをどうぞ。" }),
        tiles("restaurant-what", "Production", "Ask about a dish", "Point to a dish and ask: “What is this?”", "Build the question.", ["これは", "なん", "です", "か。"], ["どこ", "いくら", "だれの"], "これは なんですか。", "なん asks the identity of the thing you are pointing to."),
        choice("restaurant-correct", "Listening", "Understand the correction", "What did the staff member explain?", "Listen and choose.", ["It is not fish; it is meat.", "It is not meat; it is fish.", "It is expensive.", "It belongs to Mary."], 0, "さかなじゃないです。にくです。", "The negative removes the incorrect category; the next sentence supplies the correct one.", { listenOnly: true, audioText: "いいえ、さかなじゃないです。にくです。" }),
        tiles("restaurant-order", "Conversation", "Place the order", "Say: “Then, I will have this, please.”", "Build the restaurant order.", ["じゃあ、", "これを", "おねがいします。"], ["くださいです。", "どこですか。", "も"], "じゃあ、これを おねがいします。", "おねがいします is a natural polite choice for ordering food."),
        choice("restaurant-menu", "Vocabulary", "Read the menu", "Choose a complete meal.", "Which word means ‘set meal’?", ["ていしょく", "としょかん", "じてんしゃ", "けいざい"], 0, "ていしょく · set meal", "ていしょく refers to a set meal, typically served as a coordinated group of dishes.")
      ]
    },
    {
      id: "classroom", title: "Keep the lesson moving", short: "Classroom objects and repair phrases", outcome: "Name essential classroom objects and ask for repetition, time, or clarification.",
      activities: [
        {
          id: "classroom-model", type: "teach", skill: "Classroom", kicker: "Scene 9 · classroom survival", title: "Use Japanese when communication breaks down",
          instruction: "These are complete actions you can use immediately in a Japanese class.",
          body: `<div class="lesson-classroom-grid"><span>こくばん<small>blackboard</small></span><span>つくえ<small>desk</small></span><span>けしゴム<small>eraser</small></span><span>えんぴつ<small>pencil</small></span><span>じしょ<small>dictionary</small></span><span>まど<small>window</small></span><span>いす<small>chair</small></span><span>ドア<small>door</small></span></div><div class="lesson-model"><div class="lesson-model-row"><span>I don’t understand</span><strong>わかりません。</strong></div><div class="lesson-model-row"><span>Please say it slowly</span><strong>ゆっくり いってください。</strong></div><div class="lesson-model-row"><span>Please say it again</span><strong>もういちど いってください。</strong></div><div class="lesson-model-row"><span>Please wait a moment</span><strong>ちょっと まってください。</strong></div></div>`,
          audioText: "わかりません。ゆっくりいってください。もういちどいってください。ちょっとまってください。"
        },
        choice("classroom-object", "Vocabulary", "Name the object", "You need to look up a new word.", "Which word means ‘dictionary’?", ["じしょ", "しんぶん", "さいふ", "メニュー"], 0, "じしょ · dictionary", "じしょ is the classroom word for a dictionary."),
        choice("classroom-understand", "Conversation", "Answer honestly", "The teacher asks: わかりましたか。 You did not understand.", "How do you respond?", ["わかりません。", "わかりました。", "どうぞ。", "いらっしゃいませ。"], 0, "わかりません。", "わかりません means ‘I don’t understand’ or ‘I don’t know.’", { audioText: "わかりません。" }),
        tiles("classroom-again", "Production", "Repair the conversation", "Ask the teacher to say it again.", "Build the request.", ["もういちど", "いって", "ください。"], ["ゆっくり", "みて", "どこ"], "もういちど いってください。", "もういちど means one more time; いってください asks someone to say it."),
        choice("classroom-listen", "Listening", "Follow an instruction", "What does the teacher ask you to do?", "Listen and choose.", ["Look at page 10", "Wait ten minutes", "Write ten pages", "Ask where page 10 is"], 0, "10ページを みてください。", "ページをみてください asks learners to look at a page.", { listenOnly: true, audioText: "じゅっページをみてください。" })
      ]
    },
    {
      id: "mission", title: "Complete a day out", short: "Shop, recover a wallet, and order lunch", outcome: "Carry the lesson through linked conversations with less support.",
      activities: [
        {
          id: "mission-brief", type: "teach", skill: "Mission", kicker: "Final route", title: "One afternoon, three conversations",
          instruction: "Recall the Japanese before using the choices or tiles. The scenes now mix ideas from the whole lesson.",
          body: `<div class="lesson-route"><div><span>1</span><strong>Flea market</strong><small>ask → hear → choose</small></div><i aria-hidden="true">→</i><div><span>2</span><strong>Lost wallet</strong><small>ask → correct ownership</small></div><i aria-hidden="true">→</i><div><span>3</span><strong>Restaurant</strong><small>ask → understand → order</small></div></div><div class="lesson-rule"><strong>Your goal:</strong> complete the social job, not merely translate each line.</div>`,
          audioText: "すみません。このとけいはいくらですか。これはだれのさいふですか。じゃあ、これをおねがいします。"
        },
        tiles("mission-price", "Production", "Mission · shop", "At the flea market, ask how much that bicycle over there costs.", "Build the question.", ["すみません。", "あの", "じてんしゃは", "いくら", "です", "か。"], ["あれ", "どこ", "だれの"], "すみません。あの じてんしゃは いくらですか。", "The named bicycle is far from both people, so use あの before じてんしゃ."),
        input("mission-hear-price", "Listening", "Mission · price", "Type the bicycle’s price.", "Listen carefully for まん and せん.", ["36000", "36,000", "¥36000", "¥36,000"], "¥36,000 · さんまんろくせんえん", "さんまん supplies 30,000 and ろくせん supplies 6,000.", "さんまんろくせんえんです。", { placeholder: "¥__,___" }),
        tiles("mission-wallet", "Ownership", "Mission · lost property", "You find a wallet. Ask whose it is.", "Build the complete question.", ["これは", "だれの", "さいふ", "です", "か。"], ["どれ", "いくら", "も"], "これは だれの さいふですか。", "だれの modifies the object whose owner is unknown."),
        choice("mission-correct", "Grammar", "Mission · correct the guess", "Someone asks: たけしさんの さいふですか。 It belongs to Mary.", "Which answer is clearest?", ["いいえ、たけしさんの さいふじゃないです。メアリーさんのです。", "はい、たけしさんも さいふです。", "いいえ、じゃないです。", "メアリーさんは どこですか。"], 0, "いいえ、たけしさんの さいふじゃないです。メアリーさんのです。", "The answer retains the negated noun, then uses の to stand for the known wallet.", { audioText: "いいえ、たけしさんのさいふじゃないです。メアリーさんのです。" }),
        choice("mission-menu", "Listening", "Mission · restaurant", "The staff hands you something. What was offered?", "Listen and choose.", ["The menu", "A wallet", "A bicycle", "The bill"], 0, "メニューを どうぞ。 · Here is the menu.", "The object before を is the thing being offered.", { listenOnly: true, audioText: "いらっしゃいませ。メニューをどうぞ。" }),
        tiles("mission-order", "Conversation", "Mission · order", "Order the tonkatsu after learning that it is meat and delicious.", "Build a natural final response.", ["そうですか。", "じゃあ、", "とんかつを", "おねがいします。"], ["どこですか。", "じゃないです。", "も"], "そうですか。じゃあ、とんかつを おねがいします。", "そうですか acknowledges the explanation; じゃあ moves to the decision; おねがいします places the order.")
      ]
    }
  ];

  const STAGE_WRAPUPS = [
    { challenge: "Switch viewpoints without moving the objects.", turns: [["You", "これは ノートです。"], ["Shopkeeper", "それは ノートですね。"]] },
    { challenge: "Ask which specific book is Japanese.", turns: [["You", "どの ほんが にほんごの ほんですか。"], ["Friend", "その ほんです。"]] },
    { challenge: "Ask and answer the price of an ¥8,000 wallet.", turns: [["You", "この さいふは いくらですか。"], ["Vendor", "はっせんえんです。"]] },
    { challenge: "Buy the umbrella beside the vendor.", turns: [["You", "その かさは いくらですか。"], ["Vendor", "せんにひゃくえんです。"], ["You", "じゃあ、その かさを ください。"]], coreMilestone: true },
    { challenge: "Ask where the post office is and thank the person who answers.", turns: [["You", "ゆうびんきょくは どこですか。"], ["Local person", "あそこです。"], ["You", "ありがとうございます。"]] },
    { challenge: "Ask whose wallet it is, then correct the first guess.", turns: [["You", "これは だれの さいふですか。"], ["Friend", "たけしさんのですか。"], ["You", "いいえ、たけしさんのじゃないです。メアリーさんのです。"]] },
    { challenge: "Use ね for shared knowledge and よ for useful new information.", turns: [["Customer", "たかいですね。"], ["Staff", "でも、おいしいですよ。"]] },
    { challenge: "Order a dish and ask where the restroom is.", turns: [["You", "これを おねがいします。"], ["You", "すみません。トイレは どこですか。"], ["Staff", "あそこですよ。"]], coreMilestone: true },
    { challenge: "Ask for repetition entirely in Japanese.", turns: [["Teacher", "わかりましたか。"], ["You", "わかりません。もういちど いってください。"]] },
    { challenge: "Repeat the three key conversations without looking at the models.", turns: [["You", "この とけいは いくらですか。"], ["You", "これは だれの さいふですか。"], ["You", "じゃあ、とんかつを おねがいします。"]] }
  ];

  const ANSWER_BREAKDOWNS = {
    "point-switch": [["それ", "that one · near the listener"], ["は", "topic marker"], ["ノート", "notebook"], ["です", "is · polite ending"]],
    "name-this-watch": [["この", "this · must modify a noun"], ["とけい", "watch"], ["は", "topic marker"], ["いくら", "how much"], ["ですか", "is it? · polite question"]],
    "name-which-student": [["どの", "which · before a noun"], ["がくせい", "student"], ["が", "marks the unknown subject"], ["にほんじん", "Japanese person"], ["ですか", "is? · polite question"]],
    "price-800": [["はっぴゃく", "800 · changed sound"], ["えん", "yen"]],
    "price-34000": [["さんまん", "30,000"], ["よんせん", "4,000"], ["えん", "yen"]],
    "shop-ask": [["すみません", "excuse me"], ["この", "this · before a noun"], ["ぼうし", "hat"], ["いくら", "how much"], ["ですか", "is it? · polite question"]],
    "shop-buy": [["じゃあ", "then"], ["その", "that · near the listener"], ["とけい", "watch"], ["を", "object marker"], ["ください", "please give me"]],
    "place-ask": [["ぎんこう", "bank"], ["は", "topic marker"], ["どこ", "where"], ["ですか", "is it? · polite question"]],
    "belong-ask": [["これ", "this one"], ["は", "topic marker"], ["だれ", "who"], ["の", "whose · possession"], ["かさ", "umbrella"], ["ですか", "is it? · polite question"]],
    "belong-mo": [["ゆいさん", "Yui"], ["も", "also · replaces は"], ["にほんじん", "Japanese person"], ["です", "is · polite ending"]],
    "stance-build": [["この", "this · before a noun"], ["ラーメン", "ramen"], ["おいしい", "delicious"], ["です", "polite ending"], ["よ", "supplies information"]],
    "restaurant-order": [["じゃあ", "then"], ["これ", "this one"], ["を", "object marker"], ["おねがいします", "please · polite order"]],
    "classroom-again": [["もういちど", "one more time"], ["いって", "say"], ["ください", "please"]],
    "mission-order": [["そうですか", "I see"], ["じゃあ", "then"], ["とんかつ", "pork cutlet"], ["を", "object marker"], ["おねがいします", "I will have …, please"]]
  };

  const GUIDE_BREAKDOWNS = {};

  const practiceChoice = (key, title, prompt, options, correction, explanation, audioText = "", extras = {}) => ({
    key, type: "choice", title, prompt, options, answer: 0, correction, explanation,
    audioText: audioText || correction, audioRole: extras.listenOnly ? "prompt" : "feedback", ...extras
  });
  const practiceTiles = (key, title, prompt, answer, distractors, correction, explanation) => ({
    key, type: "tiles", title, prompt, tokens: answer, answer, distractors, correction, explanation,
    audioText: correction, audioRole: "feedback"
  });
  const practiceInput = (key, title, prompt, answers, correction, explanation, audioText, placeholder = "Type digits") => ({
    key, type: "input", title, prompt, answers, correction, explanation, audioText, placeholder, inputMode: "text", audioRole: "prompt"
  });

  const PRACTICE_FAMILIES = {
    point: [
      practiceChoice("pen-by-friend", "A pen is beside your friend.", "Which word points to it from your position?", ["それ", "これ", "あれ", "どれ"], "それ", "The pen is near the listener."),
      practiceChoice("hat-across-room", "A hat is across the room from both of you.", "Which word points to it?", ["あれ", "それ", "これ", "どれ"], "あれ", "The hat is far from both people."),
      practiceChoice("friend-points-phone", "You are holding a phone.", "What does your friend call it?", ["それ", "これ", "あれ", "どれ"], "それ", "For your friend, the phone is near the listener—you.")
    ],
    name: [
      practiceTiles("this-book", "Ask how much this book is.", "Build the question.", ["この", "ほんは", "いくら", "です", "か。"], ["これ", "どこ", "も"], "この ほんは いくらですか。", "この must be followed by ほん."),
      practiceChoice("far-student", "A student stands far from both speakers.", "Complete: ___ がくせいは りゅうがくせいです。", ["あの", "あれ", "その", "どれ"], "あの がくせいは りゅうがくせいです。", "あの modifies the distant student."),
      practiceChoice("which-bike", "Several bicycles are parked outside.", "How do you begin ‘Which bicycle …?’", ["どの じてんしゃ", "どれ じてんしゃ", "どこ じてんしゃ", "この どれ"], "どの じてんしゃ", "どの must be followed by the noun it selects.")
    ],
    prices: [
      practiceInput("hear-600", "Enter the price you hear.", "Type digits.", ["600", "¥600"], "¥600 · ろっぴゃくえん", "600 has the changed reading ろっぴゃく.", "ろっぴゃくえんです。", "¥___"),
      practiceInput("hear-8900", "Enter the price you hear.", "Type digits.", ["8900", "8,900", "¥8900", "¥8,900"], "¥8,900 · はっせんきゅうひゃくえん", "Combine はっせん and きゅうひゃく.", "はっせんきゅうひゃくえんです。", "¥_,___"),
      practiceInput("hear-25000", "Enter the price you hear.", "Type digits.", ["25000", "25,000", "¥25000", "¥25,000"], "¥25,000 · にまんごせんえん", "にまん is 20,000 and ごせん is 5,000.", "にまんごせんえんです。", "¥__,___")
    ],
    shop: [
      practiceTiles("buy-hat", "Ask for that hat beside the vendor.", "Build the request.", ["その", "ぼうしを", "ください。"], ["それ", "どこ", "ですか。"], "その ぼうしを ください。", "その must modify the named item ぼうし."),
      practiceChoice("offer-watch", "A vendor hands you a watch.", "What does the vendor say?", ["とけいを どうぞ。", "とけいを ください。", "とけいは どこですか。", "とけいも です。"], "とけいを どうぞ。", "どうぞ offers the item."),
      practiceChoice("react-price", "A notebook costs ¥10,000.", "Choose a natural reaction.", ["たかいですね。", "おいしいですね。", "わたしのです。", "あそこです。"], "たかいですね。", "たかい comments on the high price; ね invites agreement.")
    ],
    places: [
      practiceTiles("ask-library", "Ask where the library is.", "Build the question.", ["としょかんは", "どこ", "です", "か。"], ["どれ", "いくら", "だれ"], "としょかんは どこですか。", "どこ asks a location."),
      practiceChoice("bank-far", "The bank is across the street from both people.", "How does the speaker answer?", ["あそこです。", "ここです。", "そこです。", "どれです。"], "あそこです。", "あそこ means over there, far from both."),
      practiceChoice("toilet-by-listener", "The restroom is beside the listener.", "What does the speaker say?", ["そこです。", "ここです。", "あそこです。", "どこです。"], "そこです。", "そこ marks a place near the listener.")
    ],
    belong: [
      practiceTiles("whose-phone", "Ask whose smartphone this is.", "Build the question.", ["これは", "だれの", "スマホ", "です", "か。"], ["どこ", "いくら", "も"], "これは だれの スマホですか。", "だれの modifies スマホ."),
      practiceChoice("not-korean", "Mary is not Korean.", "Choose the correct noun-negative sentence.", ["メアリーさんは かんこくじんじゃないです。", "メアリーさんは じゃないです。", "メアリーさんも かんこくじんです。", "メアリーさんの かんこくじんです。"], "メアリーさんは かんこくじんじゃないです。", "The noun remains directly before じゃないです."),
      practiceTiles("also-student", "Mary is a student. Say Takeshi is a student, too.", "Build the second statement.", ["たけしさんも", "がくせい", "です。"], ["たけしさんは", "じゃない", "どこ"], "たけしさんも がくせいです。", "も replaces は on the parallel person.")
    ],
    stance: [
      practiceChoice("shared-cold", "Both people know the classroom is cold.", "Which ending invites agreement?", ["さむいですね。", "さむいですよ。", "さむいですか。", "さむいのです。"], "さむいですね。", "ね invites a shared response."),
      practiceChoice("inform-british", "The listener does not know Smith’s nationality.", "Which sentence supplies the information?", ["スミスさんは イギリスじんですよ。", "スミスさんは イギリスじんですね。", "スミスさんは どこですか。", "スミスさんもです。"], "スミスさんは イギリスじんですよ。", "よ presents the useful information."),
      practiceChoice("hear-stance", "What is the speaker doing?", "Listen and choose.", ["Reassuring the listener that it is delicious", "Asking for agreement", "Asking the price", "Negating the dish"], "Reassuring the listener that it is delicious", "よ supplies confident information.", "おいしいですよ。", { listenOnly: true })
    ],
    restaurant: [
      practiceTiles("order-curry", "Order the curry politely.", "Build your line.", ["カレーを", "おねがいします。"], ["どうぞ。", "どこですか。", "じゃないです。"], "カレーを おねがいします。", "おねがいします is natural for a restaurant order."),
      practiceChoice("menu-offer", "The staff hands you a menu.", "Choose the staff member’s line.", ["メニューを どうぞ。", "メニューを ください。", "メニューは いくらですか。", "メニューじゃないです。"], "メニューを どうぞ。", "どうぞ offers the menu."),
      practiceChoice("dish-not-fish", "The dish is meat, not fish.", "Choose the clear correction.", ["さかなじゃないです。にくです。", "さかなも にくです。", "にくは どこですか。", "さかなを どうぞ。"], "さかなじゃないです。にくです。", "Negate the wrong noun, then supply the correct category.")
    ],
    classroom: [
      practiceTiles("say-slowly", "Ask the teacher to speak slowly.", "Build the request.", ["ゆっくり", "いって", "ください。"], ["もういちど", "みて", "どこ"], "ゆっくり いってください。", "ゆっくり describes how you want it said."),
      practiceChoice("dont-understand", "You did not understand the explanation.", "What do you say?", ["わかりません。", "わかりました。", "いらっしゃいませ。", "どうぞ。"], "わかりません。", "Use わかりません to report that you do not understand."),
      practiceChoice("eraser", "Which word means ‘eraser’?", "Choose the classroom object.", ["けしゴム", "えんぴつ", "じしょ", "まど"], "けしゴム · eraser", "けしゴム is an eraser.")
    ],
    mission: [
      practiceTiles("mission-new-shop", "Ask the price of this bag.", "Open politely and build the question.", ["すみません。", "この", "かばんは", "いくら", "です", "か。"], ["どこ", "だれの", "よ。"], "すみません。この かばんは いくらですか。", "Use この before the named item and いくら for the price."),
      practiceTiles("mission-new-owner", "Ask whose bicycle that is.", "Build the question.", ["あれは", "だれの", "じてんしゃ", "です", "か。"], ["どこ", "いくら", "も"], "あれは だれの じてんしゃですか。", "あれ stands alone for the distant thing; だれの asks its owner."),
      practiceTiles("mission-new-order", "Order ramen politely.", "Build the complete decision.", ["じゃあ、", "ラーメンを", "おねがいします。"], ["どこですか。", "どうぞ。", "じゃないです。"], "じゃあ、ラーメンを おねがいします。", "じゃあ marks the decision and おねがいします places the order.")
    ]
  };

  const PRACTICE_FAMILY_IDS = {
    point: ["point-near-me", "point-near-you", "point-far", "point-switch", "point-which"],
    name: ["name-this-watch", "name-that-bag", "name-far-bike", "name-which-student", "name-person"],
    prices: ["price-800", "price-3000", "price-34000", "price-say-12500", "price-culture"],
    shop: ["shop-ask", "shop-hear", "shop-react", "shop-buy", "shop-offer"],
    places: ["place-ask", "place-near-me", "place-near-you", "place-far", "place-book"],
    belong: ["belong-ask", "belong-mine", "belong-negative", "belong-negative-form", "belong-adjective-trap", "belong-mo"],
    stance: ["stance-ne", "stance-yo", "stance-listen", "stance-build"],
    restaurant: ["restaurant-welcome", "restaurant-offer", "restaurant-what", "restaurant-correct", "restaurant-order", "restaurant-menu"],
    classroom: ["classroom-object", "classroom-understand", "classroom-again", "classroom-listen"],
    mission: ["mission-price", "mission-hear-price", "mission-wallet", "mission-correct", "mission-menu", "mission-order"]
  };
  const PRACTICE_FAMILY_BY_ID = Object.fromEntries(Object.entries(PRACTICE_FAMILY_IDS).flatMap(([family, ids]) => ids.map(id => [id, family])));
  const PRACTICE_VARIANT_KEYS_BY_ID = {};

  window.GUIDED_LESSONS = window.GUIDED_LESSONS || {};
  window.GUIDED_LESSONS["2"] = {
    id: "2",
    number: 2,
    slug: "day-out",
    title: "A Day Out",
    headline: "Lesson 2 · A Day Out",
    subtitle: "Point to the right thing, understand prices, shop, find places, return a wallet, and order lunch.",
    journeyTitle: "Shopping day",
    available: true,
    foundation: {
      title: "Number foundation",
      copy: "This lesson concentrates on prices and the sound changes in hundreds and thousands. Use the Numbers page for broader number practice.",
      href: "../numbers.html",
      label: "Practise numbers"
    },
    storageKey: "kanaSprintGuidedLesson2V1",
    commonMistakeGuidance: COMMON_MISTAKE_GUIDANCE,
    choiceGlosses: CHOICE_GLOSSES,
    stages: STAGES,
    answerBreakdowns: ANSWER_BREAKDOWNS,
    guideBreakdowns: GUIDE_BREAKDOWNS,
    stageWrapups: STAGE_WRAPUPS,
    practiceFamilies: PRACTICE_FAMILIES,
    practiceFamilyIds: PRACTICE_FAMILY_IDS,
    practiceFamilyById: PRACTICE_FAMILY_BY_ID,
    practiceVariantKeysById: PRACTICE_VARIANT_KEYS_BY_ID
  };
})();
