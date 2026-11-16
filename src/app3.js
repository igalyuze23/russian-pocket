/* ---------- exercise generation ---------- */
function distract(item, pool, n, key) {
  var seen = {}; seen[normRu(item.ru)] = 1; seen[item.he] = 1;
  var out = [];
  var cands = shuffle(pool.filter(function (w) { return w.unit === item.unit; })).concat(shuffle(pool));
  for (var i = 0; i < cands.length && out.length < n; i++) {
    var w = cands[i];
    if (w.id === item.id || seen[w.he] || seen[normRu(w.ru)]) continue;
    seen[w.he] = 1; seen[normRu(w.ru)] = 1; out.push(w);
  }
  return out;
}
function typable(w) { var r = plain(w.ru); return r.length <= 26 && r.indexOf('/') < 0 && r.indexOf('...') < 0 && r.split(' ').length <= 3; }
function sentenceOk(s) { var t = stripSpeaker(s.ru).split(' '); return t.length >= 3 && t.length <= 8 && s.ru.indexOf('—') < 0; }
function wordEx(w, kind, pool) {
  if (kind === 'listen' && !TTS.ok()) kind = 'mc_ru_he';
  if (kind === 'type' && !typable(w)) kind = 'mc_he_ru';
  return { t: kind, w: w, itemId: w.id, pool: pool };
}
function buildEx(s, pool) {
  var toks = stripSpeaker(s.ru).split(' ');
  var norm = toks.map(normRu), others = [];
  shuffle(pool).some(function (x) {
    stripSpeaker(x.ru).split(' ').forEach(function (t) { t = t.replace(/[.,!?;:«»]/g, ''); if (norm.indexOf(normRu(t)) < 0 && others.indexOf(t) < 0 && others.length < 2 && normRu(t).length > 1) others.push(t); });
    return others.length >= 2;
  });
  return { t: 'build', s: s, toks: toks, extra: others };
}
function vocabLesson(words, unitWords) {
  var pool = unitWords.length >= 6 ? unitWords : ALLWORDS, exs = [];
  chunk(words, 4).forEach(function (g) {
    g.forEach(function (w) { exs.push({ t: 'learn', w: w }); });
    shuffle(g).forEach(function (w, i) { exs.push(wordEx(w, i % 2 ? 'listen' : 'mc_ru_he', pool)); });
  });
  var tail = [];
  words.forEach(function (w, i) { tail.push(wordEx(w, i % 3 === 0 ? 'type' : i % 3 === 1 ? 'mc_he_ru' : 'listen', pool)); });
  tail = shuffle(tail);
  if (words.length >= 4) tail.splice(Math.floor(tail.length / 2), 0, { t: 'match', words: shuffle(words).slice(0, 5) });
  return exs.concat(tail);
}
function letterWord(l) { return { id: l.id + 'w', unit: l.unit, ru: l.ru, he: l.he }; }
function letterLesson(letters, unit) {
  var exs = [], pool = ALLLETTERS.map(letterWord);
  letters.forEach(function (l) { exs.push({ t: 'learnLetter', w: l }); exs.push({ t: 'letter_sound', w: l, itemId: l.id }); });
  shuffle(letters).forEach(function (l) {
    exs.push(TTS.ok() ? { t: 'letter_listen', w: l, itemId: l.id } : { t: 'letter_sound', w: l, itemId: l.id });
    exs.push({ t: 'mc_ru_he', w: letterWord(l), pool: pool });
  });
  return exs;
}
function grammarLesson(u) {
  var exs = shuffle(u.quiz).map(function (q) { return { t: 'gq', q: q, itemId: q.id }; });
  shuffle(u.examples.filter(sentenceOk)).slice(0, 2).forEach(function (s, i) { exs.splice(Math.min(exs.length, 2 + i * 3), 0, buildEx(s, ALLSENT)); });
  return exs;
}
function readingLesson(u) {
  var exs = u.questions.map(function (q) { return { t: 'rq', q: q }; });
  shuffle(u.lines.filter(sentenceOk)).slice(0, 2).forEach(function (s) { exs.push(buildEx(s, u.lines.concat(ALLSENT))); });
  return exs;
}
function startLesson(u, i) {
  var l = LESSONS[u.id][i], exs;
  if (u.type === 'vocab') { exs = vocabLesson(l.items, u.words); var ss = shuffle((u.sentences || []).filter(sentenceOk)); if (ss.length) exs.push(buildEx(ss[i % ss.length], ALLSENT)); }
  else if (u.type === 'alphabet') exs = letterLesson(l.items, u);
  else if (u.type === 'grammar') exs = grammarLesson(u);
  else exs = readingLesson(u);
  go('lesson', { exs: exs, title: u.title + (LESSONS[u.id].length > 1 ? ' · ' + l.title : ''), lessonKey: l.key, unitId: u.id, mode: 'lesson' });
}
function startPractice(mode, words, title) {
  if (!words.length) { toast('אין עדיין מילים לתרגול. התחילו שיעור קודם!'); return; }
  var pool = words.length >= 6 ? words : ALLWORDS, exs = [], sel = shuffle(words).slice(0, mode === 'match' ? 25 : 12);
  if (mode === 'flash') exs = sel.map(function (w) { return { t: 'flash', w: w, itemId: w.id }; });
  else if (mode === 'match') { chunk(sel, 5).forEach(function (c) { if (c.length >= 3) exs.push({ t: 'match', words: c }); }); }
  else if (mode === 'build') {
    var units = {}; words.forEach(function (w) { units[w.unit] = 1; });
    var ss = ALLSENT.filter(function (s) { return units[s.unit] && sentenceOk(s); }); if (ss.length < 4) ss = ALLSENT.filter(sentenceOk);
    exs = shuffle(ss).slice(0, 8).map(function (s) { return buildEx(s, ALLSENT); });
  }
  else if (mode === 'mix') {
    var kinds = ['mc_ru_he', 'mc_he_ru', 'listen', 'type'];
    exs = shuffle(sel.map(function (w, i) { return wordEx(w, kinds[i % 4], pool); }));
    if (sel.length >= 4) exs.splice(4, 0, { t: 'match', words: sel.slice(0, 5) });
  }
  else exs = sel.map(function (w) { return wordEx(w, mode, pool); });
  if (!exs.length) { toast('אין מספיק חומר לתרגול הזה עדיין'); return; }
  go('lesson', { exs: exs, title: title, mode: 'practice' });
}
function startReview() {
  var p = P(), ids = dueItems().slice(0, p.settings.reviewSize || 20);
  if (!ids.length) { toast('אין פריטים לחזרה. כל הכבוד!'); return; }
  var exs = shuffle(ids).map(function (id, i) {
    var it = ITEM[id], s = p.srs[id];
    if (it.kind === 'q') return { t: 'gq', q: it.w, itemId: id };
    if (it.kind === 'letter') return { t: i % 2 && TTS.ok() ? 'letter_listen' : 'letter_sound', w: it.w, itemId: id };
    var pool = it.unit.words.length >= 6 ? it.unit.words : ALLWORDS;
    var kinds = s.n >= 2 ? ['type', 'mc_he_ru', 'listen', 'flash'] : ['mc_ru_he', 'mc_he_ru', 'listen', 'flash'];
    return wordEx(it.w, kinds[Math.floor(Math.random() * kinds.length)], pool);
  });
  go('lesson', { exs: exs, title: 'חזרה חכמה', mode: 'review' });
}

