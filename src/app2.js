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
