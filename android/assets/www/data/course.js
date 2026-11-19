/* Course registry. Stress is written in source as an apostrophe after the stressed vowel
   (молоко') and converted to a combining acute accent (U+0301) at load time. */
(function () {
  var C = window.COURSE = { units: [], levels: [
    { id: 'A0', name: 'צעדים ראשונים', sub: 'אלפבית, צלילים ומילים ראשונות', color: '#10B981' },
    { id: 'A1', name: 'מתחילים', sub: 'מספרים, משפחה, אוכל, בית ועיר', color: '#3B82F6' },
    { id: 'A2', name: 'בסיסי', sub: 'יחסות, עבר ועתיד, טיולים ועבודה', color: '#8B5CF6' },
    { id: 'B1', name: 'בינוני', sub: 'אספקטים, פעלי תנועה, טקסטים', color: '#F59E0B' },
    { id: 'B2', name: 'רוסית ליום-יום', sub: 'מכולת, משפחה, רופא, תחבורה וטלפון', color: '#EF4444' }
  ] };
  var ACC = '\u0301';
  function stress(s) { return (s || '').replace(/([аеёиоуыэюяАЕЁИОУЫЭЮЯ])'/g, '$1' + ACC); }
  function lines(t) { return (t || '').split('\n').map(function (l) { return l.trim(); }).filter(function (l) { return l && l.charAt(0) !== '#'; }); }
  function pairs(t) {
    return lines(t).map(function (l) {
      var i = l.lastIndexOf(' = ');
      return i < 0 ? null : { ru: stress(l.slice(0, i).trim()), he: l.slice(i + 3).trim() };
    }).filter(Boolean);
  }
  function quiz(t) {
    return lines(t).map(function (l) {
      var he = '', i = l.lastIndexOf(' = ');
      if (i >= 0) { he = l.slice(i + 3).trim(); l = l.slice(0, i); }
      var p = l.split('|').map(function (x) { return stress(x.trim()); });
      return { q: p[0], options: p.slice(1), answer: p[1], he: he };
    });
  }
  C.stress = stress; C.pairs = pairs; C.quiz = quiz;
  C.unit = function (o) {
    o.type = 'vocab';
    o.words = pairs(o.words).map(function (w, i) { w.id = o.id + ':' + i; w.unit = o.id; return w; });
    o.sentences = pairs(o.sentences);
    C.units.push(o);
  };
  C.alphabet = function (o) {
    o.type = 'alphabet';
    o.letters = lines(o.letters).map(function (l) { return l.split('|').map(function (x) { return x.trim(); }); }).map(function (a, i) {
      return { id: o.id + ':' + i, unit: o.id, letter: a[0], name: a[1], lat: a[2], hint: a[3], ru: stress(a[4]), he: a[5], isLetter: true };
    });
    o.words = o.letters.map(function (l) { return { id: l.id + 'w', unit: o.id, ru: l.ru, he: l.he }; });
    C.units.push(o);
  };
  C.grammar = function (o) {
    o.type = 'grammar';
    o.html = stress(o.html);
    o.examples = pairs(o.examples);
    o.quiz = quiz(o.quiz);
    C.units.push(o);
  };
  C.reading = function (o) {
    o.type = 'reading';
    o.lines = pairs(o.text);
    o.questions = quiz(o.questions);
    if (o.intro) o.intro = stress(o.intro);
    C.units.push(o);
  };
})();
