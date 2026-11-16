const { chromium } = require('playwright-core');
const path = require('path');
const EXE = process.env.HOME + '/.cache/ms-playwright/chromium-1255/chrome-linux64/chrome';
const URL = 'file://' + path.resolve(__dirname, '../android/assets/www/index.html');
(async () => {
  const browser = await chromium.launch({ executablePath: EXE });
  const page = await (await browser.newContext({ viewport: { width: 412, height: 892 } })).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(URL + '?demotts=' + (process.argv[2] === 'novoice' ? '0' : '1'));
  await page.click('[data-act=add]'); await page.fill('#pname', 'בדיקה'); await page.click('[data-act=create]');
  const plan = await page.evaluate(() => Object.keys(App.UNIT).map(id => [id, document && 0]).map(([id]) => id));
  let lessons = 0, steps = 0, typesSeen = {};
  for (const id of plan) {
    const n = await page.evaluate(id => { App.go('unit', { id }); return document.querySelectorAll('[data-act=lesson]').length; }, id);
    for (let i = 0; i < n; i++) {
      await page.evaluate(([id, i]) => App.startLesson(id, i), [id, i]);
      for (let guard = 0; guard < 300; guard++) {
        const st = await page.evaluate(() => {
          const c = App.cur(); if (!c || c.name !== 'lesson') return 'out';
          if (document.querySelector('.endscr')) return 'end';
          const a = c.args, ex = a.exs[a.i]; window.__t = ex.t;
          const nx = document.querySelector('.foot [data-act=next]'); if (nx) { nx.click(); return 'next:' + ex.t; }
          const right = Math.random() < 0.8;
          if (document.querySelector('.opt')) {
            const opts = [...document.querySelectorAll('.opt')];
            let correct = ex.t === 'mc_ru_he' ? ex.w.he : (ex.t === 'gq' || ex.t === 'rq') ? ex.q.answer : (ex.t === 'letter_listen') ? ex.w.letter : ex.t === 'letter_sound' ? null : ex.w.ru;
            let idx = correct ? ex.opts.indexOf(correct) : Math.floor(Math.random() * opts.length);
            if (!right || idx < 0) idx = Math.floor(Math.random() * opts.length);
            opts[idx].click(); return 'mc:' + ex.t;
          }
          if (ex.t === 'type') { ex.state.val = right ? ex.w.ru.replace(/\u0301/g, '') : 'ббб'; document.querySelector('[data-act=check]').click(); return 'type'; }
          if (ex.t === 'build') { const st = ex.state; const toks = right ? ex.toks : ex.toks.slice().reverse(); toks.forEach(t => { const j = st.bank.findIndex((b, k) => b.t === t && st.sel.indexOf(k) < 0); document.querySelector('[data-act=tk][data-arg="' + j + '"]').click(); }); document.querySelector('[data-act=check]').click(); return 'build'; }
          if (ex.t === 'match') { ex.words.forEach(w => { document.querySelector('[data-act=mr][data-arg="' + w.id + '"]').click(); document.querySelector('[data-act=mh][data-arg="' + w.id + '"]').click(); }); return 'match'; }
          if (ex.t === 'flash') { const f = document.querySelector('[data-act=flip]'); if (!ex.state.flipped) { f.click(); } document.querySelector('[data-act=g][data-arg="4"]').click(); return 'flash'; }
          const any = document.querySelector('.foot [data-act]'); if (any) { any.click(); return 'click:' + ex.t; }
          return 'stuck:' + ex.t;
        });
        steps++;
        const k = st.split(':')[1]; if (k) typesSeen[k] = (typesSeen[k] || 0) + 1;
        if (st === 'end') { lessons++; await page.click('[data-act=done]'); break; }
        if (st.startsWith('stuck') || st === 'out') { console.log('PROBLEM', id, i, st); break; }
      }
    }
  }
  const sum = await page.evaluate(() => { const p = App.P(); return { xp: p.xp, srs: Object.keys(p.srs).length, done: Object.keys(p.done).length, streak: p.streak }; });
  // review + practice modes
  await page.evaluate(() => App.startReview());
  const rv = await page.evaluate(() => App.cur().args.exs.length);
  for (const m of ['flash', 'mc_ru_he', 'mc_he_ru', 'type', 'listen', 'match', 'build', 'mix']) await page.evaluate(m => App.startPractice(m, App.ALLWORDS.slice(0, 40), m), m);
  // translit + answer-check spot tests
  const tl = await page.evaluate(() => ['здра́вствуйте', 'приве́т', 'сего́дня', 'хоро́шего', 'ёлка', 'жёлтый', 'солове́й', 'Что э́то?', 'де́ти', 'съесть', 'семья́', 'большо́й', 'мно́го', 'учи́ться'].map(w => w + ' → ' + App.translit(w)));
  const ck = await page.evaluate(() => [['привет', 'приве́т'], ['privet', 'приве́т'], ['zdravstvuyte', 'здра́вствуйте'], ['spasibo', 'спаси́бо'], ['spasiba', 'спаси́бо'], ['хорошо', 'хорошо́'], ['харашо', 'хорошо́'], ['ёлка', 'ёлка'], ['елка', 'ёлка'], ['bolshoy', 'большо́й'], ['bolshoi', 'большо́й'], ['brat', 'сестра́'], ['как дела', 'как дела́?']].map(([a, b]) => a + ' vs ' + b + ' → ' + JSON.stringify(App.checkTyped(a, b))));
  console.log(JSON.stringify({ lessons, steps, typesSeen, sum, reviewQueue: rv, errors }, null, 1));
  console.log(tl.join('\n')); console.log(ck.join('\n'));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
