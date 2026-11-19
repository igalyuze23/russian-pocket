/* רוסית בכיס: offline Russian course for Hebrew speakers. */
(function () {
'use strict';
var COURSE = window.COURSE;
var $app = document.getElementById('app');
var ACC = '\u0301';

/* ---------- utils ---------- */
function plain(s) { return (s || '').replace(/\u0301/g, ''); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
function pad(n) { return n < 10 ? '0' + n : '' + n; }
function todayStr(d) { d = d || new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function addDays(str, n) { var p = str.split('-'); var d = new Date(+p[0], p[1] - 1, +p[2]); d.setDate(d.getDate() + n); return todayStr(d); }
function chunk(a, max) { var n = Math.max(1, Math.ceil(a.length / max)), size = Math.ceil(a.length / n), out = []; for (var i = 0; i < a.length; i += size) out.push(a.slice(i, i + size)); return out; }
function lev(a, b) {
  if (a === b) return 0; var m = a.length, n = b.length; if (!m) return n; if (!n) return m;
  var prev = [], cur = []; for (var j = 0; j <= n; j++) prev[j] = j;
  for (var i = 1; i <= m; i++) { cur = [i]; for (j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = cur; }
  return prev[n];
}
function stripSpeaker(s) { return s.replace(/^[^:\s]{1,14}: /, ''); }
function speakerOf(s) { var m = s.match(/^([^:\s]{1,14}): /); return m ? m[1] : ''; }

/* ---------- transliteration (Latin, with stress) ---------- */
var TL = { 'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'y', 'ь': '\u02bc', 'э': 'e', 'ю': 'yu', 'я': 'ya' };
var ACCV = { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú', y: 'ý' };
var VOW = 'аеёиоуыэюя';
var SPECIAL = { 'что': 'shto', 'чтобы': 'shtoby', 'что-нибудь': 'shto-nibudʼ', 'конечно': 'koneshno', 'скучно': 'skushno', 'его': 'yevo', 'сегодня': 'sevodnya', 'ничего': 'nichevo', 'солнце': 'sontse', 'сердце': 'sertse', 'здравствуйте': 'zdrastvuyte', 'чувство': 'chustvo', 'счастье': 'shchastʼye', 'счастливый': 'shchaslivyy', 'лестница': 'lesnitsa', 'честный': 'chesnyy' };
function translitWord(w) {
  var low = w.toLowerCase(), key = plain(low);
  var sp = SPECIAL[key];
  if (sp) {
    var si = low.indexOf(ACC);
    if (si > 0) {
      var vi = 0; for (var k = 0; k < si; k++) if (VOW.indexOf(low[k]) >= 0) vi++;
      var cnt = 0, out = '';
      for (k = 0; k < sp.length; k++) { var ch = sp[k]; if ('aeiouy'.indexOf(ch) >= 0 && !(ch === 'y' && 'aeiou'.indexOf(sp[k + 1] || '') >= 0)) { cnt++; if (cnt === vi) ch = ACCV[ch]; } out += ch; }
      sp = out;
    }
    return w[0] !== low[0] ? sp[0].toUpperCase() + sp.slice(1) : sp;
  }
  var res = '';
  for (var i = 0; i < low.length; i++) {
    var c = low[i]; if (c === ACC) continue;
    var stressed = low[i + 1] === ACC;
    var prev = i > 0 ? (low[i - 1] === ACC ? low[i - 2] : low[i - 1]) : '';
    var t = TL[c];
    if (t === undefined) { res += c; continue; }
    if (c === 'е' && (!prev || VOW.indexOf(prev) >= 0 || prev === 'ь' || prev === 'ъ' || !/[а-яё]/.test(prev))) t = 'ye';
    if (c === 'ё') { t = 'жшчщ'.indexOf(prev) >= 0 && prev ? 'o' : 'yo'; stressed = true; }
    if (c === 'и' && prev === 'ь') t = 'yi';
    if (stressed) { var last = t[t.length - 1]; t = t.slice(0, -1) + (ACCV[last] || last); }
    res += t;
  }
  if (/(ого|его)$/.test(key) && key.length > 4 && ['много', 'немного', 'дорого', 'строго'].indexOf(key) < 0) res = res.replace(/g(ó|o)$/, 'v$1');
  if (w[0] !== low[0]) res = res.charAt(0).toUpperCase() + res.slice(1);
  return res;
}
function translit(s) { return (s || '').replace(/[А-Яа-яЁё\u0301-]+/g, function (w) { return translitWord(w); }); }

/* ---------- answer checking ---------- */
function normRu(s) { return plain(s).toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9 -]/g, ' ').replace(/-/g, ' ').replace(/\s+/g, ' ').trim(); }
function normLat(s) {
  s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[\u02bc'`"’]/g, '');
  s = s.replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim();
  s = s.replace(/shch|sch|shh/g, 'sh').replace(/kh|x/g, 'h').replace(/tz|ts/g, 'c').replace(/j/g, 'y').replace(/w/g, 'v')
    .replace(/ia/g, 'ya').replace(/iu/g, 'yu').replace(/io/g, 'yo').replace(/ye/g, 'e').replace(/yo/g, 'o').replace(/ck/g, 'k');
  s = s.split(' ').map(function (w) { return w.replace(/(iy|yy|ij|yj|ii|ei)$/, 'y'); }).join(' ');
  return s.replace(/(.)\1+/g, '$1');
}
function checkTyped(input, target) {
  if (!input.trim()) return { ok: false };
  var isLat = /[a-z]/i.test(input) && !/[а-яё]/i.test(input);
  var alts = plain(target).split(/\s*[\/;,]\s*|\s*\(.*?\)\s*/).filter(Boolean);
  alts.unshift(target);
  var best = 99;
  alts.forEach(function (t) {
    var a, b;
    if (isLat) { a = normLat(input); b = normLat(translit(t)); } else { a = normRu(input); b = normRu(t); }
    best = Math.min(best, lev(a, b));
  });
  var tl = normRu(target).length;
  if (best === 0) return { ok: true };
  if (best <= (isLat ? (tl > 8 ? 2 : 1) : (tl >= 5 ? 1 : 0))) return { ok: true, almost: true };
  return { ok: false };
}

/* ---------- storage ---------- */
var KEY = 'rusPocket.v1';
var DB;
function load() {
  try { DB = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { DB = null; }
  if (!DB || !DB.profiles) DB = { profiles: [], current: null };
  pruneProgress();
}
function pruneProgress() {
  if (!DB || !DB.profiles) return;
  var lessonKeys = {};
  UNITS.forEach(function (u) { (LESSONS[u.id] || []).forEach(function (l) { lessonKeys[l.key] = true; }); });
  DB.profiles.forEach(function (p) {
    if (p.srs) Object.keys(p.srs).forEach(function (id) { if (!ITEM[id]) delete p.srs[id]; });
    if (p.done) Object.keys(p.done).forEach(function (k) { if (!lessonKeys[k]) delete p.done[k]; });
  });
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) { toast('שגיאה בשמירה'); } }
function P() { for (var i = 0; i < DB.profiles.length; i++) if (DB.profiles[i].id === DB.current) return DB.profiles[i]; return null; }
function newProfile(name, avatar, goal, start) {
  return { id: 'p' + Date.now().toString(36) + Math.floor(Math.random() * 1000), name: name, avatar: avatar, created: todayStr(), xp: 0, daily: {}, streak: 0, best: 0, lastDay: null,
    goal: goal || 30, start: start || 'A0', srs: {}, done: {}, correct: 0, answered: 0,
    settings: { rate: 0.9, translit: true, autoplay: true, sounds: true, theme: 'auto', reviewSize: 20 } };
}

/* ---------- course index ---------- */
var UNITS = COURSE.units, UNIT = {}, ITEM = {}, ALLWORDS = [], LESSONS = {};
UNITS.forEach(function (u) {
  UNIT[u.id] = u; u.title = COURSE.stress(u.title);
  if (u.type === 'vocab') u.words.forEach(function (w) { ITEM[w.id] = { kind: 'word', w: w, unit: u }; ALLWORDS.push(w); });
  if (u.type === 'alphabet') u.letters.forEach(function (l) { ITEM[l.id] = { kind: 'letter', w: l, unit: u }; });
  if (u.type === 'grammar') u.quiz.forEach(function (q, i) { q.id = 'q:' + u.id + ':' + i; q.unit = u.id; ITEM[q.id] = { kind: 'q', w: q, unit: u }; });
  var ls = [];
  if (u.type === 'vocab') chunk(u.words, u.lessonSize || 8).forEach(function (c, i) { ls.push({ key: u.id + ':' + i, title: 'שיעור ' + (i + 1), items: c }); });
  else if (u.type === 'alphabet') chunk(u.letters, 6).forEach(function (c, i) { ls.push({ key: u.id + ':' + i, title: 'שיעור ' + (i + 1), items: c }); });
  else ls.push({ key: u.id + ':0', title: u.type === 'grammar' ? 'תרגול דקדוק' : 'שאלות הבנה', items: [] });
  LESSONS[u.id] = ls;
});
var ALLLETTERS = []; UNITS.forEach(function (u) { if (u.type === 'alphabet') ALLLETTERS = ALLLETTERS.concat(u.letters); });
var ALLSENT = []; UNITS.forEach(function (u) {
  (u.sentences || []).forEach(function (s) { ALLSENT.push({ ru: s.ru, he: s.he, unit: u.id }); });
  (u.examples || []).forEach(function (s) { ALLSENT.push({ ru: s.ru, he: s.he, unit: u.id }); });
});
var LVIDS = COURSE.levels.map(function (l) { return l.id; });
function unitProgress(u) { var ls = LESSONS[u.id], d = 0, p = P(); ls.forEach(function (l) { if (p.done[l.key]) d++; }); return { done: d, total: ls.length, pct: Math.round(d * 100 / ls.length) }; }
function levelProgress(lv) { var d = 0, t = 0; UNITS.forEach(function (u) { if (u.level !== lv) return; var pr = unitProgress(u); d += pr.done; t += pr.total; }); return t ? Math.round(d * 100 / t) : 0; }
function nextUnit() {
  var p = P(), lvIdx = LVIDS.indexOf(p.start || 'A0');
  for (var i = 0; i < UNITS.length; i++) {
    var u = UNITS[i]; if (LVIDS.indexOf(u.level) < lvIdx) continue;
    if (unitProgress(u).done < LESSONS[u.id].length) return u;
  }
  return null;
}
function nextLessonIdx(u) { var ls = LESSONS[u.id], p = P(); for (var i = 0; i < ls.length; i++) if (!p.done[ls[i].key]) return i; return 0; }
var TYPE_HE = { vocab: 'אוצר מילים', alphabet: 'אלפבית', grammar: 'דקדוק', reading: 'קריאה' };

/* ---------- SRS (SM-2) ---------- */
function grade(id, q) {
  var p = P(), t = todayStr(); if (!ITEM[id]) return;
  var s = p.srs[id] || { e: 2.5, n: 0, i: 0, d: t, l: 0 };
  if (q < 3) { s.n = 0; s.i = 0; s.l++; s.d = t; }
  else { s.n++; s.i = s.n === 1 ? 1 : s.n === 2 ? 6 : Math.round(s.i * s.e); if (q === 5 && s.n === 1) s.i = 2; s.d = addDays(t, s.i); }
  s.e = Math.max(1.3, Math.round((s.e + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)) * 100) / 100);
  s.last = t; p.srs[id] = s;
}
function dueItems() { var p = P(), t = todayStr(), out = []; Object.keys(p.srs).forEach(function (id) { if (ITEM[id] && p.srs[id].d <= t) out.push(id); }); out.sort(function (a, b) { var A = p.srs[a], B = p.srs[b]; return A.d < B.d ? -1 : A.d > B.d ? 1 : A.e - B.e; }); return out; }
function strength(id) { var s = P().srs[id]; if (!s) return 0; if (s.i >= 21) return 4; if (s.i >= 6) return 3; if (s.i >= 1) return 2; return 1; }
function learnedWords() { var p = P(); return ALLWORDS.filter(function (w) { return p.srs[w.id]; }); }

/* ---------- XP & streak ---------- */
function addXP(n) {
  var p = P(), t = todayStr(); if (!n) return;
  p.daily[t] = (p.daily[t] || 0) + n; p.xp += n;
  if (p.lastDay !== t) { p.streak = p.lastDay === addDays(t, -1) ? p.streak + 1 : 1; p.lastDay = t; p.best = Math.max(p.best || 0, p.streak); }
  save();
}
function curStreak() { var p = P(), t = todayStr(); return (p.lastDay === t || p.lastDay === addDays(t, -1)) ? p.streak : 0; }
function todayXP() { return P().daily[todayStr()] || 0; }

/* ---------- TTS ---------- */
var webVoice = null, ttsState = 'init';
var TTS = {
  native: !!window.AndroidTTS,
  state: function () {
    if (window.__demoTTS) return 'ok';
    if (window.AndroidTTS) { try { return AndroidTTS.state(); } catch (e) { return 'error'; } }
    if (!('speechSynthesis' in window)) return 'none';
    return webVoice ? 'ok' : (ttsState === 'init' ? 'init' : 'missing');
  },
  ok: function () { return TTS.state() === 'ok'; },
  clean: function (s) { return plain(stripSpeaker(s || '')).replace(/\s*\/\s*/g, ', ').replace(/\.\.\.|…/g, '').replace(/\(.*?\)/g, '').replace(/[«»—]/g, ' '); },
  speak: function (s, rate) {
    var p = P(); var r = rate || (p ? p.settings.rate : 0.9); var txt = TTS.clean(s);
    if (window.AndroidTTS) { try { AndroidTTS.speak(txt, r); } catch (e) {} return; }
    if ('speechSynthesis' in window) {
      try { speechSynthesis.cancel(); var u = new SpeechSynthesisUtterance(txt); u.lang = 'ru-RU'; u.rate = r; if (webVoice) u.voice = webVoice; speechSynthesis.speak(u); } catch (e) {}
    }
  }
};
function initWebVoices() {
  if (window.AndroidTTS || !('speechSynthesis' in window)) return;
  var pickV = function () { var vs = speechSynthesis.getVoices() || []; webVoice = vs.filter(function (v) { return /^ru/i.test(v.lang); })[0] || null; if (vs.length) ttsState = 'done'; };
  pickV(); speechSynthesis.onvoiceschanged = pickV; setTimeout(function () { ttsState = 'done'; }, 1500);
}
window.onTtsState = function () { if (cur && (cur.name === 'home' || cur.name === 'settings' || cur.name === 'tts')) render(); };
function speakBtn(text, cls) { return '<button class="spk ' + (cls || '') + '" data-act="say" data-arg="' + esc(text) + '" aria-label="השמע">🔊</button>'; }

/* ---------- sounds ---------- */
var actx = null;
function beep(good) {
  var p = P(); if (!p || !p.settings.sounds) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    var notes = good ? [660, 880] : [300, 220];
    notes.forEach(function (f, i) {
      var o = actx.createOscillator(), g = actx.createGain(); o.type = 'sine'; o.frequency.value = f;
      var t0 = actx.currentTime + i * 0.11; g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.18, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.16);
      o.connect(g); g.connect(actx.destination); o.start(t0); o.stop(t0 + 0.18);
    });
  } catch (e) {}
}

/* ---------- theme ---------- */
function applyTheme() {
  var p = P(), th = p ? p.settings.theme : 'auto';
  var dark = th === 'dark' || (th === 'auto' && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', !!dark);
  if (window.AndroidTTS && AndroidTTS.setStatusColor) try { AndroidTTS.setStatusColor(dark ? '#1A1C33' : '#4F46E5'); } catch (e) {}
}
/* ---------- view / router ---------- */
var stack = [], cur = null, handlers = {};
function view(html, h, opts) {
  opts = opts || {};
  handlers = h || {};
  $app.className = opts.full ? 'full' : '';
  $app.innerHTML = html + (opts.full ? '' : navHtml());
  if (!opts.keepScroll) window.scrollTo(0, 0);
}
$app.addEventListener('click', function (e) {
  var el = e.target.closest('[data-act]'); if (!el || el.disabled) return;
  var act = el.getAttribute('data-act'), arg = el.getAttribute('data-arg');
  if (act === 'say') { TTS.speak(arg); return; }
  if (act === 'tab') { tab(arg); return; }
  if (act === 'back') { back(); return; }
  if (handlers[act]) handlers[act](arg, el, e);
});
function go(name, args) { stack.push({ name: name, args: args || {} }); cur = stack[stack.length - 1]; render(); }
function tab(name) { stack = [{ name: name, args: {} }]; cur = stack[0]; render(); }
function back() { if (stack.length > 1) { stack.pop(); cur = stack[stack.length - 1]; render(); return true; } if (cur && cur.name !== 'home' && P()) { tab('home'); return true; } return false; }
function render() { var s = SCREENS[cur.name]; if (!s) return; s(cur.args || {}); }
window.appBack = function () {
  if (!document.getElementById('modal').classList.contains('hidden')) { closeModal(); return true; }
  if (cur && cur.name === 'lesson' && !(cur.args && cur.args.finished)) { confirmExit(); return true; }
  return back();
};
function navHtml() {
  if (!P()) return '';
  var due = dueItems().length;
  var items = [['home', '🏠', 'בית'], ['review', '🔁', 'חזרה'], ['practice', '🎯', 'תרגול'], ['dict', '📚', 'מילון'], ['progress', '📈', 'התקדמות']];
  return '<nav class="nav">' + items.map(function (it) {
    return '<button data-act="tab" data-arg="' + it[0] + '" class="' + (stack[0] && stack[0].name === it[0] ? 'on' : '') + '"><span class="i">' + it[1] + '</span>' + it[2] +
      (it[0] === 'review' && due ? '<span class="dot">' + (due > 99 ? '99+' : due) + '</span>' : '') + '</button>';
  }).join('') + '</nav>';
}
function topbar(title, right) { return '<div class="topbar"><button class="iconbtn" data-act="back" aria-label="חזרה">→</button><h1>' + title + '</h1>' + (right || '') + '</div>'; }
function toast(msg) { var t = document.getElementById('toast'); t.textContent = msg; t.classList.remove('hidden'); clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.add('hidden'); }, 2200); }
function modal(html, h) {
  var m = document.getElementById('modal'); m.innerHTML = '<div class="sheet">' + html + '</div>'; m.classList.remove('hidden');
  m.onclick = function (e) { if (e.target === m) { closeModal(); return; } var el = e.target.closest('[data-act]'); if (el && h[el.getAttribute('data-act')]) h[el.getAttribute('data-act')](el.getAttribute('data-arg'), el); };
}
function closeModal() { document.getElementById('modal').classList.add('hidden'); }
function ruHtml(ru, showLat) { var p = P(); return '<span class="ru">' + esc(ru) + '</span>' + ((showLat !== false && p && p.settings.translit) ? '<span class="lat">' + esc(translit(stripSpeaker(ru))) + '</span>' : ''); }
function exRow(e) { return '<button class="ex" data-act="say" data-arg="' + esc(e.ru) + '"><span class="t"><span class="ru">' + esc(e.ru) + '</span><span class="he">' + esc(e.he) + '</span></span><span class="spk">🔊</span></button>'; }
function wRow(w, extra) { return '<button class="w" data-act="say" data-arg="' + esc(w.ru) + '"><span class="str s' + strength(w.id) + '"></span><span class="l">' + ruHtml(w.ru) + (extra || '') + '</span><span class="he">' + esc(w.he) + '</span></button>'; }

/* ---------- screens ---------- */
var AVATARS = ['🦊', '🐻', '🐱', '🐼', '🦉', '🐯', '🐰', '🐸', '🦄', '🐧', '🐺', '🦁'];
var SCREENS = {};

SCREENS.profiles = function () {
  var html = '<div class="welcome"><div class="logo">Я</div><h1>רוסית בכיס</h1><p>לומדים רוסית מאפס ועד רמה מתקדמת, בעברית</p></div>' +
    '<div class="wrap"><div class="sec-title">מי לומד עכשיו?</div><div class="profiles">' +
    DB.profiles.map(function (p) {
      var st = (p.lastDay === todayStr() || p.lastDay === addDays(todayStr(), -1)) ? p.streak : 0;
      return '<button class="pcard" data-act="pick" data-arg="' + p.id + '"><div class="a">' + p.avatar + '</div><b>' + esc(p.name) + '</b><small>⭐ ' + p.xp + ' XP · 🔥 ' + st + '</small></button>';
    }).join('') +
    '<button class="pcard add" data-act="add"><div class="a">＋</div><b>פרופיל חדש</b><small>לכל לומד התקדמות משלו</small></button></div>' +
    '<p class="sec-sub" style="margin-top:18px;text-align:center">הכול נשמר רק במכשיר, ועובד גם בלי אינטרנט.</p></div>';
  view(html, {
    pick: function (id) { DB.current = id; save(); applyTheme(); tab('home'); },
    add: function () { go('newprofile'); }
  }, { full: true });
};

SCREENS.newprofile = function (a) {
  var st = a.st || (a.st = { name: '', avatar: AVATARS[DB.profiles.length % AVATARS.length], goal: 30, start: 'A0' });
  var html = topbar('פרופיל חדש') + '<div class="wrap">' +
    '<div class="field"><label>שם</label><input type="text" id="pname" maxlength="20" placeholder="למשל: יגאל" value="' + esc(st.name) + '"></div>' +
    '<div class="field"><label>דמות</label><div class="avatars">' + AVATARS.map(function (e) { return '<button data-act="av" data-arg="' + e + '" class="' + (st.avatar === e ? 'on' : '') + '">' + e + '</button>'; }).join('') + '</div></div>' +
    '<div class="field"><label>יעד יומי</label><div class="seg">' + [[20, 'קליל · 20'], [30, 'רגיל · 30'], [50, 'רציני · 50'], [80, 'אינטנסיבי · 80']].map(function (g) { return '<button data-act="goal" data-arg="' + g[0] + '" class="' + (st.goal === g[0] ? 'on' : '') + '">' + g[1] + ' XP</button>'; }).join('') + '</div></div>' +
    '<div class="field"><label>מאיפה מתחילים?</label><div class="seg">' + COURSE.levels.map(function (l) { return '<button data-act="start" data-arg="' + l.id + '" class="' + (st.start === l.id ? 'on' : '') + '">' + l.id + ' · ' + l.name + '</button>'; }).join('') + '</div>' +
    '<p class="sec-sub" style="margin:8px 0 0">כל היחידות פתוחות תמיד. הבחירה רק קובעת מאיפה תתחיל ההמלצה "להמשיך ללמוד".</p></div>' +
    '<button class="btn" data-act="create">יוצאים לדרך 🚀</button></div>';
  var keep = function () { var el = document.getElementById('pname'); if (el) st.name = el.value; };
  view(html, {
    av: function (e) { keep(); st.avatar = e; render(); },
    goal: function (g) { keep(); st.goal = +g; render(); },
    start: function (s) { keep(); st.start = s; render(); },
    create: function () {
      keep(); var name = st.name.trim(); if (!name) { toast('נא להזין שם'); return; }
      var p = newProfile(name, st.avatar, st.goal, st.start); DB.profiles.push(p); DB.current = p.id; save(); applyTheme(); tab('home');
    }
  }, { full: true });
};

function ttsWarnHtml() {
  var s = TTS.state();
  if (s === 'ok' || s === 'init') return '';
  return '<button class="warn" data-act="tts"><span style="font-size:24px">🔇</span><span><b>אין קול רוסי מותקן</b><br>כדי לשמוע הגייה צריך להתקין קול רוסי. הקישו להוראות.</span></button>';
}

SCREENS.home = function () {
  var p = P(); if (!p) { tab('profiles'); return; }
  var tx = todayXP(), pct = Math.min(100, Math.round(tx * 100 / p.goal)), due = dueItems().length, nu = nextUnit(), st = curStreak();
  var hr = new Date().getHours(), greet = hr < 5 ? 'לילה טוב' : hr < 12 ? 'בוקר טוב' : hr < 18 ? 'צהריים טובים' : 'ערב טוב';
  var html = '<div class="hero"><div class="row"><button class="avatar" data-act="settings">' + p.avatar + '</button>' +
    '<div class="hello"><small>' + greet + ' · <span class="ru">Приве́т!</span></small><b>' + esc(p.name) + '</b></div>' +
    '<div class="chip">🔥 ' + st + '</div><div class="chip">⭐ ' + p.xp + '</div></div></div>' +
    '<div class="goalcard"><div class="ring" style="--p:' + pct + '"><div>' + tx + '<small>/' + p.goal + ' XP</small></div></div>' +
    '<div class="txt"><b>' + (pct >= 100 ? 'עמדת ביעד היומי! 🎉' : 'היעד היומי') + '</b><p>' + (pct >= 100 ? 'כל הכבוד. כל תרגול נוסף מחזק את הזיכרון.' : 'עוד ' + (p.goal - tx) + ' XP כדי לעמוד ביעד ולשמור על הרצף 🔥') + '</p></div></div>' +
    '<div class="wrap" style="padding-top:6px">' + ttsWarnHtml() +
    '<div class="cta">' +
    (nu ? '<button class="card primary" data-act="cont"><span class="big">▶️</span><b>להמשיך ללמוד</b><small>' + esc(nu.title) + ' · ' + LESSONS[nu.id][nextLessonIdx(nu)].title + '</small></button>'
      : '<button class="card primary" data-act="tabp"><span class="big">🏆</span><b>סיימתם את הקורס!</b><small>המשיכו לתרגל</small></button>') +
    '<button class="card" data-act="rev"><span class="big">🔁</span><b>חזרה חכמה</b><small>' + (due ? due + ' פריטים מחכים לחזרה' : 'אין פריטים לחזרה כרגע') + '</small></button></div>';
  COURSE.levels.forEach(function (lv) {
    html += '<div class="sec-title"><span class="badge" style="background:' + lv.color + '">' + lv.id + '</span>' + lv.name + '<span style="flex:1"></span><small style="color:var(--muted);font-size:13px">' + levelProgress(lv.id) + '%</small></div><div class="sec-sub">' + lv.sub + '</div><div class="units">';
    UNITS.forEach(function (u) {
      if (u.level !== lv.id) return;
      var pr = unitProgress(u);
      html += '<button class="unit ' + (pr.done === pr.total ? 'done' : '') + (nu && nu.id === u.id ? ' next' : '') + '" data-act="unit" data-arg="' + u.id + '">' +
        '<div class="ic">' + (pr.done === pr.total ? '✓' : u.icon) + '</div><div class="mid"><b>' + esc(u.title) + '</b><small>' + TYPE_HE[u.type] +
        (u.type === 'vocab' ? ' · ' + u.words.length + ' מילים' : u.type === 'alphabet' ? ' · ' + u.letters.length + ' אותיות' : '') + '</small>' +
        '<div class="bar"><i style="width:' + pr.pct + '%"></i></div></div><span class="tag">' + pr.done + '/' + pr.total + '</span></button>';
    });
    html += '</div>';
  });
  html += '</div>';
  view(html, {
    settings: function () { go('settings'); },
    cont: function () { go('unit', { id: nu.id }); },
    tabp: function () { tab('practice'); },
    rev: function () { tab('review'); },
    unit: function (id) { go('unit', { id: id }); },
    tts: function () { go('tts'); }
  });
};

SCREENS.unit = function (a) {
  var u = UNIT[a.id], p = P(), ls = LESSONS[u.id], pr = unitProgress(u);
  var html = topbar(esc(u.title)) + '<div class="wrap" style="padding-top:0">' +
    '<div class="uhead"><div class="ic">' + u.icon + '</div><div><b style="font-size:13px;color:var(--muted)">' + u.level + ' · ' + TYPE_HE[u.type] + '</b><p>' + esc(u.desc || '') + '</p><div class="bar" style="width:160px"><i style="width:' + pr.pct + '%"></i></div></div></div>';
  if (u.type === 'grammar') {
    html += '<div class="card gram">' + u.html + '</div><div class="sec-title">דוגמאות</div><div class="card">' + u.examples.map(exRow).join('') + '</div>' +
      '<div style="margin-top:16px"><button class="btn" data-act="lesson" data-arg="0">' + (p.done[ls[0].key] ? '🔄 לתרגל שוב' : '✏️ לתרגל (' + u.quiz.length + ' שאלות)') + '</button></div>';
  } else if (u.type === 'reading') {
    html += readingHtml(u, a) +
      '<div class="btnrow"><button class="btn sec" data-act="playall">' + (a.playing ? '⏹ עצירה' : '▶️ השמעת הכול') + '</button><button class="btn sec" data-act="tr">' + (a.hideTr ? '👁 הצגת תרגום' : '🙈 הסתרת תרגום') + '</button></div>' +
      '<div style="margin-top:12px"><button class="btn" data-act="lesson" data-arg="0">' + (p.done[ls[0].key] ? '🔄 לענות שוב' : '❓ שאלות הבנה') + '</button></div>';
  } else {
    html += '<div class="lessons">' + ls.map(function (l, i) {
      var done = p.done[l.key];
      var preview = l.items.slice(0, 4).map(function (w) { return w.letter ? w.letter.split(' ')[0] : plain(w.ru); }).join(' · ');
      return '<button class="lesson ' + (done ? 'done' : '') + '" data-act="lesson" data-arg="' + i + '"><span class="n">' + (done ? '✓' : i + 1) + '</span><span class="mid"><b>' + l.title + ' · ' + l.items.length + (u.type === 'alphabet' ? ' אותיות' : ' מילים') + '</b><small class="ru" style="display:block;text-align:left">' + esc(preview) + ' …</small></span><span>' + (done ? '🔄' : '▶️') + '</span></button>';
    }).join('') + '</div>';
    html += '<div class="btnrow"><button class="btn sec" data-act="practice">🎯 תרגול מעורב</button><button class="btn sec" data-act="flash">🃏 כרטיסיות</button></div>';
    if (u.type === 'alphabet') {
      html += '<div class="sec-title">האותיות</div><div class="letters">' + u.letters.map(function (l) {
        return '<button class="lt" data-act="sayl" data-arg="' + l.id + '"><b>' + l.letter + '</b><small class="lat">' + esc(l.lat) + '</small></button>';
      }).join('') + '</div><div class="sec-title">מילים לדוגמה</div><div class="wlist">' + u.letters.map(function (l) { return wRow({ id: l.id, ru: l.ru, he: l.he }); }).join('') + '</div>';
    } else {
      html += '<div class="sec-title">כל המילים ביחידה (' + u.words.length + ')</div><div class="wlist">' + u.words.map(function (w) { return wRow(w); }).join('') + '</div>';
    }
    if (u.sentences && u.sentences.length) html += '<div class="sec-title">משפטים</div><div class="card">' + u.sentences.map(exRow).join('') + '</div>';
  }
  html += '</div>';
  view(html, {
    lesson: function (i) { startLesson(u, +i); },
    practice: function () { startPractice('mix', u.words, 'תרגול: ' + u.title); },
    flash: function () { startPractice('flash', u.words, 'כרטיסיות: ' + u.title); },
    sayl: function (id) { TTS.speak(ITEM[id].w.name); },
    tr: function () { a.hideTr = !a.hideTr; render(); },
    playall: function () { if (a.playing) { a.playing = false; render(); return; } playAll(u, a); }
  }, { keepScroll: a._seen });
  a._seen = true;
};
function readingHtml(u, a) {
  return (u.intro ? '<div class="card gram" style="margin-bottom:12px">' + u.intro + '</div>' : '') +
    '<div class="card" style="padding:8px">' + u.lines.map(function (l, i) {
      var sp = speakerOf(l.ru);
      return '<button class="rline' + (a.playIdx === i && a.playing ? ' playing' : '') + '" data-act="say" data-arg="' + esc(l.ru) + '">' + (sp ? '<span class="spkr">' + esc(sp) + '</span>' : '') +
        '<span class="ru">' + esc(stripSpeaker(l.ru)) + '</span>' + (a.hideTr ? '' : '<span class="he">' + esc(l.he.replace(/^[^:]{1,12}: /, '')) + '</span>') + '</button>';
    }).join('') + '</div>';
}
function playAll(u, a) {
  if (!TTS.ok()) { go('tts'); return; }
  a.playing = true; a.playIdx = 0;
  var step = function () {
    if (!a.playing || cur.args !== a) return;
    if (a.playIdx >= u.lines.length) { a.playing = false; render(); return; }
    render(); var txt = u.lines[a.playIdx].ru; TTS.speak(txt);
    var ms = 900 + TTS.clean(txt).length * 85 / (P().settings.rate || 0.9);
    setTimeout(function () { a.playIdx++; step(); }, ms);
  };
  step();
}
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
EX.flash = {
  html: function (ex) {
    var w = ex.w, fl = ex.state.flipped;
    return '<div class="qtitle">זוכרים? הקישו על הכרטיס כדי להפוך אותו</div><div class="flash ' + (fl ? 'flipped' : '') + '" data-act="flip"><div class="inner">' +
      '<div class="face"><span class="ru">' + esc(w.ru) + '</span>' + (P().settings.translit ? '<span class="lat">' + esc(translit(w.ru)) + '</span>' : '') + '</div>' +
      '<div class="face back"><div class="he">' + esc(w.he) + '</div><div style="margin-top:10px"><span class="ru" style="font-size:22px">' + esc(w.ru) + '</span></div></div></div></div>' +
      '<div style="text-align:center">' + speakBtn(w.ru) + '</div>';
  },
  foot: function (ex) {
    if (!ex.state.flipped) return '<button class="btn" data-act="flip">הצגת התשובה</button>';
    return '<div class="grades"><button class="g1" data-act="g" data-arg="1">שוב<small>לא זכרתי</small></button><button class="g3" data-act="g" data-arg="3">קשה<small>בקושי</small></button><button class="g4" data-act="g" data-arg="4">טוב<small>זכרתי</small></button><button class="g5" data-act="g" data-arg="5">קל<small>מיד</small></button></div>';
  },
  on: function (ex, a) {
    return {
      flip: function () { ex.state.flipped = !ex.state.flipped; document.querySelector('.flash').classList.toggle('flipped', ex.state.flipped); document.getElementById('foot').innerHTML = EX.flash.foot(ex); if (ex.state.flipped) TTS.speak(ex.w.ru); },
      g: function (q) {
        q = +q; if (ex.answered) return; ex.answered = true; a.answered++; if (q >= 3) a.correct++;
        if (ex.itemId && !a.graded[ex.itemId]) { a.graded[ex.itemId] = 1; grade(ex.itemId, q); }
        if (q >= 3) { a.xp += 1; addXP(1); } else save();
        if (q < 3 && a.mode !== 'practice' && !ex.retry) a.exs.push({ t: 'flash', w: ex.w, retry: true });
        nextEx(a);
      }
    };
  },
  after: function (ex) { if (P().settings.autoplay && !ex.state.flipped) TTS.speak(ex.w.ru); }
};
var KBD = [['й', 'ц', 'у', 'к', 'е', 'н', 'г', 'ш', 'щ', 'з', 'х', 'ъ'], ['ф', 'ы', 'в', 'а', 'п', 'р', 'о', 'л', 'д', 'ж', 'э'], ['я', 'ч', 'с', 'м', 'и', 'т', 'ь', 'б', 'ю', 'ё']];
EX.type = {
  html: function (ex) {
    var w = ex.w, st = ex.state; st.val = st.val || '';
    var input = st.latin ? '<input class="latin-in" id="latin" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="קירילית או תעתיק לטיני, למשל privet" value="' + esc(st.val) + '">'
      : '<div class="answerbox ' + (st.val ? '' : 'ph') + '" id="abox">' + (st.val ? esc(st.val) + '<span class="caret"></span>' : 'הקלידו ברוסית…') + '</div>';
    var kb = st.latin ? '' : '<div class="kbd">' + KBD.map(function (r, ri) { return '<div class="r">' + r.map(function (k) { return '<button data-act="k" data-arg="' + k + '">' + k + '</button>'; }).join('') + (ri === 2 ? '<button class="w2" data-act="bs">⌫</button>' : '') + '</div>'; }).join('') +
      '<div class="r"><button class="w2" data-act="k" data-arg="-">-</button><button class="sp" data-act="k" data-arg=" ">רווח</button><button class="w2" data-act="hint">💡</button></div></div>';
    return '<div class="qtitle">כתבו ברוסית</div><div class="prompt"><div class="he">' + esc(w.he) + '</div></div>' + input + kb +
      '<button class="switch-kbd" data-act="sw">' + (st.latin ? '⌨️ מקלדת קירילית של האפליקציה' : '🔤 מקלדת הטלפון / תעתיק לטיני') + '</button>';
  },
  foot: function () { return '<button class="btn" data-act="check">בדיקה</button>'; },
  on: function (ex, a) {
    var st = ex.state;
    var upd = function () { var b = document.getElementById('abox'); if (b) { b.className = 'answerbox ' + (st.val ? '' : 'ph'); b.innerHTML = st.val ? esc(st.val) + '<span class="caret"></span>' : 'הקלידו ברוסית…'; } };
    return {
      k: function (k) { if (ex.answered) return; st.val += k; upd(); },
      bs: function () { if (ex.answered) return; st.val = st.val.slice(0, -1); upd(); },
      hint: function () { if (ex.answered) return; var t = plain(ex.w.ru), n = 0; while (n < st.val.length && n < t.length && st.val[n].toLowerCase() === t[n].toLowerCase()) n++; st.val = t.slice(0, n + 1); st.hinted = true; upd(); },
      sw: function () { var li = document.getElementById('latin'); if (li) st.val = li.value; st.latin = !st.latin; render(); if (st.latin) setTimeout(function () { var e = document.getElementById('latin'); if (e) e.focus(); }, 50); },
      check: function () {
        if (ex.answered) return; var li = document.getElementById('latin'); if (li) st.val = li.value;
        if (!st.val.trim()) { toast('כתבו תשובה קודם'); return; }
        var r = checkTyped(st.val, ex.w.ru);
        answer(a, ex, r.ok, { almost: r.almost || st.hinted, answer: (r.ok && !r.almost) ? ansLine(ex.w) : 'התשובה: ' + ansLine(ex.w) + '<br><small class="lat">' + esc(translit(ex.w.ru)) + '</small>', say: ex.w.ru });
      }
    };
  },
  after: function () { var li = document.getElementById('latin'); if (li) li.addEventListener('keydown', function (e) { if (e.key === 'Enter') handlers.check(); }); }
};
EX.match = {
  html: function (ex) {
    var st = ex.state; if (!st.left) { st.left = shuffle(ex.words); st.right = shuffle(ex.words); st.ok = {}; st.err = 0; }
    return '<div class="qtitle">התאימו בין המילה לפירוש</div><div class="match"><div class="col">' +
      st.right.map(function (w) { return '<button class="mt ' + (st.ok['h' + w.id] ? 'ok' : '') + '" data-act="mh" data-arg="' + w.id + '" ' + (st.ok['h' + w.id] ? 'disabled' : '') + '>' + esc(w.he) + '</button>'; }).join('') +
      '</div><div class="col">' + st.left.map(function (w) { return '<button class="mt ' + (st.ok['r' + w.id] ? 'ok' : '') + '" data-act="mr" data-arg="' + w.id + '" ' + (st.ok['r' + w.id] ? 'disabled' : '') + '><span class="ru">' + esc(w.ru) + '</span></button>'; }).join('') + '</div></div>';
  },
  on: function (ex, a) {
    var st = ex.state, byId = {}; ex.words.forEach(function (w) { byId[w.id] = w; });
    var tryPair = function () {
      if (!st.selR || !st.selH) return;
      var r = document.querySelector('[data-act=mr][data-arg="' + st.selR + '"]'), hh = document.querySelector('[data-act=mh][data-arg="' + st.selH + '"]');
      if (byId[st.selR].he === byId[st.selH].he) {
        st.ok['r' + st.selR] = 1; st.ok['h' + st.selH] = 1; [r, hh].forEach(function (e) { e.classList.remove('sel'); e.classList.add('ok'); e.disabled = true; });
        if (Object.keys(st.ok).length >= ex.words.length * 2) answer(a, ex, st.err <= 1, { answer: st.err ? 'טעויות: ' + st.err : '' });
      } else {
        st.err++; beep(false); [r, hh].forEach(function (e) { e.classList.remove('sel'); e.classList.add('err'); setTimeout(function () { e.classList.remove('err'); }, 450); });
      }
      st.selR = st.selH = null;
    };
    return {
      mr: function (id, el) { document.querySelectorAll('[data-act=mr]').forEach(function (e) { e.classList.remove('sel'); }); el.classList.add('sel'); st.selR = id; TTS.speak(byId[id].ru); tryPair(); },
      mh: function (id, el) { document.querySelectorAll('[data-act=mh]').forEach(function (e) { e.classList.remove('sel'); }); el.classList.add('sel'); st.selH = id; tryPair(); }
    };
  }
};
EX.build = {
  html: function (ex) {
    var st = ex.state; if (!st.bank) { st.bank = shuffle(ex.toks.concat(ex.extra)).map(function (t, i) { return { t: t, i: i }; }); st.sel = []; }
    return '<div class="qtitle">סדרו את המשפט ברוסית</div><div class="prompt"><div class="he" style="font-size:20px">' + esc(ex.s.he.replace(/^[^:]{1,12}: /, '')) + '</div></div>' +
      '<div class="buildline">' + st.sel.map(function (i) { return '<button class="tok" data-act="un" data-arg="' + i + '">' + esc(st.bank[i].t) + '</button>'; }).join('') + '</div>' +
      '<div class="tokens">' + st.bank.map(function (b, i) { return '<button class="tok ' + (st.sel.indexOf(i) >= 0 ? 'used' : '') + '" data-act="tk" data-arg="' + i + '">' + esc(b.t) + '</button>'; }).join('') + '</div>';
  },
  foot: function () { return '<button class="btn" data-act="check">בדיקה</button>'; },
  on: function (ex, a) {
    var st = ex.state;
    var redraw = function () { document.getElementById('stage').innerHTML = EX.build.html(ex); };
    return {
      tk: function (i) { if (ex.answered) return; i = +i; if (st.sel.indexOf(i) < 0) { st.sel.push(i); TTS.speak(st.bank[i].t, 1); } redraw(); },
      un: function (i) { if (ex.answered) return; i = +i; st.sel = st.sel.filter(function (x) { return x !== i; }); redraw(); },
      check: function () {
        if (ex.answered) return; if (!st.sel.length) { toast('בחרו מילים קודם'); return; }
        var got = normRu(st.sel.map(function (i) { return st.bank[i].t; }).join(' ')), want = normRu(stripSpeaker(ex.s.ru));
        answer(a, ex, got === want, { answer: '<span class="ru">' + esc(stripSpeaker(ex.s.ru)) + '</span>', say: ex.s.ru });
      }
    };
  }
};

/* ---------- review / practice / dictionary / progress / settings ---------- */
SCREENS.review = function () {
  var p = P(), due = dueItems(), srsIds = Object.keys(p.srs).filter(function (id) { return ITEM[id]; }), t = todayStr();
  var total = srsIds.length;
  var tomorrow = srsIds.filter(function (id) { return p.srs[id].d === addDays(t, 1); }).length;
  var html = '<div class="topbar"><h1>🔁 חזרה חכמה</h1></div><div class="wrap" style="padding-top:0">' +
    '<div class="card" style="text-align:center;padding:26px 16px"><div style="font-size:56px">' + (due.length ? '🧠' : '✅') + '</div><div style="font-size:40px;font-weight:900;color:var(--brand)">' + due.length + '</div><div style="color:var(--muted)">פריטים לחזרה היום</div>' +
    '<div style="margin-top:18px"><button class="btn" data-act="start" ' + (due.length ? '' : 'disabled') + '>' + (due.length ? 'להתחיל חזרה (' + Math.min(due.length, p.settings.reviewSize) + ')' : 'אין מה לחזור עליו כרגע') + '</button></div></div>' +
    '<div class="grid2" style="margin-top:12px"><div class="stat"><b>' + total + '</b><small>פריטים במערכת</small></div><div class="stat"><b>' + tomorrow + '</b><small>לחזרה מחר</small></div></div>' +
    '<div class="card" style="margin-top:12px"><b>איך זה עובד?</b><p style="color:var(--muted);font-size:14px;margin:6px 0 0">כל מילה, אות או כלל דקדוק שלמדתם נכנסים למערכת חזרות מרווחות (בשיטת SM-2). כשעונים נכון, הפריט חוזר אחרי יום, אחר כך אחרי שישה ימים, ואז אחרי מרווחים שהולכים וגדלים. כשטועים, הוא חוזר כבר היום. כך מתרגלים בדיוק את מה שעומד להישכח.</p></div>' +
    (due.length ? '<div class="sec-title">הבאים בתור</div><div class="wlist">' + due.slice(0, 12).map(function (id) {
      var it = ITEM[id], w = it.w;
      if (it.kind === 'q') return '<div class="w"><span class="str s' + strength(id) + '"></span><span class="l"><span class="ru">' + esc(w.q.replace('___', '…')) + '</span></span><span class="he">דקדוק</span></div>';
      if (it.kind === 'letter') return '<button class="w" data-act="say" data-arg="' + esc(w.name) + '"><span class="str s' + strength(id) + '"></span><span class="l"><span class="ru">' + esc(w.letter) + '</span></span><span class="he">' + esc(w.hint) + '</span></button>';
      return wRow(w);
    }).join('') + '</div>' : '') + '</div>';
  view(html, { start: startReview });
};
SCREENS.practice = function (a) {
  var lw = learnedWords(), src = a.src || 'learned';
  var words = src === 'learned' ? lw : src === 'all' ? ALLWORDS : (UNIT[src] && UNIT[src].words) || [];
  var modes = [['flash', '🃏', 'כרטיסיות', 'הופכים ומדרגים לבד'], ['mc_ru_he', '✅', 'בחירה מרובה', 'מרוסית לעברית'], ['mc_he_ru', '🔄', 'בחירה הפוכה', 'מעברית לרוסית'],
    ['type', '⌨️', 'הקלדה', 'מקלדת קירילית או תעתיק'], ['listen', '👂', 'הקשבה', 'שומעים ובוחרים'], ['match', '🧩', 'התאמה', 'זוגות של מילים'], ['build', '🧱', 'בניית משפטים', 'מסדרים את המילים'], ['mix', '🎲', 'מעורב', 'קצת מהכול']];
  var html = '<div class="topbar"><h1>🎯 תרגול חופשי</h1></div><div class="wrap" style="padding-top:0">' +
    '<div class="field"><label>מה לתרגל?</label><select class="sel" id="src"><option value="learned"' + (src === 'learned' ? ' selected' : '') + '>מילים שלמדתי (' + lw.length + ')</option><option value="all"' + (src === 'all' ? ' selected' : '') + '>כל המילים בקורס (' + ALLWORDS.length + ')</option>' +
    UNITS.filter(function (u) { return u.type === 'vocab'; }).map(function (u) { return '<option value="' + u.id + '"' + (src === u.id ? ' selected' : '') + '>' + u.level + ' · ' + esc(u.title) + ' (' + u.words.length + ')</option>'; }).join('') + '</select></div>' +
    (words.length ? '' : '<div class="warn">עדיין אין מילים שלמדתם. בחרו יחידה מהרשימה, או התחילו שיעור במסך הבית.</div>') +
    '<div class="tiles" style="margin-top:12px">' + modes.map(function (m) { return '<button class="tile" data-act="m" data-arg="' + m[0] + '"><div class="e">' + m[1] + '</div><b>' + m[2] + '</b><small>' + m[3] + '</small></button>'; }).join('') + '</div></div>';
  view(html, {
    m: function (mode) {
      if (mode === 'listen' && !TTS.ok()) { toast('צריך קול רוסי כדי לתרגל הקשבה'); go('tts'); return; }
      startPractice(mode, words, modes.filter(function (x) { return x[0] === mode; })[0][2]);
    }
  });
  var sel = document.getElementById('src'); sel.onchange = function () { a.src = sel.value; render(); };
};
SCREENS.dict = function (a) {
  var q = a.q || '';
  var nq = normRu(q), lq = /[a-z]/i.test(q) ? normLat(q) : '';
  var qt = q.trim();
  var score = function (w) {
    var r = normRu(w.ru), hw = w.he.split(/[\s,;()]+/);
    if ((nq && r === nq) || hw.indexOf(qt) >= 0) return 0;
    if ((nq && r.indexOf(nq) === 0) || w.he.indexOf(qt) === 0 || hw.some(function (x) { return x.indexOf(qt) === 0 || x.replace(/^[והבלמשכ]/, '') === qt; })) return 1;
    if ((nq && r.indexOf(nq) >= 0) || (lq && normLat(translit(w.ru)).indexOf(lq) >= 0)) return 2;
    if (w.he.indexOf(qt) >= 0) return 3;
    return 9;
  };
  var res = qt ? ALLWORDS.map(function (w) { return { w: w, s: score(w) }; }).filter(function (x) { return x.s < 9; }).sort(function (a, b) { return a.s - b.s; }).slice(0, 80).map(function (x) { return x.w; }) : learnedWords().slice(-40).reverse();
  var html = '<div class="topbar"><h1>📚 מילון</h1></div><div class="wrap" style="padding-top:0"><input class="search" id="q" placeholder="חיפוש בעברית, ברוסית או בתעתיק…" value="' + esc(q) + '">' +
    '<div class="sec-sub" style="margin:10px 4px">' + (qt ? res.length + ' תוצאות' : (res.length ? 'מילים שלמדתם לאחרונה' : 'בקורס יש ' + ALLWORDS.length + ' מילים וביטויים. התחילו לחפש!')) + '</div>' +
    '<div class="wlist">' + (res.length ? res.map(function (w) { return wRow(w, '<small class="pill" style="margin-top:3px">' + esc(UNIT[w.unit].title) + '</small>'); }).join('') : '<div class="empty"><div class="e">🔎</div>' + (q ? 'לא נמצאו תוצאות' : '') + '</div>') + '</div></div>';
  view(html, {}, { keepScroll: true });
  var inp = document.getElementById('q');
  inp.oninput = function () { a.q = inp.value; var pos = inp.selectionStart; render(); var n = document.getElementById('q'); n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) {} };
};
SCREENS.progress = function () {
  var p = P(), t = todayStr(), days = [];
  for (var i = 13; i >= 0; i--) { var d = addDays(t, -i); days.push({ d: d, xp: p.daily[d] || 0 }); }
  var max = Math.max(p.goal, Math.max.apply(null, days.map(function (x) { return x.xp; })));
  var ids = Object.keys(p.srs), words = ids.filter(function (id) { return ITEM[id] && ITEM[id].kind === 'word'; }), mastered = words.filter(function (id) { return p.srs[id].i >= 21; }).length;
  var lessonKeys = {}; UNITS.forEach(function (u) { LESSONS[u.id].forEach(function (l) { lessonKeys[l.key] = true; }); });
  var lessonsDone = Object.keys(p.done).filter(function (k) { return lessonKeys[k]; }).length, totalLessons = Object.keys(lessonKeys).length;
  var acc = p.answered ? Math.round(p.correct * 100 / p.answered) : 0;
  var weak = words.filter(function (id) { return p.srs[id].l > 0; }).sort(function (a, b) { return p.srs[b].l - p.srs[a].l || p.srs[a].e - p.srs[b].e; }).slice(0, 8);
  var dn = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
  var html = '<div class="topbar"><h1>📈 ההתקדמות של ' + esc(p.name) + '</h1><button class="iconbtn" data-act="set">⚙️</button></div><div class="wrap" style="padding-top:0">' +
    '<div class="grid2"><div class="stat"><b>🔥 ' + curStreak() + '</b><small>ימי רצף (שיא: ' + (p.best || 0) + ')</small></div><div class="stat"><b>⭐ ' + p.xp + '</b><small>XP בסך הכול</small></div>' +
    '<div class="stat"><b>' + words.length + '</b><small>מילים שנלמדו</small></div><div class="stat"><b>' + mastered + '</b><small>מילים בשליטה מלאה</small></div>' +
    '<div class="stat"><b>' + lessonsDone + '/' + totalLessons + '</b><small>שיעורים שהושלמו</small></div><div class="stat"><b>' + acc + '%</b><small>דיוק כללי</small></div></div>' +
    '<div class="sec-title">XP ב־14 הימים האחרונים</div><div class="card"><div class="chart">' + days.map(function (x) {
      var dt = new Date(x.d + 'T12:00:00'); return '<div class="c"><small>' + (x.xp || '') + '</small><i class="' + (x.xp >= p.goal ? 'met' : '') + '" style="height:' + Math.round(x.xp * 100 / max) + '%"></i><small>' + dn[dt.getDay()] + '</small></div>';
    }).join('') + '</div><div class="sec-sub" style="margin:8px 0 0">ירוק = יום שבו עמדתם ביעד (' + p.goal + ' XP)</div></div>' +
    '<div class="sec-title">התקדמות לפי רמה</div><div class="card">' + COURSE.levels.map(function (l) { var pc = levelProgress(l.id); return '<div class="lvl"><span class="badge" style="background:' + l.color + '">' + l.id + '</span><div class="bar"><i style="width:' + pc + '%"></i></div><small>' + pc + '%</small></div>'; }).join('') + '</div>' +
    (weak.length ? '<div class="sec-title">מילים שכדאי לחזק</div><div class="wlist">' + weak.map(function (id) { return wRow(ITEM[id].w); }).join('') + '</div>' : '') +
    '<div style="height:14px"></div><button class="btn sec" data-act="switch">👥 החלפת פרופיל</button></div>';
  view(html, { set: function () { go('settings'); }, switch: function () { DB.current = null; save(); tab('profiles'); } });
};
SCREENS.settings = function () {
  var p = P(), s = p.settings, ts = TTS.state();
  var tsLabel = { ok: '✅ קול רוסי זמין', init: '⏳ בודק…', missing: '⚠️ חסרים נתוני קול רוסי', nolang: '⚠️ מנוע ההקראה לא תומך ברוסית', error: '⚠️ מנוע ההקראה לא זמין', none: '⚠️ אין תמיכה בהקראה' }[ts] || ts;
  var eng = ''; try { if (TTS.native) eng = AndroidTTS.engine(); } catch (e) {}
  var tg = function (k, label, sub) { return '<div class="setrow"><div class="l"><b>' + label + '</b>' + (sub ? '<small>' + sub + '</small>' : '') + '</div><button class="tgl ' + (s[k] ? 'on' : '') + '" data-act="tg" data-arg="' + k + '"></button></div>'; };
  var html = topbar('הגדרות') + '<div class="wrap" style="padding-top:0">' +
    '<div class="card" style="display:flex;align-items:center;gap:14px"><div style="font-size:44px">' + p.avatar + '</div><div style="flex:1"><b style="font-size:18px">' + esc(p.name) + '</b><div style="color:var(--muted);font-size:13px">לומד/ת מאז ' + p.created + '</div></div><button class="btn small sec" data-act="rename">✏️ שם</button></div>' +
    '<div class="sec-title">לימוד</div><div class="card">' +
    '<div class="setrow"><div class="l"><b>יעד יומי (XP)</b></div><div class="seg">' + [20, 30, 50, 80].map(function (g) { return '<button data-act="goal" data-arg="' + g + '" class="' + (p.goal === g ? 'on' : '') + '">' + g + '</button>'; }).join('') + '</div></div>' +
    '<div class="setrow"><div class="l"><b>פריטים בכל חזרה</b></div><div class="seg">' + [10, 20, 40].map(function (g) { return '<button data-act="rs" data-arg="' + g + '" class="' + (s.reviewSize === g ? 'on' : '') + '">' + g + '</button>'; }).join('') + '</div></div>' +
    tg('translit', 'תעתיק לטיני', 'למשל privét מתחת למילה') + tg('autoplay', 'השמעה אוטומטית', 'משמיע כל מילה חדשה') + tg('sounds', 'צלילי משוב', 'צליל לתשובה נכונה ולתשובה שגויה') + '</div>' +
    '<div class="sec-title">הגייה</div><div class="card"><div class="setrow"><div class="l"><b>מצב הקול</b><small>' + tsLabel + (eng ? ' · ' + esc(eng) : '') + '</small></div><button class="btn small sec" data-act="test">🔊 בדיקה</button></div>' +
    '<div class="setrow" style="display:block"><b>מהירות דיבור: ' + s.rate.toFixed(2) + '</b><input type="range" min="0.5" max="1.2" step="0.05" value="' + s.rate + '" id="rate"></div>' +
    '<div class="setrow"><div class="l"><b>התקנת קול רוסי</b><small>הוראות ל־Samsung Galaxy</small></div><button class="btn small sec" data-act="tts">📖 הוראות</button></div></div>' +
    '<div class="sec-title">תצוגה</div><div class="card"><div class="setrow"><div class="l"><b>ערכת נושא</b></div><div class="seg">' + [['auto', 'אוטומטית'], ['light', 'בהירה'], ['dark', 'כהה']].map(function (t) { return '<button data-act="theme" data-arg="' + t[0] + '" class="' + (s.theme === t[0] ? 'on' : '') + '">' + t[1] + '</button>'; }).join('') + '</div></div></div>' +
    '<div class="sec-title">נתונים</div><div class="card"><div class="setrow"><div class="l"><b>גיבוי</b><small>העתקה או שחזור של כל הפרופילים כטקסט</small></div><button class="btn small sec" data-act="backup">💾 גיבוי</button></div>' +
    '<div class="setrow"><div class="l"><b>החלפת פרופיל</b></div><button class="btn small sec" data-act="switch">👥</button></div>' +
    '<div class="setrow"><div class="l"><b style="color:var(--bad)">מחיקת הפרופיל</b><small>מוחק את כל ההתקדמות של ' + esc(p.name) + '</small></div><button class="btn small bad" data-act="del">🗑</button></div></div>' +
    '<p class="sec-sub" style="text-align:center;margin-top:18px">רוסית בכיס 1.1 · עובד בלי אינטרנט · כל הנתונים נשמרים רק במכשיר</p></div>';
  view(html, {
    tg: function (k) { s[k] = !s[k]; save(); render(); },
    goal: function (g) { p.goal = +g; save(); render(); },
    rs: function (g) { s.reviewSize = +g; save(); render(); },
    theme: function (t) { s.theme = t; save(); applyTheme(); render(); },
    test: function () { if (!TTS.ok()) { go('tts'); return; } TTS.speak('Приве́т! Я говорю́ по-ру́сски.'); },
    tts: function () { go('tts'); },
    switch: function () { DB.current = null; save(); tab('profiles'); },
    rename: function () {
      modal('<h3>שינוי שם</h3><div class="field"><input type="text" id="nn" maxlength="20" value="' + esc(p.name) + '"></div><button class="btn" data-act="ok">שמירה</button>',
        { ok: function () { var v = document.getElementById('nn').value.trim(); if (v) { p.name = v; save(); } closeModal(); render(); } });
    },
    backup: function () {
      modal('<h3>גיבוי ושחזור</h3><p>העתיקו את הטקסט ושמרו אותו (למשל בהודעה לעצמכם). כדי לשחזר, הדביקו כאן טקסט גיבוי ולחצו על "שחזור".</p><div class="field"><textarea id="bk" rows="6" style="direction:ltr;font-size:12px">' + esc(JSON.stringify(DB)) + '</textarea></div><div class="btnrow"><button class="btn sec" data-act="cp">📋 העתקה</button><button class="btn" data-act="rs">♻️ שחזור</button></div>',
        { cp: function () { var t = document.getElementById('bk'); t.select(); try { document.execCommand('copy'); toast('הועתק'); } catch (e) {} },
          rs: function () { try { var d = JSON.parse(document.getElementById('bk').value); if (!d.profiles) throw 0; DB = d; pruneProgress(); save(); closeModal(); tab(P() ? 'home' : 'profiles'); toast('השחזור הצליח'); } catch (e) { toast('טקסט הגיבוי לא תקין'); } } });
    },
    del: function () {
      modal('<h3>למחוק את ' + esc(p.name) + '?</h3><p>כל ההתקדמות של הפרופיל הזה תימחק לצמיתות.</p><div class="btnrow"><button class="btn sec" data-act="no">ביטול</button><button class="btn bad" data-act="yes">מחיקה</button></div>',
        { no: closeModal, yes: function () { DB.profiles = DB.profiles.filter(function (x) { return x.id !== p.id; }); DB.current = null; save(); closeModal(); tab('profiles'); } });
    }
  }, { keepScroll: true });
  var r = document.getElementById('rate'); r.onchange = function () { s.rate = +r.value; save(); TTS.speak('Здра́вствуйте!'); render(); };
};
SCREENS.tts = function () {
  var ts = TTS.state(), native = TTS.native;
  var html = topbar('הגייה בקול רוסי') + '<div class="wrap" style="padding-top:0">' +
    '<div class="card" style="text-align:center"><div style="font-size:50px">' + (ts === 'ok' ? '🔊' : '🔇') + '</div><b style="font-size:18px">' + (ts === 'ok' ? 'הקול הרוסי מותקן ועובד!' : 'הקול הרוסי עדיין לא זמין') + '</b>' +
    '<p style="color:var(--muted);font-size:14px">האפליקציה משתמשת במנוע ההקראה (Text-to-Speech) של הטלפון. אחרי שמתקינים את הקול הרוסי, ההגייה עובדת גם בלי אינטרנט.</p>' +
    (native ? '<div class="btnrow"><button class="btn" data-act="install">⬇️ התקנת קול רוסי</button></div><div class="btnrow"><button class="btn sec" data-act="settings">⚙️ הגדרות הקראה</button><button class="btn sec" data-act="recheck">🔄 בדיקה חוזרת</button></div>' : '') +
    '<div class="btnrow"><button class="btn sec" data-act="test">🔊 נסו: <span class="ru">Приве́т!</span></button></div></div>' +
    '<div class="sec-title">התקנה ידנית ב־Samsung Galaxy S25+</div><div class="card"><ol class="steps">' +
    '<li>פותחים את <b>הגדרות</b> ← <b>ניהול כללי</b> ← <b>שפה</b> (או <b>שפה וקלט</b>) ← <b>המרת טקסט לדיבור</b>.</li>' +
    '<li>בשדה <b>מנוע מועדף</b> בוחרים ב־<b>Google</b> (שירותי הדיבור של Google). אם הוא לא מופיע, מתקינים מ־Google Play את האפליקציה <b>Speech Recognition and Synthesis from Google</b>.</li>' +
    '<li>מקישים על גלגל השיניים ⚙️ שליד המנוע ← <b>התקנת נתוני קול</b> ← <b>Русский (Россия)</b> ← הורדה.</li>' +
    '<li>חוזרים לאפליקציה ומקישים על <b>בדיקה חוזרת</b>.</li></ol>' +
    '<p style="color:var(--muted);font-size:13px;margin:0">ייתכן שגם מנוע ההקראה של סמסונג (Samsung TTS) תומך ברוסית, אבל המנוע של Google נשמע בדרך כלל טבעי יותר.</p></div>' +
    '<div class="card" style="margin-top:12px"><b>אין קול?</b><p style="color:var(--muted);font-size:14px;margin:6px 0 0">אפשר ללמוד גם בלעדיו: תרגילי ההקשבה מוחלפים אוטומטית בתרגילי בחירה, והתעתיק הלטיני וסימני ההטעמה עוזרים לבטא נכון.</p></div></div>';
  view(html, {
    install: function () { try { AndroidTTS.installVoice(); } catch (e) {} },
    settings: function () { try { AndroidTTS.openSettings(); } catch (e) {} },
    recheck: function () { try { AndroidTTS.recheck(); } catch (e) {} toast('בודק…'); setTimeout(render, 1500); },
    test: function () { TTS.speak('Приве́т! Как дела́?'); if (!TTS.ok()) toast('הקול הרוסי עדיין לא זמין'); }
  });
};

/* ---------- demo data (browser preview / screenshots only, via ?demo=1) ---------- */
function seedDemo() {
  var p1 = newProfile('יגאל', '🦊', 30, 'A0'), p2 = newProfile('החברה של יגאל', '🦄', 20, 'A0'), t = todayStr();
  [[p1, 26], [p2, 14]].forEach(function (pp) {
    var p = pp[0], nUnits = pp[1];
    UNITS.slice(0, nUnits).forEach(function (u, ui) {
      LESSONS[u.id].forEach(function (l, i) {
        if (ui === nUnits - 1 && i > 0) return; p.done[l.key] = t;
        (l.items || []).forEach(function (w, k) { var n = 1 + (k % 4); p.srs[w.id] = { e: 2.3 + (k % 3) * 0.1, n: n, i: [1, 6, 15, 30][n - 1], d: addDays(t, (k % 5) - 2), l: k % 7 === 0 ? 1 : 0 }; });
      });
    });
    var hist = [35, 42, 0, 28, 60, 31, 45, 38, 22, 50, 33, 41, 36, 18];
    for (var i = 13; i >= 0; i--) { var v = hist[13 - i]; if (v) p.daily[addDays(t, -i)] = v; }
    p.xp = 1240; p.streak = 9; p.best = 14; p.lastDay = t; p.answered = 900; p.correct = 812;
  });
  p2.xp = 610; p2.streak = 4;
  DB = { profiles: [p1, p2], current: p1.id }; save();
}

/* ---------- boot ---------- */
load();
var qs = location.search || '';
if (/demo=1/.test(qs) && !DB.profiles.length) seedDemo();
if (/demotts=1/.test(qs)) window.__demoTTS = true;
initWebVoices();
applyTheme();
if (window.matchMedia) try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme); } catch (e) {}
tab(P() ? 'home' : 'profiles');
window.App = { go: go, tab: tab, back: back, render: render, startLesson: function (id, i) { startLesson(UNIT[id], i || 0); }, startReview: startReview, startPractice: startPractice,
  UNIT: UNIT, ALLWORDS: ALLWORDS, translit: translit, checkTyped: checkTyped, P: P, cur: function () { return cur; },
  stats: function () { return { units: UNITS.length, words: ALLWORDS.length, letters: ALLLETTERS.length, sentences: ALLSENT.length }; } };
})();
