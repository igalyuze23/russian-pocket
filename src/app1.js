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
  if (u.type === 'vocab') chunk(u.words, 8).forEach(function (c, i) { ls.push({ key: u.id + ':' + i, title: 'שיעור ' + (i + 1), items: c }); });
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
