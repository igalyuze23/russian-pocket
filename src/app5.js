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
    '<p class="sec-sub" style="text-align:center;margin-top:18px">רוסית בכיס 1.0 · עובד בלי אינטרנט · כל הנתונים נשמרים רק במכשיר</p></div>';
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
          rs: function () { try { var d = JSON.parse(document.getElementById('bk').value); if (!d.profiles) throw 0; DB = d; save(); closeModal(); tab(P() ? 'home' : 'profiles'); toast('השחזור הצליח'); } catch (e) { toast('טקסט הגיבוי לא תקין'); } } });
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