/* ---------- lesson runner ---------- */
SCREENS.lesson = function (a) {
  if (!a.init) { a.init = true; a.i = 0; a.total = a.exs.length; a.done = 0; a.correct = 0; a.answered = 0; a.xp = 0; a.retried = {}; a.t0 = Date.now(); a.graded = {}; }
  if (a.i >= a.exs.length) { finishLesson(a); return; }
  var ex = a.exs[a.i]; ex.state = ex.state || {};
  var pct = Math.round(a.done * 100 / a.total);
  var html = '<div class="lhead"><button class="iconbtn" data-act="exit" aria-label="יציאה">✕</button><div class="prog"><i style="width:' + pct + '%"></i></div><span class="xpchip">⭐ ' + a.xp + '</span></div>' +
    '<div class="stage" id="stage">' + (ex.retry ? '<div class="pill" style="margin-bottom:6px">🔁 ניסיון נוסף</div>' : '') + EX[ex.t].html(ex, a) + '</div><div class="foot" id="foot">' + (EX[ex.t].foot ? EX[ex.t].foot(ex, a) : '') + '</div>';
  var h = { exit: confirmExit, next: function () { nextEx(a); } };
  var eh = EX[ex.t].on(ex, a) || {}; Object.keys(eh).forEach(function (k) { h[k] = eh[k]; });
  view(html, h, { full: true });
  if (EX[ex.t].after) EX[ex.t].after(ex, a);
};
function confirmExit() {
  modal('<h3>לצאת מהשיעור?</h3><p>ההתקדמות בשיעור הזה לא תישמר (ה־XP שכבר צברתם נשאר).</p><div class="btnrow"><button class="btn sec" data-act="stay">להמשיך ללמוד</button><button class="btn bad" data-act="leave">לצאת</button></div>',
    { stay: closeModal, leave: function () { closeModal(); back(); } });
}
function answer(a, ex, ok, info) {
  info = info || {};
  if (ex.answered) return; ex.answered = true;
  a.answered++; if (ok) a.correct++;
  var p = P(); p.answered = (p.answered || 0) + 1; if (ok) p.correct = (p.correct || 0) + 1;
  if (ex.itemId && !a.graded[ex.itemId]) { a.graded[ex.itemId] = 1; grade(ex.itemId, info.q != null ? info.q : ok ? (info.almost ? 3 : 4) : 1); }
  if (ok) { a.xp += 2; addXP(2); } else save();
  if (!ok && a.mode !== 'practice' && !a.retried[a.i] && !ex.retry) {
    a.retried[a.i] = 1; var copy = {}; for (var k in ex) if (k !== 'state' && k !== 'answered' && k !== 'opts') copy[k] = ex[k]; copy.retry = true; a.exs.push(copy);
  }
  beep(ok);
  var f = document.getElementById('foot');
  f.className = 'foot ' + (ok ? 'good' : 'badf');
  f.innerHTML = '<div class="fb"><span class="em">' + (ok ? (info.almost ? '👌' : '🎉') : '😕') + '</span><div><b>' + (ok ? (info.almost ? 'כמעט מושלם!' : pickPraise()) : 'לא בדיוק') + '</b>' + (info.answer ? '<div class="ans">' + info.answer + '</div>' : '') + '</div></div>' +
    '<button class="btn ' + (ok ? 'ok' : 'bad') + '" data-act="next">המשך</button>';
  if (info.say) TTS.speak(info.say);
}
function pickPraise() { var a = ['מצוין!', 'נכון!', 'כל הכבוד!', 'Отли́чно!', 'Молоде́ц!', 'יפה מאוד!']; return a[Math.floor(Math.random() * a.length)]; }
function nextEx(a) { var ex = a.exs[a.i]; if (!ex.retry) a.done = Math.min(a.total, a.done + 1); a.i++; render(); }
function finishLesson(a) {
  if (!a.finished) {
    a.finished = true; var p = P(), bonus = 0;
    if (a.mode === 'lesson') {
      bonus = 10; if (a.answered && a.correct === a.answered) bonus += 5;
      p.done[a.lessonKey] = todayStr();
      a.exs.forEach(function (ex) { if (ex.w && ITEM[ex.w.id] && !p.srs[ex.w.id]) grade(ex.w.id, 4); });
    } else if (a.mode === 'review') bonus = 5; else bonus = 3;
    a.bonus = bonus; a.xp += bonus; addXP(bonus); save();
  }
  var acc = a.answered ? Math.round(a.correct * 100 / a.answered) : 100, secs = Math.round((Date.now() - a.t0) / 1000);
  var goalMet = todayXP() >= P().goal;
  var html = '<div class="endscr"><div class="trophy">' + (acc >= 90 ? '🏆' : acc >= 60 ? '🎉' : '💪') + '</div><h2>' + (a.mode === 'review' ? 'החזרה הושלמה!' : a.mode === 'lesson' ? 'השיעור הושלם!' : 'התרגול הושלם!') + '</h2>' +
    '<p style="color:var(--muted)">' + esc(a.title) + '</p><div class="stats3"><div class="stat"><b>⭐ ' + a.xp + '</b><small>XP</small></div><div class="stat"><b>' + acc + '%</b><small>דיוק</small></div><div class="stat"><b>' + Math.floor(secs / 60) + ':' + pad(secs % 60) + '</b><small>זמן</small></div></div>' +
    (goalMet ? '<div class="card" style="margin-bottom:16px">🔥 רצף של ' + curStreak() + ' ימים · עמדתם ביעד היומי!</div>' : '<div class="card" style="margin-bottom:16px">היום: ' + todayXP() + ' / ' + P().goal + ' XP</div>') +
    '<button class="btn" data-act="done">המשך</button>' + (a.mode === 'lesson' ? '<div style="height:10px"></div><button class="btn sec" data-act="again">לחזור על השיעור</button>' : '') + '</div>';
  view(html, {
    done: function () { back(); },
    again: function () { var u = UNIT[a.unitId], idx = LESSONS[u.id].map(function (l) { return l.key; }).indexOf(a.lessonKey); stack.pop(); cur = stack[stack.length - 1]; startLesson(u, idx); }
  }, { full: true });
}

