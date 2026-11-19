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
