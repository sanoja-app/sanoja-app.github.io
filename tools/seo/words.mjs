// Content for the "X in Finnish" pages under docs/words/. Built by build.mjs.
//
// Authoring notes
// - [[text]] marks Finnish text; the builder renders it as <span lang="fi" class="fi">.
// - Everything here should be something a Finnish teacher would sign off on. When
//   unsure about a form or a usage claim, leave it out rather than guess.
// - `respell` is a rough English-speaker's guide, not IPA. Stress in Finnish is
//   always on the first syllable of a word.

export const CATEGORIES = [
  { id: "greetings", name: "Greetings and politeness" },
  { id: "getting-by", name: "Getting by in Finnish" },
  { id: "life", name: "Life in Finland" },
  { id: "everyday", name: "Everyday words" },
  { id: "basics", name: "Basics" },
];

export const WORDS = [
  // ───────────────────────── Greetings and politeness ─────────────────────────
  {
    slug: "thank-you-in-finnish",
    cat: "greetings",
    h1: `How to say "thank you" in Finnish`,
    tag: `Thank you in Finnish: kiitos (meaning and examples)`,
    desc: `"Thank you" in Finnish is kiitos. How to say it, how to reply, the casual version, and why kiitos can also mean "please", with example sentences.`,
    word: "kiitos",
    respell: "KEE-tos",
    answer: `[[Kiitos]] means "thank you". Add [[paljon]] for "thank you very much": [[kiitos paljon]].`,
    body: [
      { h: "Using kiitos" },
      { p: `[[Kiitos]] works in almost every situation, from a shop till to a formal letter. Say it with a long "ee" and put the stress on the first syllable.` },
      { p: `It is also the everyday word for "please" when you are asking for something. Finnish has no exact equivalent of English "please", so you put [[kiitos]] at the end of the request: [[Kahvi, kiitos.]] ("A coffee, please.")` },
      { h: "Ways to say thank you" },
      {
        table: {
          head: ["Finnish", "English", "When"],
          rows: [
            ["[[kiitos]]", "thank you / thanks", "Any situation"],
            ["[[kiitos paljon]]", "thank you very much", "Any situation"],
            ["[[kiitti]]", "thanks", "Casual, with friends"],
            ["[[kiitos avusta]]", "thanks for the help", "After someone helps you"],
            ["[[kiitos samoin]]", "thanks, same to you", "Replying to a good wish"],
          ],
        },
      },
      { h: "How to reply" },
      { p: `The usual reply is [[ole hyvä]] ("you're welcome", literally "be good"). Casual alternatives are [[ei kestä]] and [[ei se mitään]] ("it's nothing"). Another common reply is [[ei hätää]] ("no worries").` },
    ],
    examples: [
      ["Kiitos avusta.", "Thank you for the help."],
      ["Kiitos paljon!", "Thank you very much!"],
      ["Kahvi, kiitos.", "A coffee, please."],
      ["Kiitos, samoin.", "Thanks, you too."],
    ],
    faq: [
      [`How do you say "thank you" in Finnish?`, `Kiitos. For extra emphasis, say kiitos paljon (thank you very much).`],
      [`How do you say "you're welcome" in Finnish?`, `Ole hyvä is the standard reply. In casual speech people also say ei kestä or ei se mitään.`],
      [`Does Finnish have a word for "please"?`, `Not a direct one. Finns usually put kiitos after the request, as in "Kahvi, kiitos", or use polite forms such as "Voisinko saada kahvin?" (Could I have a coffee?).`],
    ],
    related: ["youre-welcome-in-finnish", "sorry-in-finnish", "hello-in-finnish", "how-are-you-in-finnish"],
  },

  {
    slug: "hello-in-finnish",
    cat: "greetings",
    h1: `How to say "hello" in Finnish`,
    tag: `Hello in Finnish: hei, moi, terve (and when to use each)`,
    desc: `"Hello" in Finnish is hei or moi. Learn the casual and formal greetings, how to say hello and goodbye with the same word, and the examples to start with.`,
    word: "hei",
    respell: "HAY",
    answer: `[[Hei]] means "hello" or "hi". [[Moi]] is the very common casual version.`,
    body: [
      { h: "The everyday greetings" },
      {
        table: {
          head: ["Finnish", "Feels like", "Notes"],
          rows: [
            ["[[hei]]", "hello / hi", "Safe in every situation"],
            ["[[moi]]", "hi", "Very common, casual"],
            ["[[moikka]]", "hiya", "Casual, friendly"],
            ["[[terve]]", "hello / hey", "Informal, a bit hearty"],
            ["[[päivää]]", "good day", "Short form of [[hyvää päivää]], more formal"],
          ],
        },
      },
      { h: "Hello and goodbye are often the same word" },
      { p: `Finnish uses [[hei]] and [[moi]] for both greeting and parting. People double them to say goodbye: [[hei hei]] and [[moi moi]]. The tone and the situation tell you which one is meant.` },
      { h: "Which one should you use?" },
      { p: `With friends, colleagues and shop staff, [[moi]] and [[hei]] are both fine. When you want to sound more formal, for example with a stranger in an official setting, [[hyvää päivää]] is the polite choice. If you are unsure, [[hei]] is the one that is never wrong.` },
    ],
    examples: [
      ["Hei, mitä kuuluu?", "Hi, how are you?"],
      ["Moi! Kiva nähdä.", "Hi! Nice to see you."],
      ["Hyvää päivää.", "Good day. (formal)"],
      ["Hei hei!", "Bye!"],
    ],
    faq: [
      [`What is the most common way to say hello in Finnish?`, `Moi and hei. Both are used all the time, and moi is the more casual of the two.`],
      [`Can hei also mean goodbye?`, `Yes. Hei hei and moi moi are common ways to say goodbye.`],
      [`What is a formal greeting in Finnish?`, `Hyvää päivää ("good day"), or just päivää, is the formal option.`],
    ],
    related: ["goodbye-in-finnish", "good-morning-in-finnish", "how-are-you-in-finnish", "thank-you-in-finnish"],
  },

  {
    slug: "goodbye-in-finnish",
    cat: "greetings",
    h1: `How to say "goodbye" in Finnish`,
    tag: `Goodbye in Finnish: näkemiin, hei hei, nähdään`,
    desc: `Goodbye in Finnish: näkemiin (formal), hei hei or moi moi (casual) and nähdään (see you). When to use each, with example sentences.`,
    word: "näkemiin",
    respell: "NÄ-keh-meen (ä as in 'cat')",
    answer: `[[Näkemiin]] is the formal "goodbye". In everyday speech Finns say [[hei hei]], [[moi moi]] or [[nähdään]] ("see you").`,
    body: [
      { h: "Goodbyes from formal to casual" },
      {
        table: {
          head: ["Finnish", "English", "When"],
          rows: [
            ["[[näkemiin]]", "goodbye", "Formal, polite"],
            ["[[hei hei]]", "bye", "Everyday"],
            ["[[moi moi]]", "bye", "Everyday, casual"],
            ["[[heippa]]", "bye-bye", "Casual, friendly"],
            ["[[nähdään]]", "see you", "With people you will meet again"],
            ["[[nähdään pian]]", "see you soon", "Friendly"],
          ],
        },
      },
      { h: "Wishing someone well as they leave" },
      { p: `Finns often add a good wish when parting. [[Hyvää päivänjatkoa]] means "have a good rest of your day", and [[hauskaa viikonloppua]] means "have a nice weekend". [[Hyvää matkaa]] ("have a good trip") is for someone setting off on a journey.` },
    ],
    examples: [
      ["Näkemiin!", "Goodbye!"],
      ["Nähdään huomenna.", "See you tomorrow."],
      ["Hei hei, nähdään pian!", "Bye, see you soon!"],
      ["Hauskaa viikonloppua!", "Have a nice weekend!"],
    ],
    faq: [
      [`What is the most common way to say goodbye in Finnish?`, `Hei hei and moi moi are the everyday choices. Nähdään (see you) is common when you will meet again.`],
      [`What does näkemiin mean?`, `It is the formal word for "goodbye", used in polite or official situations.`],
    ],
    related: ["hello-in-finnish", "good-morning-in-finnish", "thank-you-in-finnish", "days-of-the-week-in-finnish"],
  },

  {
    slug: "good-morning-in-finnish",
    cat: "greetings",
    h1: `Good morning, good evening and good night in Finnish`,
    tag: `Good morning in Finnish: hyvää huomenta (and the rest)`,
    desc: `Good morning in Finnish is hyvää huomenta, usually shortened to huomenta. All the greetings for morning, day, evening and night, with examples.`,
    word: "hyvää huomenta",
    respell: "HÜ-vä HWOH-men-ta",
    answer: `"Good morning" is [[hyvää huomenta]], and in everyday speech just [[huomenta]].`,
    body: [
      { h: "Greetings by time of day" },
      {
        table: {
          head: ["Finnish", "English"],
          rows: [
            ["[[hyvää huomenta]]", "good morning"],
            ["[[hyvää päivää]]", "good day / good afternoon"],
            ["[[hyvää iltaa]]", "good evening"],
            ["[[hyvää yötä]]", "good night"],
          ],
        },
      },
      { h: "Why they all start with hyvää" },
      { p: `[[Hyvää]] is the partitive form of [[hyvä]] ("good"). Greetings and wishes are built as "[some] good ...", and the partitive is the case Finnish uses for that. The same pattern gives [[hyvää ruokahalua]] ("enjoy your meal") and [[hyvää matkaa]] ("have a good trip").` },
      { p: `In practice, people shorten these a lot: [[huomenta]] in the morning, [[iltaa]] in the evening, and plain [[moi]] at any time. [[Hyvää yötä]] is used when going to bed or saying goodnight, not as a greeting.` },
    ],
    examples: [
      ["Huomenta! Nukuitko hyvin?", "Morning! Did you sleep well?"],
      ["Hyvää iltaa, tervetuloa.", "Good evening, welcome."],
      ["Hyvää yötä, nähdään aamulla.", "Good night, see you in the morning."],
      ["Hyvää ruokahalua!", "Enjoy your meal!"],
    ],
    faq: [
      [`How do you say "good morning" in Finnish?`, `Hyvää huomenta, or the shorter huomenta in everyday speech.`],
      [`How do you say "good night" in Finnish?`, `Hyvää yötä.`],
    ],
    related: ["hello-in-finnish", "goodbye-in-finnish", "how-are-you-in-finnish", "days-of-the-week-in-finnish"],
  },

  {
    slug: "how-are-you-in-finnish",
    cat: "greetings",
    h1: `How to say "how are you?" in Finnish`,
    tag: `How are you in Finnish: mitä kuuluu? (and how to answer)`,
    desc: `"How are you?" in Finnish is Mitä kuuluu? How to answer it, from hyvää to ihan hyvää, and how to ask it back with entä sinulle?`,
    word: "mitä kuuluu",
    respell: "MI-ta KOO-loo",
    answer: `[[Mitä kuuluu?]] is the usual way to ask "how are you?" or "what's up?". A simple answer is [[Hyvää, kiitos.]]`,
    body: [
      { h: "Asking" },
      {
        table: {
          head: ["Finnish", "English", "Notes"],
          rows: [
            ["[[Mitä kuuluu?]]", "How are you? / What's new?", "The standard question"],
            ["[[Mitä sinulle kuuluu?]]", "How are you? (to you)", "A little fuller, same meaning"],
            ["[[Miten menee?]]", "How's it going?", "Casual"],
          ],
        },
      },
      { h: "Answering" },
      {
        table: {
          head: ["Finnish", "English"],
          rows: [
            ["[[Hyvää, kiitos.]]", "Good, thanks."],
            ["[[Ihan hyvää.]]", "Pretty good / just fine."],
            ["[[Ei mitään erikoista.]]", "Nothing special."],
            ["[[Entä sinulle?]]", "And you?"],
          ],
        },
      },
      { p: `To turn the question around, add [[Entä sinulle?]] or the shorter [[Entä sinä?]] ("And you?").` },
    ],
    examples: [
      ["Hei, mitä kuuluu?", "Hi, how are you?"],
      ["Hyvää, kiitos. Entä sinulle?", "Good, thanks. And you?"],
      ["Ihan hyvää. Paljon töitä.", "Pretty good. Lots of work."],
      ["Ei mitään erikoista.", "Nothing special."],
    ],
    faq: [
      [`How do you ask "how are you?" in Finnish?`, `Mitä kuuluu? Casually you can also say Miten menee?`],
      [`How do you answer mitä kuuluu?`, `Hyvää, kiitos is the simple answer. Ihan hyvää means "pretty good", and you can return the question with Entä sinulle?`],
    ],
    related: ["hello-in-finnish", "thank-you-in-finnish", "do-you-speak-english-in-finnish", "good-morning-in-finnish"],
  },

  {
    slug: "sorry-in-finnish",
    cat: "greetings",
    h1: `How to say "sorry" and "excuse me" in Finnish`,
    tag: `Sorry in Finnish: anteeksi (excuse me, sori, pahoittelen)`,
    desc: `"Sorry" and "excuse me" in Finnish is anteeksi. Casual sori, formal pahoittelen, and how to ask for someone's attention, with example sentences.`,
    word: "anteeksi",
    respell: "AHN-tayk-see",
    answer: `[[Anteeksi]] covers both "sorry" and "excuse me". Casually, people say [[sori]].`,
    body: [
      { h: "Sorry, excuse me, pardon" },
      {
        table: {
          head: ["Finnish", "English", "When"],
          rows: [
            ["[[anteeksi]]", "sorry / excuse me", "Everyday, polite"],
            ["[[sori]]", "sorry", "Casual, with friends"],
            ["[[pahoittelen]]", "I apologise", "Formal, written apologies"],
            ["[[anteeksi, mitä?]]", "pardon?", "When you did not catch something"],
            ["[[ei se mitään]]", "it's nothing / no problem", "Replying to an apology"],
          ],
        },
      },
      { h: "Getting someone's attention" },
      { p: `[[Anteeksi]] is also how you stop someone to ask a question, the way English uses "excuse me": [[Anteeksi, missä on asema?]] ("Excuse me, where is the station?"). It comes from the phrase [[antaa anteeksi]], "to forgive".` },
    ],
    examples: [
      ["Anteeksi, missä on asema?", "Excuse me, where is the station?"],
      ["Anteeksi, että olen myöhässä.", "Sorry I'm late."],
      ["Anteeksi, mitä sanoit?", "Sorry, what did you say?"],
      ["Sori!", "Sorry!"],
    ],
    faq: [
      [`How do you say "sorry" in Finnish?`, `Anteeksi. Among friends, sori is common.`],
      [`How do you say "excuse me" in Finnish?`, `Also anteeksi. The same word works for apologising and for getting someone's attention.`],
    ],
    related: ["thank-you-in-finnish", "youre-welcome-in-finnish", "do-you-speak-english-in-finnish", "i-dont-understand-in-finnish"],
  },

  {
    slug: "youre-welcome-in-finnish",
    cat: "greetings",
    h1: `How to say "you're welcome" and "please" in Finnish`,
    tag: `You're welcome in Finnish: ole hyvä (also "here you are")`,
    desc: `Ole hyvä means "you're welcome", "here you are" and "please go ahead" in Finnish. The formal olkaa hyvä, other replies, and examples.`,
    word: "ole hyvä",
    respell: "OH-leh HÜ-vä",
    answer: `[[Ole hyvä]] means "you're welcome". It also means "here you are" when handing something over, and "please go ahead".`,
    body: [
      { h: "One phrase, three jobs" },
      {
        table: {
          head: ["Situation", "Finnish", "English"],
          rows: [
            ["Someone thanks you", "[[Ole hyvä.]]", "You're welcome."],
            ["You hand something over", "[[Ole hyvä.]]", "Here you are."],
            ["You invite someone to go ahead or help themselves", "[[Ole hyvä.]]", "Please, go ahead."],
          ],
        },
      },
      { h: "Informal and formal" },
      { p: `[[Ole hyvä]] is the singular, informal form (literally "be good"). To several people, or politely to one, use [[olkaa hyvä]]. You will see this at buffets and on signs, for example [[Olkaa hyvä ja istukaa]] ("Please sit down").` },
      { h: "Other ways to reply to thanks" },
      { p: `In casual speech you can answer [[kiitos]] with [[ei kestä]] or [[ei se mitään]] ("it's nothing"). [[Ole hyvä]] is the safe default.` },
    ],
    examples: [
      ["Ole hyvä.", "Here you are. / You're welcome."],
      ["Olkaa hyvä ja istukaa.", "Please sit down."],
      ["Ole hyvä, ota kahvia.", "Please, have some coffee."],
      ["Kiitos! — Ole hyvä.", "Thanks! — You're welcome."],
    ],
    faq: [
      [`How do you say "you're welcome" in Finnish?`, `Ole hyvä. Casually you can also say ei kestä or ei se mitään.`],
      [`What is the plural or formal form of ole hyvä?`, `Olkaa hyvä.`],
    ],
    related: ["thank-you-in-finnish", "sorry-in-finnish", "hello-in-finnish", "coffee-in-finnish"],
  },

  // ───────────────────────── Getting by in Finnish ─────────────────────────
  {
    slug: "do-you-speak-english-in-finnish",
    cat: "getting-by",
    h1: `How to say "do you speak English?" in Finnish`,
    tag: `"Do you speak English?" in Finnish: Puhutko englantia?`,
    desc: `"Do you speak English?" in Finnish is Puhutko englantia? The formal version, how the -ko question ending works, and phrases for asking someone to slow down.`,
    word: "puhutko englantia",
    respell: "POO-hoot-ko EN-glan-ti-a",
    answer: `[[Puhutko englantia?]] means "Do you speak English?". To a stranger or an older person, the polite form is [[Puhutteko englantia?]]`,
    body: [
      { h: "Useful phrases" },
      {
        table: {
          head: ["Finnish", "English"],
          rows: [
            ["[[Puhutko englantia?]]", "Do you speak English? (informal)"],
            ["[[Puhutteko englantia?]]", "Do you speak English? (formal or plural)"],
            ["[[Puhun vähän suomea.]]", "I speak a little Finnish."],
            ["[[Voisitko puhua hitaammin?]]", "Could you speak more slowly?"],
            ["[[Voisitko sanoa uudelleen?]]", "Could you say that again?"],
          ],
        },
      },
      { h: "How the question is built" },
      { p: `Yes/no questions in Finnish put the verb first and add the ending [[-ko]] (or [[-kö]] when the word has front vowels such as ä, ö and y, following vowel harmony). [[Sinä puhut englantia]] ("you speak English") becomes [[Puhutko englantia?]] Notice that [[englantia]] is in the partitive case, the form Finnish uses for languages after the verb [[puhua]].` },
      { p: `The same trick works for other verbs: [[Tiedätkö?]] ("Do you know?"), [[Haluatko kahvia?]] ("Do you want coffee?").` },
    ],
    examples: [
      ["Puhutko englantia?", "Do you speak English?"],
      ["Puhun vähän suomea.", "I speak a little Finnish."],
      ["Voisitko puhua hitaammin?", "Could you speak more slowly?"],
      ["Haluatko kahvia?", "Do you want some coffee?"],
    ],
    faq: [
      [`How do you ask "do you speak English?" in Finnish?`, `Puhutko englantia? Use puhutteko englantia? to be formal.`],
      [`What does the -ko ending do in Finnish?`, `It turns a statement into a yes/no question and attaches to the verb, which moves to the start: puhut becomes puhutko.`],
    ],
    related: ["i-dont-understand-in-finnish", "how-are-you-in-finnish", "sorry-in-finnish", "coffee-in-finnish"],
  },

  {
    slug: "i-dont-understand-in-finnish",
    cat: "getting-by",
    h1: `How to say "I don't understand" in Finnish`,
    tag: `"I don't understand" in Finnish: En ymmärrä`,
    desc: `"I don't understand" in Finnish is En ymmärrä. How Finnish negation works with en, et, ei, plus phrases for asking what something means.`,
    word: "en ymmärrä",
    respell: "en ÜM-mar-rä",
    answer: `[[En ymmärrä]] means "I don't understand". Ask [[Mitä se tarkoittaa?]] for "What does that mean?".`,
    body: [
      { h: "Phrases for when you are lost" },
      {
        table: {
          head: ["Finnish", "English"],
          rows: [
            ["[[En ymmärrä.]]", "I don't understand."],
            ["[[En puhu suomea hyvin.]]", "I don't speak Finnish well."],
            ["[[Mitä se tarkoittaa?]]", "What does that mean?"],
            ["[[Voitko selittää?]]", "Can you explain?"],
            ["[[Voitko kirjoittaa sen?]]", "Can you write it down?"],
          ],
        },
      },
      { h: "Finnish has a negative verb" },
      { p: `English adds "don't". Finnish uses a small verb that changes with the person, followed by the main verb in its basic stem:` },
      {
        table: {
          head: ["Person", "Negative verb", "Example"],
          rows: [
            ["I", "[[en]]", "[[en ymmärrä]]"],
            ["you", "[[et]]", "[[et ymmärrä]]"],
            ["he / she", "[[ei]]", "[[ei ymmärrä]]"],
            ["we", "[[emme]]", "[[emme ymmärrä]]"],
            ["you (pl.)", "[[ette]]", "[[ette ymmärrä]]"],
            ["they", "[[eivät]]", "[[eivät ymmärrä]]"],
          ],
        },
      },
    ],
    examples: [
      ["En ymmärrä.", "I don't understand."],
      ["Mitä se tarkoittaa?", "What does that mean?"],
      ["Voitko selittää?", "Can you explain?"],
      ["Emme ymmärrä sanaa.", "We don't understand the word."],
    ],
    faq: [
      [`How do you say "I don't understand" in Finnish?`, `En ymmärrä.`],
      [`How does negation work in Finnish?`, `Finnish uses a negative verb that changes by person (en, et, ei, emme, ette, eivät) followed by the main verb in its basic form.`],
    ],
    related: ["do-you-speak-english-in-finnish", "sorry-in-finnish", "how-are-you-in-finnish", "thank-you-in-finnish"],
  },

  // ───────────────────────── Life in Finland ─────────────────────────
  {
    slug: "shop-in-finnish",
    cat: "life",
    h1: `"Shop" in Finnish: kauppa, and the three forms you need`,
    tag: `Shop in Finnish: kauppa (kaupassa, kauppaan, kaupasta)`,
    desc: `"Shop" or "store" in Finnish is kauppa. Learn kaupassa (in the shop), kauppaan (to the shop) and kaupasta (from the shop), plus useful shop words.`,
    word: "kauppa",
    respell: "KOW-ppa",
    answer: `[[Kauppa]] means "shop" or "store" (and also "trade"). The place forms are [[kaupassa]] (in the shop), [[kauppaan]] (to the shop) and [[kaupasta]] (from the shop).`,
    body: [
      { h: "In, to and from" },
      { p: `Finnish uses endings where English uses prepositions. This is the pattern you will meet again and again with places:` },
      {
        table: {
          head: ["Form", "Meaning", "Example"],
          rows: [
            ["[[kaupassa]]", "in / at the shop", "[[Olen kaupassa.]] I'm at the shop."],
            ["[[kauppaan]]", "to the shop", "[[Menen kauppaan.]] I'm going to the shop."],
            ["[[kaupasta]]", "from the shop", "[[Tulen kaupasta.]] I'm coming from the shop."],
          ],
        },
      },
      { p: `Notice that the double [[pp]] becomes a single [[p]] in [[kaupassa]] and [[kaupasta]]. This is called consonant gradation, and you will see it in many Finnish words.` },
      { h: "Shop words" },
      {
        table: {
          head: ["Finnish", "English"],
          rows: [
            ["[[ruokakauppa]]", "grocery store"],
            ["[[lähikauppa]]", "local shop, corner shop"],
            ["[[kauppakeskus]]", "shopping centre"],
            ["[[auki]] / [[kiinni]]", "open / closed"],
            ["[[kassa]]", "checkout, till"],
          ],
        },
      },
    ],
    examples: [
      ["Menen kauppaan.", "I'm going to the shop."],
      ["Olen kaupassa.", "I'm at the shop."],
      ["Tulen kaupasta.", "I'm coming from the shop."],
      ["Kauppa on auki kello yhdeksään.", "The shop is open until nine."],
    ],
    faq: [
      [`How do you say "shop" or "store" in Finnish?`, `Kauppa. A grocery store is a ruokakauppa.`],
      [`How do you say "in the shop" in Finnish?`, `Kaupassa. "To the shop" is kauppaan and "from the shop" is kaupasta.`],
    ],
    related: ["house-and-home-in-finnish", "water-in-finnish", "pharmacy-in-finnish", "numbers-in-finnish"],
  },

  {
    slug: "rent-in-finnish",
    cat: "life",
    h1: `"Rent" in Finnish: vuokra and housing words`,
    tag: `Rent in Finnish: vuokra (landlord, tenant, rental apartment)`,
    desc: `"Rent" in Finnish is vuokra. Words for landlord, tenant, lease and rental apartment, plus example sentences for renting a place in Finland.`,
    word: "vuokra",
    respell: "VWOH-kra",
    answer: `[[Vuokra]] means "rent". The verb "to rent" is [[vuokrata]], and a rental apartment is a [[vuokra-asunto]].`,
    body: [
      { h: "Renting vocabulary" },
      {
        table: {
          head: ["Finnish", "English"],
          rows: [
            ["[[vuokra]]", "rent"],
            ["[[vuokrata]]", "to rent (out or from someone)"],
            ["[[vuokra-asunto]]", "rental apartment"],
            ["[[vuokranantaja]]", "landlord"],
            ["[[vuokralainen]]", "tenant"],
            ["[[vuokrasopimus]]", "lease, rental contract"],
            ["[[vuokravakuus]]", "rental deposit"],
            ["[[asunto]]", "apartment, home"],
          ],
        },
      },
      { h: "How the words are built" },
      { p: `Finnish builds long words by joining shorter ones. [[Vuokra]] ("rent") plus [[antaja]] ("giver") gives [[vuokranantaja]], the one who gives the rent out. [[Vuokra]] plus [[lainen]] (a suffix for a person connected to something) gives [[vuokralainen]], the tenant. Recognising the pieces makes new words much easier to guess.` },
    ],
    examples: [
      ["Vuokra on 800 euroa kuukaudessa.", "The rent is 800 euros a month."],
      ["Etsin vuokra-asuntoa.", "I'm looking for a rental apartment."],
      ["Maksan vuokran kuun alussa.", "I pay the rent at the start of the month."],
      ["Vuokranantaja soitti.", "The landlord called."],
    ],
    faq: [
      [`How do you say "rent" in Finnish?`, `Vuokra. "To rent" is vuokrata.`],
      [`How do you say "landlord" in Finnish?`, `Vuokranantaja. A tenant is a vuokralainen.`],
    ],
    related: ["house-and-home-in-finnish", "work-in-finnish", "numbers-in-finnish", "shop-in-finnish"],
  },

  {
    slug: "doctor-in-finnish",
    cat: "life",
    h1: `"Doctor" in Finnish: lääkäri, and how to talk about health`,
    tag: `Doctor in Finnish: lääkäri (appointment, health centre)`,
    desc: `"Doctor" in Finnish is lääkäri. Words for appointment, dentist, health centre and hospital, plus phrases for seeing a doctor in Finland.`,
    word: "lääkäri",
    respell: "LÄÄ-kä-ri (ä as in 'cat')",
    answer: `[[Lääkäri]] means "doctor". A doctor's appointment is a [[lääkäriaika]], and a dentist is a [[hammaslääkäri]].`,
    body: [
      { h: "Health vocabulary" },
      {
        table: {
          head: ["Finnish", "English"],
          rows: [
            ["[[lääkäri]]", "doctor"],
            ["[[lääkäriaika]]", "doctor's appointment"],
            ["[[hammaslääkäri]]", "dentist"],
            ["[[terveysasema]]", "health centre"],
            ["[[sairaala]]", "hospital"],
            ["[[päivystys]]", "emergency clinic (urgent care)"],
            ["[[resepti]]", "prescription"],
          ],
        },
      },
      { p: `The emergency number in Finland is [[112]]. For ordinary illness you book an appointment ([[lääkäriaika]]) at a [[terveysasema]].` },
      { h: "Going to the doctor" },
      { p: `To say you are going to the doctor, use [[menen lääkäriin]] (illative, "into"). To say you need to see one, [[tarvitsen lääkärin]] works well. Note how [[lääkäri]] becomes [[lääkärin]] when it is the object of the verb.` },
    ],
    examples: [
      ["Tarvitsen lääkärin.", "I need a doctor."],
      ["Minulla on lääkäriaika huomenna.", "I have a doctor's appointment tomorrow."],
      ["Menen lääkäriin.", "I'm going to the doctor."],
      ["Missä on lähin terveysasema?", "Where is the nearest health centre?"],
    ],
    faq: [
      [`How do you say "doctor" in Finnish?`, `Lääkäri.`],
      [`How do you say "I have a doctor's appointment" in Finnish?`, `Minulla on lääkäriaika.`],
    ],
    related: ["pharmacy-in-finnish", "work-in-finnish", "days-of-the-week-in-finnish", "numbers-in-finnish"],
  },

  {
    slug: "pharmacy-in-finnish",
    cat: "life",
    h1: `"Pharmacy" in Finnish: apteekki`,
    tag: `Pharmacy in Finnish: apteekki (medicine, prescription)`,
    desc: `"Pharmacy" in Finnish is apteekki. Words for medicine, prescription and painkiller, plus phrases for asking for what you need at a Finnish pharmacy.`,
    word: "apteekki",
    respell: "AP-teek-ki",
    answer: `[[Apteekki]] means "pharmacy". Medicine is [[lääke]], and a prescription is a [[resepti]].`,
    body: [
      { h: "At the pharmacy" },
      {
        table: {
          head: ["Finnish", "English"],
          rows: [
            ["[[apteekki]]", "pharmacy"],
            ["[[lääke]]", "medicine"],
            ["[[resepti]]", "prescription"],
            ["[[särkylääke]]", "painkiller"],
            ["[[kuume]]", "fever"],
            ["[[flunssa]]", "cold, flu"],
            ["[[yskä]]", "cough"],
          ],
        },
      },
      { h: "Asking for something" },
      { p: `Use [[tarvitsen]] ("I need") followed by the item in the partitive: [[Tarvitsen särkylääkettä]] ("I need a painkiller"). You can also ask [[Onko teillä...?]] ("Do you have ...?").` },
    ],
    examples: [
      ["Missä on lähin apteekki?", "Where is the nearest pharmacy?"],
      ["Tarvitsen särkylääkettä.", "I need a painkiller."],
      ["Minulla on resepti.", "I have a prescription."],
      ["Onko apteekki auki?", "Is the pharmacy open?"],
    ],
    faq: [
      [`How do you say "pharmacy" in Finnish?`, `Apteekki.`],
      [`How do you say "prescription" in Finnish?`, `Resepti.`],
    ],
    related: ["doctor-in-finnish", "shop-in-finnish", "water-in-finnish", "do-you-speak-english-in-finnish"],
  },

  {
    slug: "work-in-finnish",
    cat: "life",
    h1: `"Work" in Finnish: työ, töissä and töihin`,
    tag: `Work in Finnish: työ (töissä, töihin, job vocabulary)`,
    desc: `"Work" or "job" in Finnish is työ. Learn töissä (at work), töihin (to work) and töistä (from work), plus workplace and job-hunting vocabulary.`,
    word: "työ",
    respell: "TÜ-ö (the y is like German ü)",
    answer: `[[Työ]] means "work" or "job". The everyday forms are [[töissä]] (at work), [[töihin]] (to work) and [[töistä]] (from work).`,
    body: [
      { h: "At, to and from work" },
      {
        table: {
          head: ["Form", "Meaning", "Example"],
          rows: [
            ["[[töissä]]", "at work", "[[Olen töissä.]] I'm at work."],
            ["[[töihin]]", "to work", "[[Menen töihin.]] I'm going to work."],
            ["[[töistä]]", "from work", "[[Tulen töistä.]] I'm coming from work."],
          ],
        },
      },
      { p: `These forms use a stem that looks different from the dictionary word [[työ]]. That is normal in Finnish, and they are worth learning as set expressions.` },
      { h: "Work vocabulary" },
      {
        table: {
          head: ["Finnish", "English"],
          rows: [
            ["[[työpaikka]]", "workplace, job position"],
            ["[[työkaveri]]", "coworker"],
            ["[[työsopimus]]", "employment contract"],
            ["[[työtön]]", "unemployed"],
            ["[[työhaastattelu]]", "job interview"],
            ["[[palkka]]", "salary, pay"],
          ],
        },
      },
    ],
    examples: [
      ["Olen töissä.", "I'm at work."],
      ["Menen töihin.", "I'm going to work."],
      ["Etsin työtä.", "I'm looking for a job."],
      ["Työkaveri soitti.", "A coworker called."],
    ],
    faq: [
      [`How do you say "work" or "job" in Finnish?`, `Työ. A workplace or job position is a työpaikka.`],
      [`How do you say "I'm at work" in Finnish?`, `Olen töissä. "I'm going to work" is Menen töihin.`],
    ],
    related: ["rent-in-finnish", "days-of-the-week-in-finnish", "coffee-in-finnish", "doctor-in-finnish"],
  },

  {
    slug: "house-and-home-in-finnish",
    cat: "life",
    h1: `"House" and "home" in Finnish: talo and koti`,
    tag: `House and home in Finnish: talo vs koti (with forms)`,
    desc: `"House" in Finnish is talo and "home" is koti. The difference between them, plus the in/to/from forms: talossa, taloon, kotona, kotiin and kotoa.`,
    word: "talo / koti",
    respell: "TAH-lo / KO-ti",
    answer: `[[Talo]] is the building, a "house". [[Koti]] is where you live, your "home".`,
    body: [
      { h: "The difference" },
      { p: `[[Talo]] is a physical building: [[Meillä on iso talo]] ("We have a big house"). [[Koti]] is the place you belong: [[Olen kotona]] ("I'm at home"). A [[koti]] can be a flat, a room or a house.` },
      { h: "In, to and from" },
      {
        table: {
          head: ["", "In / at", "To", "From"],
          rows: [
            ["house", "[[talossa]]", "[[taloon]]", "[[talosta]]"],
            ["home", "[[kotona]]", "[[kotiin]]", "[[kotoa]]"],
          ],
        },
      },
      { p: `[[Koti]] has its own special forms, so it is worth learning them as a set: [[kotona]] (at home), [[kotiin]] (home, as in "going home"), [[kotoa]] (from home).` },
    ],
    examples: [
      ["Meillä on iso talo.", "We have a big house."],
      ["Olen kotona.", "I'm at home."],
      ["Menen kotiin.", "I'm going home."],
      ["Talo on punainen.", "The house is red."],
    ],
    faq: [
      [`How do you say "house" in Finnish?`, `Talo.`],
      [`How do you say "I'm going home" in Finnish?`, `Menen kotiin.`],
      [`What is the difference between talo and koti?`, `Talo is the building. Koti is home, the place you live.`],
    ],
    related: ["rent-in-finnish", "colors-in-finnish", "shop-in-finnish", "work-in-finnish"],
  },

  // ───────────────────────── Everyday words ─────────────────────────
  {
    slug: "water-in-finnish",
    cat: "everyday",
    h1: `"Water" in Finnish: vesi, and why it changes shape`,
    tag: `Water in Finnish: vesi (veden, vettä, vedessä)`,
    desc: `"Water" in Finnish is vesi. See how the word changes: veden, vettä, vedessä. A good example of Finnish stem changes, with useful sentences.`,
    word: "vesi",
    respell: "VEH-si",
    answer: `[[Vesi]] means "water". Its other forms use a different stem: [[veden]], [[vettä]], [[vedessä]].`,
    body: [
      { h: "The forms of vesi" },
      {
        table: {
          head: ["Case", "Form", "Used for"],
          rows: [
            ["Basic", "[[vesi]]", "water (as a subject)"],
            ["Genitive", "[[veden]]", "of the water"],
            ["Partitive", "[[vettä]]", "some water, for example [[juon vettä]]"],
            ["In", "[[vedessä]]", "in the water"],
            ["Into", "[[veteen]]", "into the water"],
            ["From", "[[vedestä]]", "from the water"],
          ],
        },
      },
      { p: `Notice that the stem changes from [[vesi]] to [[vete-]] / [[vede-]]. This kind of change is common in Finnish and is a big reason why looking up forms you meet while reading is so useful.` },
      { h: "Water words" },
      { p: `[[Hanavesi]] is tap water, [[kylmä vesi]] is cold water, and [[lasillinen vettä]] is "a glass of water". A lake is a [[järvi]] and the sea is [[meri]].` },
    ],
    examples: [
      ["Haluaisin lasillisen vettä.", "I would like a glass of water."],
      ["Juon vettä.", "I'm drinking water."],
      ["Vesi on kylmää.", "The water is cold."],
      ["Hanavesi on hyvää.", "The tap water is good."],
    ],
    faq: [
      [`How do you say "water" in Finnish?`, `Vesi.`],
      [`How do you say "a glass of water, please" in Finnish?`, `Lasillinen vettä, kiitos.`],
    ],
    related: ["coffee-in-finnish", "colors-in-finnish", "shop-in-finnish", "thank-you-in-finnish"],
  },

  {
    slug: "coffee-in-finnish",
    cat: "everyday",
    h1: `"Coffee" in Finnish: kahvi`,
    tag: `Coffee in Finnish: kahvi (kahvia, kahvila, kahvitauko)`,
    desc: `"Coffee" in Finnish is kahvi. How to ask for it, how to offer it, and words like kahvila (café) and kahvitauko (coffee break), with examples.`,
    word: "kahvi",
    respell: "KAH-hvi",
    answer: `[[Kahvi]] means "coffee". To offer or ask for some, you use the partitive: [[Haluatko kahvia?]] ("Would you like some coffee?")`,
    body: [
      { h: "Coffee words" },
      {
        table: {
          head: ["Finnish", "English"],
          rows: [
            ["[[kahvi]]", "coffee"],
            ["[[kahvila]]", "café"],
            ["[[kahvitauko]]", "coffee break"],
            ["[[musta kahvi]]", "black coffee"],
            ["[[maitokahvi]]", "coffee with milk"],
            ["[[kahvinkeitin]]", "coffee maker"],
          ],
        },
      },
      { h: "Why kahvia?" },
      { p: `After verbs like [[haluta]] ("to want") and [[juoda]] ("to drink"), Finnish uses the partitive form for an unspecified amount: [[kahvi]] becomes [[kahvia]]. So you say [[Juon kahvia]] ("I'm drinking coffee") and [[Haluatko kahvia?]] ("Would you like some coffee?").` },
      { p: `Finland is regularly listed among the countries that drink the most coffee per person, and a [[kahvitauko]] is an established part of the working day.` },
    ],
    examples: [
      ["Haluatko kahvia?", "Would you like some coffee?"],
      ["Juon kahvia joka aamu.", "I drink coffee every morning."],
      ["Kahvi, kiitos.", "A coffee, please."],
      ["Pidetään kahvitauko.", "Let's take a coffee break."],
    ],
    faq: [
      [`How do you say "coffee" in Finnish?`, `Kahvi.`],
      [`How do you say "would you like some coffee?" in Finnish?`, `Haluatko kahvia?`],
    ],
    related: ["water-in-finnish", "thank-you-in-finnish", "youre-welcome-in-finnish", "do-you-speak-english-in-finnish"],
  },

  // ───────────────────────── Basics ─────────────────────────
  {
    slug: "numbers-in-finnish",
    cat: "basics",
    h1: `Numbers in Finnish: 1 to 10 and beyond`,
    tag: `Numbers in Finnish: 1 to 10, teens and tens`,
    desc: `Finnish numbers from 0 to 10, how the teens and tens are built, and how numbers change the noun after them. With examples and a full table.`,
    word: "yksi, kaksi, kolme",
    respell: "ÜK-si, KAK-si, KOL-me",
    answer: `1 is [[yksi]], 2 is [[kaksi]], 3 is [[kolme]], 4 is [[neljä]], 5 is [[viisi]]. The full list is below.`,
    body: [
      { h: "0 to 10" },
      {
        table: {
          head: ["Number", "Finnish"],
          rows: [
            ["0", "[[nolla]]"],
            ["1", "[[yksi]]"],
            ["2", "[[kaksi]]"],
            ["3", "[[kolme]]"],
            ["4", "[[neljä]]"],
            ["5", "[[viisi]]"],
            ["6", "[[kuusi]]"],
            ["7", "[[seitsemän]]"],
            ["8", "[[kahdeksan]]"],
            ["9", "[[yhdeksän]]"],
            ["10", "[[kymmenen]]"],
          ],
        },
      },
      { h: "Teens and tens" },
      { p: `The teens add [[-toista]] (literally "of the second") to the digit: 11 is [[yksitoista]], 12 is [[kaksitoista]], 13 is [[kolmetoista]]. The tens use [[-kymmentä]]: 20 is [[kaksikymmentä]], 30 is [[kolmekymmentä]]. 100 is [[sata]] and 1000 is [[tuhat]].` },
      { h: "Numbers change the noun" },
      { p: `After a number higher than one, the noun goes in the singular partitive: [[kaksi kissaa]] ("two cats"), [[viisi euroa]] ("five euros"). After [[yksi]], the noun stays in its normal form: [[yksi kissa]].` },
    ],
    examples: [
      ["Minulla on kaksi kissaa.", "I have two cats."],
      ["Kello on kolme.", "It's three o'clock."],
      ["Hinta on kymmenen euroa.", "The price is ten euros."],
      ["Bussi numero viisi.", "Bus number five."],
    ],
    faq: [
      [`How do you count to ten in Finnish?`, `Yksi, kaksi, kolme, neljä, viisi, kuusi, seitsemän, kahdeksan, yhdeksän, kymmenen.`],
      [`How do you say 20 in Finnish?`, `Kaksikymmentä.`],
    ],
    related: ["days-of-the-week-in-finnish", "colors-in-finnish", "shop-in-finnish", "rent-in-finnish"],
  },

  {
    slug: "days-of-the-week-in-finnish",
    cat: "basics",
    h1: `Days of the week in Finnish`,
    tag: `Days of the week in Finnish: maanantai to sunnuntai`,
    desc: `The seven days of the week in Finnish, how to say "on Monday" (maanantaina), and words like today, tomorrow and weekend, with examples.`,
    word: "maanantai",
    respell: "MAA-nan-tai",
    answer: `Monday is [[maanantai]], Tuesday [[tiistai]], Wednesday [[keskiviikko]], Thursday [[torstai]], Friday [[perjantai]], Saturday [[lauantai]], Sunday [[sunnuntai]].`,
    body: [
      { h: "The week" },
      {
        table: {
          head: ["English", "Finnish", "On that day"],
          rows: [
            ["Monday", "[[maanantai]]", "[[maanantaina]]"],
            ["Tuesday", "[[tiistai]]", "[[tiistaina]]"],
            ["Wednesday", "[[keskiviikko]]", "[[keskiviikkona]]"],
            ["Thursday", "[[torstai]]", "[[torstaina]]"],
            ["Friday", "[[perjantai]]", "[[perjantaina]]"],
            ["Saturday", "[[lauantai]]", "[[lauantaina]]"],
            ["Sunday", "[[sunnuntai]]", "[[sunnuntaina]]"],
          ],
        },
      },
      { p: `Day names are not capitalised in Finnish. To say "on Monday", add [[-na]] (or [[-nä]]) to the word: [[maanantaina]]. [[Keskiviikko]] is built from [[keski]] ("middle") and [[viikko]] ("week").` },
      { h: "Useful time words" },
      {
        table: {
          head: ["Finnish", "English"],
          rows: [
            ["[[tänään]]", "today"],
            ["[[huomenna]]", "tomorrow"],
            ["[[eilen]]", "yesterday"],
            ["[[viikonloppu]]", "weekend"],
            ["[[viikko]]", "week"],
            ["[[arkipäivä]]", "weekday"],
          ],
        },
      },
    ],
    examples: [
      ["Tapaamme maanantaina.", "We'll meet on Monday."],
      ["Lauantaina menemme saunaan.", "On Saturday we're going to the sauna."],
      ["Olen vapaalla sunnuntaina.", "I'm off on Sunday."],
      ["Nähdään huomenna.", "See you tomorrow."],
    ],
    faq: [
      [`What are the days of the week in Finnish?`, `Maanantai, tiistai, keskiviikko, torstai, perjantai, lauantai, sunnuntai.`],
      [`How do you say "on Monday" in Finnish?`, `Maanantaina.`],
    ],
    related: ["numbers-in-finnish", "goodbye-in-finnish", "work-in-finnish", "colors-in-finnish"],
  },

  {
    slug: "colors-in-finnish",
    cat: "basics",
    h1: `Colors in Finnish`,
    tag: `Colors in Finnish: punainen, sininen, vihreä and more`,
    desc: `The main colors in Finnish with a full table: red, blue, green, yellow, black, white and more, plus how color words agree with the noun.`,
    word: "punainen",
    respell: "POO-nai-nen",
    answer: `Red is [[punainen]], blue [[sininen]], green [[vihreä]], yellow [[keltainen]], black [[musta]], white [[valkoinen]].`,
    body: [
      { h: "The colors" },
      {
        table: {
          head: ["English", "Finnish"],
          rows: [
            ["red", "[[punainen]]"],
            ["blue", "[[sininen]]"],
            ["green", "[[vihreä]]"],
            ["yellow", "[[keltainen]]"],
            ["black", "[[musta]]"],
            ["white", "[[valkoinen]]"],
            ["grey", "[[harmaa]]"],
            ["brown", "[[ruskea]]"],
            ["orange", "[[oranssi]]"],
            ["purple", "[[violetti]]"],
            ["pink", "[[vaaleanpunainen]]"],
          ],
        },
      },
      { h: "Colors agree with the noun" },
      { p: `Finnish adjectives take the same number and case as the noun they describe. So you get [[punainen talo]] ("a red house"), [[punaisessa talossa]] ("in the red house") and [[punaiset talot]] ("red houses"). The dictionary form ends in [[-nen]], but that ending changes to [[-s-]] in most other forms.` },
      { p: `[[Vaaleanpunainen]] ("pink") is literally "light red", from [[vaalea]] ("light") plus [[punainen]].` },
    ],
    examples: [
      ["Talo on punainen.", "The house is red."],
      ["Suomen lippu on sininen ja valkoinen.", "The Finnish flag is blue and white."],
      ["Onko sinulla sininen takki?", "Do you have a blue coat?"],
      ["Haluan mustaa kahvia.", "I'd like black coffee."],
    ],
    faq: [
      [`How do you say "red" in Finnish?`, `Punainen.`],
      [`What colors is the Finnish flag?`, `Sininen ja valkoinen (blue and white).`],
    ],
    related: ["numbers-in-finnish", "house-and-home-in-finnish", "days-of-the-week-in-finnish", "coffee-in-finnish"],
  },
];