/* ---------- exercise types ---------- */
var EX = {};
function mcHtml(opts, isRu) { return '<div class="opts">' + opts.map(function (o, i) { return '<button class="opt" data-act="pick" data-arg="' + i + '">' + (isRu ? '<span class="ru">' + esc(o) + '</span>' : esc(o)) + '</button>'; }).join('') + '</div>'; }
function mcOn(ex, a, opts, correct, info) {
  return { pick: function (i, el) {
    if (ex.answered) return; i = +i;
    var btns = document.querySelectorAll('.opt'), ok = opts[i] === correct;
    btns.forEach(function (b, j) { b.disabled = true; if (opts[j] === correct) b.classList.add('good'); });
    if (!ok) el.classList.add('wrong');
    answer(a, ex, ok, ok ? { say: info.sayOk } : info);
  } };
}
function ansLine(w) { return '<span class="ru">' + esc(w.ru) + '</span> · ' + esc(w.he); }

EX.learn = {
  html: function (ex) {
    var w = ex.w;
    return '<div class="qtitle">מילה חדשה</div><div class="prompt learn"><span class="newtag">חדש ✨</span>' + speakBtn(w.ru) + '<div style="padding:26px 0 10px">' + ruHtml(w.ru) + '<div class="meta">' + esc(w.he) + '</div></div></div>' +
      '<p class="sec-sub" style="text-align:center;margin:0">הקישו על 🔊 כדי לשמוע שוב</p>';
  },
  foot: function () { return '<button class="btn" data-act="next">הבנתי 👍</button>'; },
  on: function () { return {}; },
  after: function (ex) { if (P().settings.autoplay) TTS.speak(ex.w.ru); }
};
EX.learnLetter = {
  html: function (ex) {
    var l = ex.w;
    return '<div class="qtitle">אות חדשה</div><div class="prompt letter"><span class="newtag" style="position:absolute;top:12px;right:12px;background:var(--warnSoft);color:#B45309;font-size:12px;font-weight:800;padding:3px 10px;border-radius:999px">חדש ✨</span>' +
      '<button class="spk" style="position:absolute;top:12px;left:12px" data-act="say" data-arg="' + esc(l.name) + '">🔊</button>' +
      '<div class="ru" style="margin-top:14px">' + l.letter + '</div><div class="lat" style="font-size:20px">[' + esc(l.lat) + '] · <span class="ru" style="font-size:18px">' + esc(l.name) + '</span></div><div class="sub" style="font-size:16px;color:var(--text);margin-top:10px">' + esc(l.hint) + '</div></div>' +
      '<div class="card">' + '<button class="ex" data-act="say" data-arg="' + esc(l.ru) + '"><span class="t"><span class="he" style="font-size:12px">מילה לדוגמה</span>' + ruHtml(l.ru) + '<span class="he">' + esc(l.he) + '</span></span><span class="spk">🔊</span></button></div>';
  },
  foot: function () { return '<button class="btn" data-act="next">הבנתי 👍</button>'; },
  on: function () { return {}; },
  after: function (ex) { if (P().settings.autoplay) TTS.speak(ex.w.ru); }
};
EX.mc_ru_he = {
  html: function (ex) {
    var w = ex.w; ex.opts = ex.opts || shuffle([w.he].concat(distract(w, ex.pool || ALLWORDS, 3, 'he').map(function (x) { return x.he; })));
    return '<div class="qtitle">מה הפירוש?</div><div class="prompt">' + speakBtn(w.ru) + '<div style="padding:10px 0">' + ruHtml(w.ru) + '</div></div>' + mcHtml(ex.opts, false);
  },
  on: function (ex, a) { return mcOn(ex, a, ex.opts, ex.w.he, { answer: ansLine(ex.w), say: ex.w.ru }); },
  after: function (ex) { if (P().settings.autoplay && !ex.answered) TTS.speak(ex.w.ru); }
};
EX.mc_he_ru = {
  html: function (ex) {
    var w = ex.w; ex.opts = ex.opts || shuffle([w.ru].concat(distract(w, ex.pool || ALLWORDS, 3, 'ru').map(function (x) { return x.ru; })));
    return '<div class="qtitle">איך אומרים ברוסית?</div><div class="prompt"><div class="he">' + esc(w.he) + '</div></div>' + mcHtml(ex.opts, true);
  },
  on: function (ex, a) { return mcOn(ex, a, ex.opts, ex.w.ru, { answer: ansLine(ex.w), say: ex.w.ru, sayOk: ex.w.ru }); }
};
EX.listen = {
  html: function (ex) {
    var w = ex.w; ex.opts = ex.opts || shuffle([w.ru].concat(distract(w, ex.pool || ALLWORDS, 3, 'ru').map(function (x) { return x.ru; })));
    return '<div class="qtitle">מה שמעתם?</div><button class="bigspk" data-act="say" data-arg="' + esc(w.ru) + '">🔊</button><button class="slowbtn" data-act="slow">🐢 לאט יותר</button>' + mcHtml(ex.opts, true);
  },
  on: function (ex, a) { var h = mcOn(ex, a, ex.opts, ex.w.ru, { answer: ansLine(ex.w) }); h.slow = function () { TTS.speak(ex.w.ru, 0.55); }; return h; },
  after: function (ex) { if (!ex.answered) setTimeout(function () { TTS.speak(ex.w.ru); }, 250); }
};
function soundLabel(l) { return '[' + l.lat + '] ' + l.hint.split(',')[0].split('(')[0].split(':')[0].trim(); }
EX.letter_sound = {
  html: function (ex) {
    var l = ex.w;
    if (!ex.opts) { var pool = shuffle(ALLLETTERS.filter(function (x) { return x.id !== l.id && x.lat !== l.lat; })).slice(0, 3); ex.opts = shuffle([l].concat(pool).map(soundLabel)); }
    return '<div class="qtitle">איך נשמעת האות?</div><div class="prompt letter"><div class="ru">' + l.letter + '</div></div>' + mcHtml(ex.opts, false);
  },
  on: function (ex, a) { return mcOn(ex, a, ex.opts, soundLabel(ex.w), { answer: ex.w.letter + ' = [' + esc(ex.w.lat) + '] ' + esc(ex.w.hint) }); }
};
EX.letter_listen = {
  html: function (ex) {
    var l = ex.w;
    if (!ex.opts) { var pool = shuffle(ALLLETTERS.filter(function (x) { return x.id !== l.id; })).slice(0, 3); ex.opts = shuffle([l].concat(pool).map(function (x) { return x.letter; })); }
    return '<div class="qtitle">איזו אות שמעתם? (שם האות)</div><button class="bigspk" data-act="say" data-arg="' + esc(l.name) + '">🔊</button><div style="height:14px"></div>' + mcHtml(ex.opts, true);
  },
  on: function (ex, a) { return mcOn(ex, a, ex.opts, ex.w.letter, { answer: ex.w.letter + ' (' + esc(ex.w.name) + ')' }); },
  after: function (ex) { if (!ex.answered) setTimeout(function () { TTS.speak(ex.w.name); }, 250); }
};
var HEB = /[\u0590-\u05FF]/;
EX.gq = {
  html: function (ex) {
    var q = ex.q; ex.opts = ex.opts || shuffle(q.options);
    var isHeQ = HEB.test(q.q.replace(/\(.*?\)/g, '')) && !/[а-яё]{3}/i.test(q.q.replace(/\(.*?\)/g, '').replace(/[\u0590-\u05FF].*$/, '')) && q.q.indexOf('___') < 0;
    ex.isHeQ = isHeQ;
    var body = esc(q.q).replace('___', '<span class="blank"></span>');
    var qh = isHeQ ? '<div style="font-size:20px;font-weight:700">' + body + '</div>' : '<div class="gq ru" style="display:block">' + body + '</div>';
    return '<div class="qtitle">' + (isHeQ ? 'בחרו את התשובה הנכונה' : 'השלימו את המשפט') + '</div><div class="prompt" style="text-align:right">' + qh + (q.he ? '<div class="gq-he">' + esc(q.he) + '</div>' : '') + '</div>' + mcHtml(ex.opts, !HEB.test(q.answer));
  },
  on: function (ex, a) {
    var q = ex.q, full = q.q.replace(/\s*\([^)]*\)/g, '').replace('___', q.answer).replace(/\s+([.,!?])/g, '$1');
    var isHe = HEB.test(q.answer);
    return mcOn(ex, a, ex.opts, q.answer, { answer: isHe ? esc(q.answer) : '<span class="ru">' + esc(full) + '</span>', say: isHe ? null : full, sayOk: isHe ? null : full });
  }
};
EX.rq = {
  html: function (ex) { ex.opts = ex.opts || shuffle(ex.q.options); return '<div class="qtitle">שאלת הבנה</div><div class="prompt"><div style="font-size:20px;font-weight:700">' + esc(ex.q.q) + '</div></div>' + mcHtml(ex.opts, false); },
  on: function (ex, a) { return mcOn(ex, a, ex.opts, ex.q.answer, { answer: esc(ex.q.answer) }); }
};
