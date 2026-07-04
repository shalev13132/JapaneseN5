/* ═══════════════════════════════════════════════════════════
   site.js — שכבת אינטראקציה משותפת לכל דפי הקורס
   מצב לילה · הקראת יפנית · מעקב התקדמות וניקוד · רצף למידה
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ---------- אחסון מקומי ---------- */
  const store = {
    get(k, d) { try { const v = localStorage.getItem('n5.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('n5.' + k, JSON.stringify(v)); } catch (e) { } }
  };

  /* ---------- זיהוי דף ---------- */
  const weekM = decodeURIComponent(location.pathname).match(/N5-week(\d+)-lesson/);
  const WEEK = weekM ? +weekM[1] : null;
  const PAGE = WEEK ? 'lesson' : (document.body.dataset.page || 'home');
  const TOTAL_WEEKS = 20;
  const FINISH_IDS = { 'quiz-final': 1, 'exam-part3': 1, 'final-comprehensive': 1 };

  /* ---------- טוסט ---------- */
  let toastEl = null, toastTimer = null;
  function toast(msg, ms) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'n5-toast'; document.body.appendChild(toastEl); }
    toastEl.textContent = msg;
    requestAnimationFrame(() => toastEl.classList.add('show'));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), ms || 2400);
  }

  /* ---------- קונפטי ---------- */
  const CONF_COLORS = ['#b23a1e', '#9a7b2e', '#3f7d6e', '#4b6a8f', '#d4af5a', '#e0663f'];
  function confetti(n) {
    for (let i = 0; i < (n || 60); i++) {
      const s = document.createElement('span');
      s.className = 'n5-confetti';
      s.style.left = (Math.random() * 100) + 'vw';
      s.style.background = CONF_COLORS[i % CONF_COLORS.length];
      s.style.animationDuration = (1.8 + Math.random() * 1.8) + 's';
      s.style.animationDelay = (Math.random() * .5) + 's';
      s.style.transform = 'rotate(' + Math.random() * 360 + 'deg)';
      if (Math.random() > .5) s.style.borderRadius = '50%';
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 4200);
    }
  }

  /* ---------- מצב לילה ---------- */
  function applyTheme(t) {
    if (t === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
  }
  applyTheme(store.get('theme', null));

  /* ---------- הקראה קולית (Web Speech API) ---------- */
  let jaVoice = null;
  function loadVoices() {
    if (!('speechSynthesis' in window)) return;
    const vs = speechSynthesis.getVoices();
    jaVoice = vs.find(v => v.lang && v.lang.indexOf('ja') === 0 && /google/i.test(v.name)) ||
              vs.find(v => v.lang && v.lang.indexOf('ja') === 0) || null;
  }
  if ('speechSynthesis' in window) {
    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;
  }
  function speak(text, el) {
    if (!('speechSynthesis' in window)) { toast('הדפדפן לא תומך בהקראה קולית'); return; }
    text = (text || '')
      .replace(/（[^）]*）/g, ' ')
      .replace(/[֐-׿]+/g, ' ')
      .replace(/[「」『』()（）]/g, ' ')
      .trim();
    if (!text) return;
    loadVoices();
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    if (jaVoice) u.voice = jaVoice;
    u.lang = 'ja-JP'; u.rate = 0.85;
    if (el) {
      el.classList.add('speaking');
      u.onend = u.onerror = () => el.classList.remove('speaking');
    }
    speechSynthesis.speak(u);
    if (!jaVoice && !store.get('ttsWarned', false)) {
      toast('💡 לא נמצא קול יפני מותקן בדפדפן — ההגייה עשויה להיות משובשת');
      store.set('ttsWarned', true);
    }
  }
  const hasJP = s => /[぀-ヿ一-鿿]/.test(s || '');
  function jpText(el) {
    const c = el.cloneNode(true);
    c.querySelectorAll('.r').forEach(n => n.remove());
    return c.textContent;
  }
  // לחיצה על כל טקסט יפני משמיעה אותו
  document.addEventListener('click', e => {
    const jp = e.target.closest('.jp, .ex-jp .r, .passage-text');
    if (!jp) return;
    if (e.target.closest('button, a, th, input, select, .n5-toolbar, [data-nospeak]')) return;
    const txt = jp.classList.contains('r') ? jp.textContent : jpText(jp);
    if (!hasJP(txt)) return;
    speak(txt, jp);
  });
  let markTimer = null;
  function markSpeakables() {
    document.querySelectorAll('.jp, .ex-jp .r, .passage-text').forEach(el => {
      if (el.closest('button, a, th, .n5-toolbar')) return;
      if (hasJP(el.textContent)) el.classList.add('speakable');
    });
  }
  function scheduleMarkSpeakables() {
    clearTimeout(markTimer);
    markTimer = setTimeout(markSpeakables, 150);
  }

  /* ---------- סרגל כלים צף ---------- */
  function buildToolbar() {
    const bar = document.createElement('div');
    bar.className = 'n5-toolbar';

    const themeBtn = document.createElement('button');
    themeBtn.className = 'n5-tool';
    const syncThemeBtn = () => {
      const dark = document.documentElement.getAttribute('data-theme') === 'dark';
      themeBtn.textContent = dark ? '☀️' : '🌙';
      themeBtn.title = dark ? 'מעבר למצב יום' : 'מעבר למצב לילה';
    };
    syncThemeBtn();
    themeBtn.addEventListener('click', () => {
      const dark = document.documentElement.getAttribute('data-theme') === 'dark';
      applyTheme(dark ? null : 'dark');
      store.set('theme', dark ? null : 'dark');
      syncThemeBtn();
    });
    bar.appendChild(themeBtn);

    if (PAGE === 'lesson') {
      const readBtn = document.createElement('button');
      readBtn.className = 'n5-tool';
      readBtn.textContent = 'あ';
      readBtn.style.fontFamily = '"Noto Sans JP",sans-serif';
      readBtn.style.fontWeight = '700';
      const syncReadBtn = () => {
        const hidden = document.documentElement.classList.contains('hide-readings');
        readBtn.title = hidden ? 'הצג קריאות (פוריגאנה)' : 'מצב תרגול: טשטש קריאות';
        readBtn.classList.toggle('active', hidden);
        readBtn.style.color = hidden ? '#fff' : '';
      };
      if (store.get('hideReadings', false)) document.documentElement.classList.add('hide-readings');
      syncReadBtn();
      readBtn.addEventListener('click', () => {
        const hidden = document.documentElement.classList.toggle('hide-readings');
        store.set('hideReadings', hidden);
        syncReadBtn();
        toast(hidden ? 'מצב תרגול: הקריאות מטושטשות — רחף מעליהן כדי להציץ' : 'הקריאות מוצגות שוב');
      });
      bar.appendChild(readBtn);
    }
    document.body.appendChild(bar);
  }

  /* ---------- פס קריאה עליון ---------- */
  function buildReadbar() {
    const rb = document.createElement('div');
    rb.className = 'n5-readbar';
    document.body.appendChild(rb);
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const h = document.documentElement.scrollHeight - window.innerHeight;
        rb.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + '%';
        ticking = false;
      });
    }, { passive: true });
  }

  /* ---------- רצף למידה ---------- */
  function recordDay() {
    const days = store.get('days', []);
    const today = new Date().toISOString().slice(0, 10);
    if (days.indexOf(today) === -1) {
      days.push(today);
      if (days.length > 500) days.splice(0, days.length - 500);
      store.set('days', days);
    }
  }
  function currentStreak() {
    const days = new Set(store.get('days', []));
    let streak = 0;
    const d = new Date();
    for (; ;) {
      const iso = d.toISOString().slice(0, 10);
      if (days.has(iso)) { streak++; d.setDate(d.getDate() - 1); }
      else break;
    }
    return streak;
  }

  /* ---------- השלמת שבועות ---------- */
  function isWeekDone(w) { const m = store.get('weeks', {}); return !!(m[w] && m[w].done); }
  function setWeekDone(w, done) {
    const m = store.get('weeks', {});
    if (done) m[w] = { done: true, ts: Date.now() }; else delete m[w];
    store.set('weeks', m);
  }

  /* ---------- שמירת ניקוד מבחנים ---------- */
  function scoreKey(id) { return 'w' + WEEK + ':' + id; }
  function renderBest(widget) {
    const scores = store.get('scores', {});
    const s = scores[scoreKey(widget.id)];
    let chip = widget.querySelector('.n5-best');
    if (!s) { if (chip) chip.remove(); return; }
    if (!chip) {
      chip = document.createElement('div');
      chip.className = 'n5-best';
      const head = widget.querySelector('.htag');
      if (head && head.nextSibling) widget.insertBefore(chip, head.nextSibling);
      else widget.appendChild(chip);
    }
    chip.textContent = '🏆 שיא אישי: ' + s.best + ' / ' + s.total;
  }
  function watchQuizzes() {
    document.querySelectorAll('.quiz-widget[id]').forEach(widget => {
      renderBest(widget);
      let counted = false;
      new MutationObserver(() => {
        scheduleMarkSpeakables();
        const big = widget.querySelector('.q-result .score-big');
        if (!big) { counted = false; return; }
        if (counted) return;
        counted = true;
        const m = big.textContent.match(/(\d+)\s*\/\s*(\d+)/);
        if (!m) return;
        const score = +m[1], total = +m[2];
        const scores = store.get('scores', {});
        const key = scoreKey(widget.id);
        const prev = scores[key];
        if (!prev || score > prev.best) {
          scores[key] = { best: score, total: total, ts: Date.now() };
          store.set('scores', scores);
          renderBest(widget);
          if (prev) toast('🏆 שיא אישי חדש: ' + score + ' / ' + total + '!');
        }
        if (FINISH_IDS[widget.id] && !isWeekDone(WEEK) && score / total >= 0.6) {
          setWeekDone(WEEK, true);
          confetti();
          toast('🎉 כל הכבוד! שבוע ' + WEEK + ' הושלם ונשמר');
          syncCompleteBtn();
        }
      }).observe(widget, { childList: true, subtree: true });
    });
  }

  /* ---------- כפתור "סמן שבוע כהושלם" ---------- */
  let completeBtn = null;
  function syncCompleteBtn() {
    if (!completeBtn) return;
    const done = isWeekDone(WEEK);
    completeBtn.textContent = done ? '✓ השבוע הושלם — לחץ לביטול' : 'סמן את השבוע כהושלם ✓';
    completeBtn.classList.toggle('undone', done);
  }
  function buildCompleteBtn() {
    const banner = document.querySelector('.done-banner');
    if (!banner) return;
    completeBtn = document.createElement('button');
    completeBtn.className = 'n5-complete-btn';
    completeBtn.addEventListener('click', () => {
      const done = !isWeekDone(WEEK);
      setWeekDone(WEEK, done);
      if (done) { confetti(); toast('🎉 שבוע ' + WEEK + ' סומן כהושלם'); }
      else toast('ההשלמה של שבוע ' + WEEK + ' בוטלה');
      syncCompleteBtn();
    });
    banner.appendChild(completeBtn);
    syncCompleteBtn();
  }

  /* ---------- קיצורי מקלדת למבחנים ---------- */
  function keyShortcuts() {
    document.addEventListener('keydown', e => {
      if (e.target.matches('input, textarea, select')) return;
      const n = +e.key;
      if (!(n >= 1 && n <= 9)) return;
      const blocks = Array.from(document.querySelectorAll('.q-options')).filter(b => {
        const btns = b.querySelectorAll('.opt');
        if (!btns.length || btns[0].disabled) return false;
        const r = b.getBoundingClientRect();
        return r.bottom > 0 && r.top < window.innerHeight;
      });
      if (!blocks.length) return;
      const mid = window.innerHeight / 2;
      blocks.sort((a, b) => {
        const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
        return Math.abs(ra.top + ra.height / 2 - mid) - Math.abs(rb.top + rb.height / 2 - mid);
      });
      const btn = blocks[0].querySelectorAll('.opt')[n - 1];
      if (btn) btn.click();
    });
  }

  /* ---------- חשיפה בגלילה ---------- */
  function scrollReveal() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const raw = [...document.querySelectorAll('.topic, .week-card, .tool-card, .quiz-widget, .tips, .done-banner, .kana-block, .ex, .qbox, .reveal')];
    const set = new Set(raw);
    // בלי אלמנטים מקוננים — רק ההורה העליון מקבל אנימציה
    let pending = raw.filter(el => {
      let p = el.parentElement;
      while (p) { if (set.has(p)) return false; p = p.parentElement; }
      return el.getBoundingClientRect().top > window.innerHeight;
    });
    if (!pending.length) return;
    pending.forEach(el => el.classList.add('n5-sr'));
    function checkReveal() {
      if (!pending.length) return;
      const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 40;
      const limit = window.innerHeight * 0.93;
      pending = pending.filter(el => {
        if (atBottom || el.getBoundingClientRect().top < limit) { el.classList.add('n5-in'); return false; }
        return true;
      });
    }
    let tick = false;
    window.addEventListener('scroll', () => {
      if (tick) return; tick = true;
      requestAnimationFrame(() => { checkReveal(); tick = false; });
    }, { passive: true });
    window.addEventListener('resize', checkReveal, { passive: true });
  }

  /* ---------- קאנה מרחפת — בכל הדפים ---------- */
  function floatingKana() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let layer = document.getElementById('n5-kana-layer'); // שכבת הפתיחה בדף הבית
    const inHero = !!layer;
    if (!layer) { // בשאר הדפים — שכבת רקע קבועה מאחורי התוכן
      layer = document.createElement('div');
      layer.className = 'n5-kana-global';
      layer.setAttribute('aria-hidden', 'true');
      document.body.appendChild(layer);
    }
    const chars = 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん日本語学生水火木金土円時人先';
    const count = inHero ? 16 : 12;
    for (let i = 0; i < count; i++) {
      const s = document.createElement('span');
      s.textContent = chars[Math.floor(Math.random() * chars.length)];
      s.style.left = (Math.random() * 96) + '%';
      s.style.fontSize = (18 + Math.random() * 30) + 'px';
      s.style.setProperty('--op', (0.05 + Math.random() * 0.09).toFixed(2));
      s.style.animationDuration = (14 + Math.random() * 18) + 's';
      s.style.animationDelay = (-Math.random() * 26) + 's';
      layer.appendChild(s);
    }
  }

  /* ---------- קישוט דף הבית ---------- */
  function decorateHome() {
    const weeks = store.get('weeks', {});
    const scores = store.get('scores', {});
    let doneCount = 0;

    document.querySelectorAll('.week-card').forEach(card => {
      const link = card.querySelector('a.week-btn');
      if (!link) return;
      const m = (link.getAttribute('href') || '').match(/N5-week(\d+)/);
      if (!m) return;
      const w = +m[1];
      if (weeks[w] && weeks[w].done) { card.classList.add('done'); doneCount++; }
      const finKey = ['quiz-final', 'exam-part3', 'final-comprehensive']
        .map(id => 'w' + w + ':' + id).find(k => scores[k]);
      if (finKey) {
        const s = scores[finKey];
        const tags = card.querySelector('.week-tags');
        if (tags) {
          const chip = document.createElement('span');
          chip.className = 'tag score-tag';
          chip.textContent = '🏆 מבחן: ' + s.best + '/' + s.total;
          tags.appendChild(chip);
        }
      }
    });

    // פס התקדמות כללי
    const fill = document.getElementById('n5-prog-fill');
    const label = document.getElementById('n5-prog-label');
    if (fill) fill.style.width = (doneCount / TOTAL_WEEKS * 100) + '%';
    if (label) label.textContent = doneCount + ' מתוך ' + TOTAL_WEEKS + ' שבועות הושלמו';

    // רצף למידה
    const streakNum = document.getElementById('n5-streak');
    if (streakNum) streakNum.textContent = currentStreak();

    // כפתור "המשך ללמוד"
    const slot = document.getElementById('n5-continue');
    if (slot) {
      let target = null;
      const last = store.get('lastVisit', null);
      if (last && last.week && !(weeks[last.week] && weeks[last.week].done)) target = last.week;
      if (!target) { for (let w = 1; w <= TOTAL_WEEKS; w++) { if (!(weeks[w] && weeks[w].done)) { target = w; break; } } }
      const a = document.createElement('a');
      a.className = 'hero-continue';
      if (target) {
        a.href = 'N5-week' + target + '-lesson.html';
        a.innerHTML = (doneCount ? 'המשך ללמוד — שבוע ' + target : 'התחל ללמוד — שבוע 1') + ' <span style="font-size:14px">←</span>';
      } else {
        a.href = 'N5-week20-lesson.html';
        a.textContent = '🎓 סיימת את כל הקורס! כל הכבוד';
      }
      slot.appendChild(a);
    }

    // איפוס התקדמות
    const reset = document.getElementById('n5-reset');
    if (reset) reset.addEventListener('click', e => {
      e.preventDefault();
      if (!confirm('לאפס את כל ההתקדמות, הניקוד והרצף? אי אפשר לבטל פעולה זו.')) return;
      Object.keys(localStorage).filter(k => k.indexOf('n5.') === 0).forEach(k => localStorage.removeItem(k));
      location.reload();
    });
  }

  /* ---------- אתחול ---------- */
  function init() {
    buildToolbar();
    recordDay();
    markSpeakables();
    scrollReveal();
    floatingKana();

    if (PAGE === 'lesson') {
      buildReadbar();
      watchQuizzes();
      buildCompleteBtn();
      keyShortcuts();
      store.set('lastVisit', { week: WEEK, ts: Date.now() });
      if (!store.get('hintTTS', false)) {
        setTimeout(() => {
          toast('💡 טיפ: לחיצה על כל טקסט יפני תשמיע אותו בקול', 4200);
          store.set('hintTTS', true);
        }, 1200);
      }
    }
    if (PAGE === 'home') decorateHome();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  /* API לדפי הכלים (כרטיסיות, קאנה) */
  window.N5 = { speak: speak, toast: toast, store: store, confetti: confetti, hasJP: hasJP, currentStreak: currentStreak };
})();
