/* ═══════════════════════════════════════════════════════════
   game.js — שכבת המשחוק (גיימיפיקציה)
   נקודות XP · רמות · צלילים · מסלול שבועי · מפת קורס
   נטען אחרי site.js ומשתמש ב-window.N5
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (!window.N5) return;
  var store = N5.store;

  var weekM = decodeURIComponent(location.pathname).match(/N5-week(\d+)-lesson/);
  var WEEK = weekM ? +weekM[1] : null;
  var PAGE = WEEK ? 'lesson' : (document.body.dataset.page || 'other');
  var TOTAL_WEEKS = 20;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ═══════════ צלילים (WebAudio) ═══════════ */
  var actx = null;
  function sfxOn() { return store.get('sfx', true); }
  function tone(freq, t0, dur, type, gain) {
    try {
      if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
      var o = actx.createOscillator(), g = actx.createGain();
      o.type = type || 'sine'; o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, actx.currentTime + t0);
      g.gain.exponentialRampToValueAtTime(gain || 0.12, actx.currentTime + t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + t0 + dur);
      o.connect(g); g.connect(actx.destination);
      o.start(actx.currentTime + t0); o.stop(actx.currentTime + t0 + dur + 0.05);
    } catch (e) { }
  }
  function sfxCorrect() { if (!sfxOn()) return; tone(660, 0, .12, 'sine'); tone(880, .1, .18, 'sine'); }
  function sfxWrong() { if (!sfxOn()) return; tone(220, 0, .2, 'triangle', .08); }
  function sfxNode() { if (!sfxOn()) return; tone(520, 0, .1, 'sine', .09); tone(780, .08, .14, 'sine', .09); }
  function sfxLevel() { if (!sfxOn()) return; [523, 659, 784, 1047].forEach(function (f, i) { tone(f, i * .11, .22, 'sine', .11); }); }

  /* ═══════════ XP ורמות ═══════════ */
  function xp() { return store.get('xp', 0); }
  function lvl(x) { return Math.floor(Math.sqrt((x == null ? xp() : x) / 30)) + 1; }
  function lvlFloor(l) { return 30 * (l - 1) * (l - 1); }
  function lvlNext(l) { return 30 * l * l; }
  function lvlPct(x) {
    var l = lvl(x), a = lvlFloor(l), b = lvlNext(l);
    return Math.max(0, Math.min(100, Math.round((x - a) / (b - a) * 100)));
  }

  var DAY_GOAL = 40;
  function today() { return new Date().toISOString().slice(0, 10); }
  function xpToday() {
    var d = store.get('xpToday', null);
    return (d && d.date === today()) ? d.n : 0;
  }

  function addXP(n, srcEl, quiet) {
    if (!n) return;
    var before = xp(), after = before + n;
    store.set('xp', after);
    var wasGoal = xpToday() >= DAY_GOAL;
    store.set('xpToday', { date: today(), n: xpToday() + n });
    if (!quiet) popXP(n, srcEl);
    syncChip(true);
    if (!wasGoal && xpToday() >= DAY_GOAL) {
      setTimeout(function () { N5.toast('🎯 יעד ה-XP היומי הושג! כל הכבוד'); }, 600);
    }
    if (lvl(after) > lvl(before)) levelUp(lvl(after));
    if (window.N5S && N5S.progressChanged) N5S.progressChanged();
  }

  /* "+N ⚡" מרחף מעל מקור הנקודות */
  function popXP(n, srcEl) {
    var p = document.createElement('div');
    p.className = 'n5-xp-pop';
    p.textContent = '+' + n + ' ⚡';
    var x = window.innerWidth / 2, y = window.innerHeight * .55;
    if (srcEl && srcEl.getBoundingClientRect) {
      var r = srcEl.getBoundingClientRect();
      if (r.width || r.height) { x = r.left + r.width / 2; y = r.top; }
    }
    p.style.left = x + 'px'; p.style.top = y + 'px';
    document.body.appendChild(p);
    setTimeout(function () { p.remove(); }, 1400);
  }

  function levelUp(l) {
    sfxLevel();
    N5.confetti(80);
    var ov = document.createElement('div');
    ov.className = 'n5-levelup';
    ov.innerHTML = '<div class="n5-levelup-card">' +
      '<div class="n5-levelup-burst">⭐</div>' +
      '<h2>עלית רמה!</h2>' +
      '<div class="n5-levelup-num">רמה ' + l + '</div>' +
      '<p><span class="jp" dir="ltr">すごい！</span> ממשיכים כך 💪</p>' +
      '<button class="n5-levelup-btn">המשך</button></div>';
    document.body.appendChild(ov);
    requestAnimationFrame(function () { ov.classList.add('show'); });
    function close() { ov.classList.remove('show'); setTimeout(function () { ov.remove(); }, 350); }
    ov.querySelector('.n5-levelup-btn').addEventListener('click', close);
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
  }

  /* ═══════════ צ'יפ XP בסרגל הכלים ═══════════ */
  var chipNum = null, chipLvl = null, chipBar = null;
  function buildChip() {
    var bar = document.querySelector('.n5-toolbar');
    if (!bar) return;
    var chip = document.createElement('button');
    chip.className = 'n5-xp-chip';
    chip.title = 'הנקודות שלי — לחץ לפרופיל ולחברים';
    chip.innerHTML = '<span class="n5-xp-top">⚡ <b></b></span>' +
      '<span class="n5-xp-lvl"></span>' +
      '<span class="n5-xp-bar"><i></i></span>';
    chipNum = chip.querySelector('b');
    chipLvl = chip.querySelector('.n5-xp-lvl');
    chipBar = chip.querySelector('.n5-xp-bar i');
    chip.addEventListener('click', function () {
      if (window.N5S && N5S.toggle) N5S.toggle();
    });
    bar.appendChild(chip);

    var sfxBtn = document.createElement('button');
    sfxBtn.className = 'n5-tool';
    function syncSfx() { sfxBtn.textContent = sfxOn() ? '🔊' : '🔇'; sfxBtn.title = sfxOn() ? 'כיבוי צלילים' : 'הפעלת צלילים'; }
    syncSfx();
    sfxBtn.addEventListener('click', function () { store.set('sfx', !sfxOn()); syncSfx(); if (sfxOn()) sfxCorrect(); });
    bar.appendChild(sfxBtn);
    syncChip(false);
  }
  function syncChip(bump) {
    if (!chipNum) return;
    var x = xp();
    chipNum.textContent = x;
    chipLvl.textContent = 'רמה ' + lvl(x);
    chipBar.style.width = lvlPct(x) + '%';
    if (bump && !reduced) {
      var chip = chipNum.closest('.n5-xp-chip');
      chip.classList.remove('bump');
      void chip.offsetWidth;
      chip.classList.add('bump');
    }
  }

  /* ═══════════ נקודות על תשובות ═══════════ */
  /* שאלות תרגול בודדות (qbox) — פעם אחת לכל תיבה */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.qbox .opt');
    if (btn) {
      var box = btn.closest('.qbox');
      if (!box || box.dataset.n5x) return;
      // המאזין של הדף רץ קודם (bubbling) — המחלקות כבר הוצבו
      setTimeout(function () {
        if (box.dataset.n5x) return;
        if (btn.classList.contains('correct')) { box.dataset.n5x = 1; addXP(3, btn); sfxCorrect(); }
        else if (btn.classList.contains('wrong')) { box.dataset.n5x = 1; sfxWrong(); }
      }, 0);
      return;
    }
    /* תיבות בחינה גדולות (makeQuiz) */
    var qbtn = e.target.closest('.quiz-widget .opt');
    if (qbtn) {
      setTimeout(function () {
        if (qbtn.dataset.n5x) return;
        qbtn.dataset.n5x = 1;
        if (qbtn.classList.contains('correct')) { addXP(2, qbtn); sfxCorrect(); }
        else if (qbtn.classList.contains('wrong')) sfxWrong();
      }, 0);
    }
  });

  /* בונוס סיום תיבת בחינה */
  var countedResults = new WeakSet();
  function watchQuizBonus() {
    document.querySelectorAll('.quiz-widget[id]').forEach(function (widget) {
      new MutationObserver(function () {
        var big = widget.querySelector('.q-result .score-big');
        if (!big || countedResults.has(big)) return;
        countedResults.add(big);
        var m = big.textContent.match(/(\d+)\s*\/\s*(\d+)/);
        if (!m) return;
        var pct = +m[1] / +m[2];
        var bonus = pct >= 0.8 ? 15 : pct >= 0.6 ? 8 : 3;
        addXP(bonus, big);
        markQuizNode(widget.id);
      }).observe(widget, { childList: true, subtree: true });
    });
  }

  /* בונוס יומי ראשון */
  function dailyBonus() {
    if (store.get('xpDayBonus', '') === today()) return;
    store.set('xpDayBonus', today());
    var s = N5.currentStreak();
    setTimeout(function () {
      addXP(5, null, true);
      N5.toast(s > 1 ? '🔥 רצף של ' + s + ' ימים! ‎+5 ⚡ בונוס יומי' : '⚡ ‎+5 בונוס כניסה יומית');
      syncChip(true);
    }, 1600);
  }

  /* בונוס השלמת שבוע — עוקב אחרי store.weeks */
  var prevDone = countWeeksDone();
  function countWeeksDone() {
    var w = store.get('weeks', {}), n = 0, k;
    for (k in w) if (w[k] && w[k].done) n++;
    return n;
  }
  var origSet = store.set.bind(store);
  store.set = function (k, v) {
    origSet(k, v);
    if (k === 'weeks') {
      var now = countWeeksDone();
      if (now > prevDone) addXP(40, document.querySelector('.done-banner'));
      prevDone = now;
    }
    if (window.N5S && N5S.storeChanged) N5S.storeChanged(k);
  };

  /* ═══════════ מסלול שבועי בתוך שיעור ═══════════ */
  var trailNodes = [], railEl = null, railFill = null;
  var QUIZ_META = {
    'quiz-vocab': { icon: '📖', label: 'תיבת בחינה — אוצר מילים' },
    'quiz-kanji': { icon: '🈶', label: 'תיבת בחינה — קאנג\'י' },
    'quiz-final': { icon: '🎓', label: 'מבחן סיכום' },
    'quiz-bonus': { icon: '🧩', label: 'תרגול מעמיק' },
    'exam-part1': { icon: '📝', label: 'חלק 1' }, 'exam-part2': { icon: '📖', label: 'חלק 2' },
    'exam-part3': { icon: '🎧', label: 'חלק 3' }, 'final-comprehensive': { icon: '🏆', label: 'מבחן מסכם' }
  };
  function trailStore() { var t = store.get('trail', {}); return t['w' + WEEK] || {}; }
  function trailSave(id) {
    var t = store.get('trail', {});
    t['w' + WEEK] = t['w' + WEEK] || {};
    if (t['w' + WEEK][id]) return false;
    t['w' + WEEK][id] = 1;
    store.set('trail', t);
    return true;
  }

  function buildWeekTrail() {
    var done = trailStore();
    var scores = store.get('scores', {});
    document.querySelectorAll('.topic').forEach(function (t, i) {
      var h = t.querySelector('h2');
      trailNodes.push({
        el: t, id: 't' + i, kind: 'topic', num: i + 1,
        label: h ? h.textContent.trim() : 'נושא ' + (i + 1),
        done: !!done['t' + i]
      });
    });
    document.querySelectorAll('.quiz-widget[id]').forEach(function (w) {
      var meta = QUIZ_META[w.id] || { icon: '📝', label: 'תיבת בחינה' };
      trailNodes.push({
        el: w, id: w.id, kind: 'quiz', icon: meta.icon, label: meta.label,
        done: !!scores['w' + WEEK + ':' + w.id] || !!done[w.id]
      });
    });
    var banner = document.querySelector('.done-banner');
    if (banner) trailNodes.push({ el: banner, id: 'finish', kind: 'finish', icon: '🏁', label: 'סיום השבוע', done: isWeekDoneLocal() });
    if (trailNodes.length < 3) return;

    railEl = document.createElement('nav');
    railEl.className = 'n5-rail';
    railEl.setAttribute('aria-label', 'מסלול ההתקדמות של השבוע');
    var line = document.createElement('div'); line.className = 'n5-rail-line';
    railFill = document.createElement('div'); railFill.className = 'n5-rail-fill';
    line.appendChild(railFill);
    railEl.appendChild(line);
    trailNodes.forEach(function (n) {
      var b = document.createElement('button');
      b.className = 'n5-rail-node' + (n.kind !== 'topic' ? ' big' : '');
      b.innerHTML = '<span>' + (n.kind === 'topic' ? n.num : n.icon) + '</span><i class="n5-rail-tip">' + n.label + '</i>';
      b.addEventListener('click', function () { n.el.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
      n.btn = b;
      railEl.appendChild(b);
    });
    document.body.appendChild(railEl);
    paintTrail();
    watchScrollTrail();
  }
  function isWeekDoneLocal() { var m = store.get('weeks', {}); return !!(m[WEEK] && m[WEEK].done); }

  function paintTrail() {
    var doneCount = 0, current = null;
    trailNodes.forEach(function (n) {
      if (n.done) doneCount++;
      else if (!current) current = n;
    });
    trailNodes.forEach(function (n) {
      n.btn.classList.toggle('done', !!n.done);
      n.btn.classList.toggle('current', n === current);
    });
    if (railEl) railEl.style.setProperty('--fill', (trailNodes.length ? (doneCount / trailNodes.length) * 100 : 0) + '%');
  }

  function completeNode(n, awardXp) {
    if (n.done) return;
    n.done = true;
    if (trailSave(n.id) && awardXp) {
      addXP(5, n.btn);
      sfxNode();
    }
    paintTrail();
  }
  function markQuizNode(id) {
    var n = trailNodes.find(function (x) { return x.id === id; });
    if (n) completeNode(n, true);
  }

  function watchScrollTrail() {
    var pending = trailNodes.filter(function (n) { return n.kind === 'topic' && !n.done; });
    if (!pending.length) return;
    var last = 0;
    function check() {
      pending = pending.filter(function (n) {
        if (n.el.getBoundingClientRect().bottom < window.innerHeight * 0.4) {
          completeNode(n, true);
          return false;
        }
        return true;
      });
    }
    window.addEventListener('scroll', function () {
      if (!pending.length) return;
      var now = Date.now();
      if (now - last < 150) return;
      last = now;
      setTimeout(check, 0);
    }, { passive: true });
  }

  /* ═══════════ מפת מסלול בדף הבית ═══════════ */
  var PHASES = [
    { at: 1, label: 'חלק א׳ · יסודות' },
    { at: 5, label: 'חלק ב׳ · פעלים מנומסים' },
    { at: 9, label: 'חלק ג׳ · הצורה הרגילה' },
    { at: 13, label: 'חלק ד׳ · השלמת הדקדוק' },
    { at: 17, label: 'חלק ה׳ · הכנה למבחן' }
  ];
  var WEEK_TITLES = {};
  function collectTitles() {
    document.querySelectorAll('.week-card').forEach(function (card) {
      var link = card.querySelector('a.week-btn');
      var m = link && (link.getAttribute('href') || '').match(/N5-week(\d+)/);
      if (!m) return;
      var t = card.querySelector('.week-title');
      WEEK_TITLES[+m[1]] = t ? t.textContent.trim() : '';
    });
  }

  function buildCourseMap() {
    var host = document.getElementById('n5-trail');
    if (!host) return;
    collectTitles();
    var weeks = store.get('weeks', {});
    var doneArr = [], current = null;
    for (var w = 1; w <= TOTAL_WEEKS; w++) {
      var d = !!(weeks[w] && weeks[w].done);
      doneArr.push(d);
      if (!d && current == null) current = w;
    }
    var doneCount = doneArr.filter(Boolean).length;
    if (current == null) current = 0; // הקורס הושלם

    var W = Math.min(430, window.innerWidth * 0.92), GAP = 96, PAD = 60;
    var phaseRows = PHASES.length;
    var H = PAD * 2 + (TOTAL_WEEKS - 1) * GAP + phaseRows * 54;

    var pts = [], y = PAD, phaseLabels = [];
    for (var i = 0; i < TOTAL_WEEKS; i++) {
      var ph = PHASES.find(function (p) { return p.at === i + 1; });
      if (ph) { phaseLabels.push({ y: y, label: ph.label }); y += 54; }
      pts.push({ x: W / 2 + Math.sin(i * 1.05) * (W * 0.27), y: y, w: i + 1 });
      y += GAP;
    }

    var d = 'M ' + pts[0].x + ' ' + pts[0].y;
    for (var j = 1; j < pts.length; j++) {
      var a = pts[j - 1], b = pts[j];
      d += ' C ' + a.x + ' ' + (a.y + GAP * .48) + ', ' + b.x + ' ' + (b.y - GAP * .48) + ', ' + b.x + ' ' + b.y;
    }

    host.innerHTML =
      '<div class="n5-map-head">' +
      '<h2>🗾 מסלול הלמידה שלך</h2>' +
      '<p>' + (doneCount ? doneCount + ' מתוך ' + TOTAL_WEEKS + ' שבועות הושלמו — ' + Math.round(doneCount / TOTAL_WEEKS * 100) + '%' : 'המסע מתחיל כאן — צעד אחר צעד עד N5') + '</p>' +
      '</div>' +
      '<div class="n5-map" style="width:' + W + 'px;height:' + H + 'px">' +
      '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" fill="none" aria-hidden="true">' +
      '<path class="n5-map-road" d="' + d + '"/>' +
      '<path class="n5-map-road-done" d="' + d + '"/>' +
      '</svg></div>';

    var map = host.querySelector('.n5-map');
    var scores = store.get('scores', {});
    var FINISH_IDS = ['quiz-final', 'exam-part3', 'final-comprehensive'];

    phaseLabels.forEach(function (p) {
      var el = document.createElement('div');
      el.className = 'n5-map-phase';
      el.style.top = p.y + 'px';
      el.innerHTML = '<span>' + p.label + '</span>';
      map.appendChild(el);
    });

    pts.forEach(function (p, i) {
      var w = p.w, done = doneArr[i], isCur = (w === current);
      var node = document.createElement('a');
      node.href = 'N5-week' + w + '-lesson.html';
      node.className = 'n5-map-node' + (done ? ' done' : isCur ? ' current' : ' todo');
      node.style.left = p.x + 'px'; node.style.top = p.y + 'px';
      node.title = 'שבוע ' + w + (WEEK_TITLES[w] ? ' — ' + WEEK_TITLES[w] : '');
      node.innerHTML = '<b>' + (done ? '✓' : w) + '</b>';
      var trophy = FINISH_IDS.map(function (id) { return scores['w' + w + ':' + id]; }).find(Boolean);
      if (trophy) node.innerHTML += '<i class="n5-map-trophy" title="שיא: ' + trophy.best + '/' + trophy.total + '">🏆</i>';
      if (isCur) {
        var bub = document.createElement('span');
        bub.className = 'n5-map-bubble';
        bub.textContent = doneCount ? 'המשך כאן' : 'התחל כאן!';
        node.appendChild(bub);
      }
      map.appendChild(node);
    });

    /* צביעת הדרך שכבר נעברה */
    var road = map.querySelector('.n5-map-road-done');
    try {
      var len = road.getTotalLength();
      var frac = current === 0 ? 1 : Math.max(0, (current - 1) / (TOTAL_WEEKS - 1));
      road.style.strokeDasharray = len;
      road.style.strokeDashoffset = len * (1 - frac);
    } catch (e) { road.remove(); }
  }

  /* ═══════════ אתחול ═══════════ */
  function init() {
    buildChip();
    dailyBonus();
    if (PAGE === 'lesson') {
      watchQuizBonus();
      buildWeekTrail();
    }
    if (PAGE === 'home') buildCourseMap();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  /* API */
  window.N5G = { addXP: addXP, xp: xp, level: function () { return lvl(); }, levelPct: function () { return lvlPct(xp()); }, xpToday: xpToday, DAY_GOAL: DAY_GOAL, syncChip: syncChip };
})();
