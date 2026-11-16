const { chromium } = require('playwright-core');
const path = require('path');
const EXE = process.env.HOME + '/.cache/ms-playwright/chromium-1255/chrome-linux64/chrome';
const URL = 'file://' + path.resolve(__dirname, '../android/assets/www/index.html');
const OUT = path.resolve(__dirname, '../screenshots');
(async () => {
  const browser = await chromium.launch({ executablePath: EXE, args: ['--autoplay-policy=no-user-gesture-required'] });
  const ctx = await browser.newContext({ viewport: { width: 412, height: 892 }, deviceScaleFactor: 2.625, locale: 'he-IL', isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  const shot = async (name, full) => { await page.waitForTimeout(350); await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: !!full }); console.log('shot', name); };

  // 1. Fresh start: profile creation
  await page.goto(URL); await shot('01-welcome');
  await page.click('[data-act=add]'); await page.fill('#pname', 'יגאל'); await page.click('[data-act=av][data-arg="🦊"]');
  await shot('02-new-profile');
  await page.click('[data-act=create]'); await shot('03-home-fresh');
  // 2. Demo data with a working (simulated) voice
  await page.evaluate(() => localStorage.clear());
  await page.goto(URL + '?demo=1&demotts=1'); await page.click('[data-act=tab][data-arg=home]').catch(()=>{});
  await shot('04-home');
  await shot('04b-home-full', true);
  await page.evaluate(() => App.go('unit', { id: 'abc4' })); await shot('05-unit-alphabet');
  await page.evaluate(() => App.startLesson('abc4', 0)); await shot('06-lesson-new-letter');
  await page.click('[data-act=next]'); await shot('07-letter-sound');
  await page.evaluate(() => App.tab('home'));
  await page.evaluate(() => App.go('unit', { id: 'food' })); await shot('08-unit-vocab');
  await page.evaluate(() => App.startLesson('food', 2)); await shot('09-learn-word');
  await page.click('[data-act=next]'); await page.click('[data-act=next]'); await page.click('[data-act=next]'); await page.click('[data-act=next]');
  await shot('10-mc');
  await page.click('.opt >> nth=0'); await shot('11-mc-feedback');
  await page.evaluate(() => App.startPractice('listen', App.UNIT.food.words, 'הקשבה')); await shot('12-listen');
  await page.evaluate(() => App.startPractice('type', App.UNIT.family.words, 'הקלדה')); 
  const he = await page.evaluate(() => App.cur().args.exs[0].w.ru.replace(/\u0301/g, ''));
  for (const ch of he.toLowerCase()) { if (ch === ' ') await page.click('[data-act=k][data-arg=" "]'); else await page.click(`[data-act=k][data-arg="${ch}"]`).catch(()=>{}); }
  await shot('13-type-cyrillic');
  await page.click('[data-act=check]'); await shot('14-type-correct');
  await page.evaluate(() => App.startPractice('type', App.UNIT.greet.words.filter(w=>w.ru.startsWith('приве')), 'הקלדה'));
  await page.click('[data-act=sw]'); await page.fill('#latin', 'privet'); await shot('15-type-latin');
  await page.click('[data-act=check]'); await shot('16-type-latin-ok');
  await page.evaluate(() => App.startPractice('match', App.UNIT.city.words, 'התאמה'));
  await page.click('[data-act=mr] >> nth=0'); await shot('17-match');
  await page.evaluate(() => App.startPractice('build', App.UNIT.food.words, 'בניית משפטים'));
  const toks = await page.evaluate(() => App.cur().args.exs[0].toks);
  const bank = await page.evaluate(() => App.cur().args.exs[0]);
  // click correct tokens in order
  for (const t of toks) { await page.evaluate((t) => { const st = App.cur().args.exs[0].state; const i = st.bank.findIndex((b, j) => b.t === t && st.sel.indexOf(j) < 0); document.querySelector('[data-act=tk][data-arg="' + i + '"]').click(); }, t); }
  await shot('18-build');
  await page.click('[data-act=check]'); await shot('19-build-correct');
  await page.evaluate(() => App.startPractice('flash', App.UNIT.time.words, 'כרטיסיות')); await shot('20-flash-front');
  await page.click('[data-act=flip] >> nth=0'); await page.waitForTimeout(600); await shot('21-flash-back');
  await page.evaluate(() => App.tab('home'));
  await page.evaluate(() => App.go('unit', { id: 'g_prep' })); await shot('22-grammar', false); await shot('22b-grammar-full', true);
  await page.evaluate(() => App.startLesson('g_prep', 0));
  for (let k = 0; k < 4; k++) { const t = await page.evaluate(() => App.cur().args.exs[App.cur().args.i].t); if (t === 'gq') break; await page.evaluate(() => { App.cur().args.i++; App.render(); }); }
  await shot('23-grammar-quiz');
  await page.click('.opt >> nth=1'); await shot('24-grammar-feedback');
  await page.evaluate(() => App.tab('home'));
  await page.evaluate(() => App.go('unit', { id: 'r_cafe' })); await shot('25-reading-dialogue');
  await page.evaluate(() => App.go('unit', { id: 'r_lit' })); await shot('26-reading-literature');
  await page.evaluate(() => App.tab('review')); await shot('27-review');
  await page.evaluate(() => App.startReview()); await shot('28-review-session');
  await page.evaluate(() => App.tab('practice')); await shot('29-practice');
  await page.evaluate(() => App.tab('dict')); await page.fill('#q', 'מים'); await page.waitForTimeout(200); await shot('30-dictionary');
  await page.evaluate(() => App.tab('progress')); await shot('31-progress', true);
  await page.evaluate(() => App.go('settings')); await shot('32-settings', true);
  await page.evaluate(() => App.go('tts')); await shot('33-tts-help', true);
  await page.evaluate(() => App.tab('profiles')); await shot('34-profiles');
  // Dark theme
  await page.evaluate(() => { App.P(); }); await page.click('[data-act=pick] >> nth=0');
  await page.evaluate(() => { const p = App.P(); p.settings.theme = 'dark'; localStorage.setItem('rusPocket.v1', localStorage.getItem('rusPocket.v1')); });
  await page.evaluate(() => App.go('settings')); await page.click('[data-act=theme][data-arg=dark]'); await page.evaluate(() => App.tab('home')); await shot('35-home-dark');
  await page.evaluate(() => App.startLesson('verbs', 1)); await page.click('[data-act=next]'); await page.click('[data-act=next]');await page.click('[data-act=next]');await page.click('[data-act=next]'); await shot('36-lesson-dark');
  await page.evaluate(() => App.go('settings')); await page.click('[data-act=theme][data-arg=light]');
  // Missing-voice state (real headless chrome has no Russian voice)
  await page.goto(URL); await page.waitForTimeout(1800); await page.evaluate(() => App.tab('home')); await shot('37-home-no-voice');
  console.log('ERRORS', JSON.stringify(errors));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
