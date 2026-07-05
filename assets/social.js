/* ═══════════════════════════════════════════════════════════
   social.js — חשבונות, סנכרון ענן וחברים (Firebase)
   התחברות עם Google · מצב אורח · סנכרון התקדמות בין מכשירים ·
   קוד חבר · בקשות חברות · טבלת מובילים
   פועל רק אם window.N5_FIREBASE_CONFIG מוגדר; אחרת מצב מקומי.
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (!window.N5) return;
  var store = N5.store;
  var CFG = window.N5_FIREBASE_CONFIG || null;
  var SDK = 'https://www.gstatic.com/firebasejs/10.12.2/';
  var SYNC_KEYS = { weeks: 1, scores: 1, days: 1, xp: 1, trail: 1, fcKnown: 1 };

  var db = null, auth = null, me = null, myDoc = null, panel = null, panelOpen = false;
  var profBtn = null, sdkReady = false, sdkLoading = false, pushTimer = null;

  /* ═══════════ כפתור פרופיל בסרגל ═══════════ */
  function buildProfileBtn() {
    var bar = document.querySelector('.n5-toolbar');
    if (!bar) return;
    profBtn = document.createElement('button');
    profBtn.className = 'n5-tool n5-prof-btn';
    profBtn.textContent = '👤';
    profBtn.title = 'הפרופיל שלי, חברים וטבלת מובילים';
    profBtn.addEventListener('click', toggle);
    bar.appendChild(profBtn);
  }
  function syncProfBtn() {
    if (!profBtn) return;
    if (me && me.photoURL) {
      profBtn.innerHTML = '<img class="n5-prof-img" src="' + me.photoURL + '" alt="" referrerpolicy="no-referrer">';
    } else profBtn.textContent = '👤';
  }

  /* ═══════════ פאנל ═══════════ */
  function toggle() {
    if (!panel) buildPanel();
    panelOpen = !panelOpen;
    panel.classList.toggle('open', panelOpen);
    if (panelOpen) {
      render();
      if (me) refreshSocial();
    }
  }
  function buildPanel() {
    panel = document.createElement('aside');
    panel.className = 'n5-panel';
    panel.setAttribute('dir', 'rtl');
    document.body.appendChild(panel);
    document.addEventListener('click', function (e) {
      if (panelOpen && !panel.contains(e.target) && !e.target.closest('.n5-prof-btn')) {
        panelOpen = false;
        panel.classList.remove('open');
      }
    });
  }

  function statsRow() {
    var xp = store.get('xp', 0);
    var lv = window.N5G ? N5G.level() : 1;
    var wk = countWeeks();
    return '<div class="n5-p-stats">' +
      '<div><b>⚡ ' + xp + '</b><span>נק׳ XP · רמה ' + lv + '</span></div>' +
      '<div><b>🔥 ' + N5.currentStreak() + '</b><span>ימי רצף</span></div>' +
      '<div><b>📚 ' + wk + '/20</b><span>שבועות</span></div>' +
      '</div>';
  }
  function countWeeks() {
    var w = store.get('weeks', {}), n = 0, k;
    for (k in w) if (w[k] && w[k].done) n++;
    return n;
  }

  function render() {
    if (!panel) return;
    var h = '<div class="n5-p-head"><h3>הפרופיל שלי</h3><button class="n5-p-close" aria-label="סגירה">✕</button></div>';

    if (!CFG) {
      h += '<div class="n5-p-body">' + statsRow() +
        '<div class="n5-p-note">📱 ההתקדמות נשמרת כרגע בדפדפן זה בלבד.<br><br>' +
        'חשבונות משתמשים, סנכרון בין מכשירים וחברים עדיין לא הופעלו באתר. ' +
        '<small>(למפעיל האתר: ראה את הקובץ FIREBASE-SETUP.md)</small></div></div>';
    } else if (!me) {
      h += '<div class="n5-p-body">' + statsRow() +
        '<div class="n5-p-note">התחבר כדי לשמור את ההתקדמות בענן, ללמוד מכל מכשיר ולהתחרות בחברים 🏆</div>' +
        '<button class="n5-p-google">' +
        '<svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.7l6.2 5.2C36.9 40.4 44 35 44 24c0-1.3-.1-2.6-.4-3.9z"/></svg>' +
        ' התחברות עם Google</button>' +
        '<div class="n5-p-note small">אפשר גם להמשיך כאורח — הכול נשמר בדפדפן.</div></div>';
    } else {
      h += '<div class="n5-p-body">' +
        '<div class="n5-p-user">' +
        (me.photoURL ? '<img src="' + me.photoURL + '" alt="" referrerpolicy="no-referrer">' : '<span class="n5-p-avatar">👤</span>') +
        '<div><b>' + esc(me.displayName || 'לומד/ת יפנית') + '</b>' +
        '<button class="n5-p-signout">התנתקות</button></div></div>' +
        statsRow() +
        '<div class="n5-p-code"><span>קוד החבר שלי:</span> <b id="n5-my-code">' + (myDoc && myDoc.code ? myDoc.code : '…') + '</b>' +
        '<button class="n5-p-copy" title="העתקה">📋</button></div>' +
        '<div class="n5-p-add"><input id="n5-friend-code" maxlength="6" placeholder="קוד של חבר" dir="ltr">' +
        '<button class="n5-p-add-btn">הוסף חבר ➕</button></div>' +
        '<div id="n5-requests"></div>' +
        '<h4 class="n5-p-sub">🏆 טבלת המובילים שלי</h4>' +
        '<div id="n5-board" class="n5-p-board"><div class="n5-p-note small">טוען…</div></div>' +
        '</div>';
    }
    panel.innerHTML = h;

    panel.querySelector('.n5-p-close').addEventListener('click', toggle);
    var g = panel.querySelector('.n5-p-google');
    if (g) g.addEventListener('click', signIn);
    var so = panel.querySelector('.n5-p-signout');
    if (so) so.addEventListener('click', function () { auth.signOut(); N5.toast('התנתקת — ההתקדמות ממשיכה להישמר מקומית'); });
    var cp = panel.querySelector('.n5-p-copy');
    if (cp) cp.addEventListener('click', function () {
      var code = myDoc && myDoc.code;
      if (!code) return;
      navigator.clipboard.writeText(code).then(function () { N5.toast('קוד החבר הועתק! שתף אותו 🤝'); });
    });
    var ab = panel.querySelector('.n5-p-add-btn');
    if (ab) ab.addEventListener('click', addFriend);
  }
  function esc(s) { return (s || '').replace(/[<>&"]/g, function (c) { return { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]; }); }

  /* ═══════════ טעינת Firebase ═══════════ */
  function loadSDK(cb) {
    if (sdkReady) return cb();
    if (sdkLoading) return;
    sdkLoading = true;
    var files = ['firebase-app-compat.js', 'firebase-auth-compat.js', 'firebase-firestore-compat.js'];
    (function next(i) {
      if (i >= files.length) {
        firebase.initializeApp(CFG);
        auth = firebase.auth();
        db = firebase.firestore();
        sdkReady = true;
        auth.onAuthStateChanged(onAuth);
        return cb();
      }
      var s = document.createElement('script');
      s.src = SDK + files[i];
      s.onload = function () { next(i + 1); };
      s.onerror = function () { sdkLoading = false; N5.toast('שגיאה בטעינת שירות החשבונות — בדוק חיבור לאינטרנט'); };
      document.head.appendChild(s);
    })(0);
  }

  function signIn() {
    loadSDK(function () {
      var prov = new firebase.auth.GoogleAuthProvider();
      auth.signInWithPopup(prov).catch(function (e) {
        if (e && e.code === 'auth/popup-blocked') N5.toast('החלון נחסם — אפשר חלונות קופצים לאתר זה');
        else if (e && e.code !== 'auth/popup-closed-by-user') N5.toast('ההתחברות נכשלה: ' + (e.message || e));
      });
    });
  }

  function onAuth(user) {
    me = user;
    syncProfBtn();
    if (!user) { myDoc = null; if (panelOpen) render(); return; }
    ensureUserDoc().then(function () {
      if (panelOpen) { render(); refreshSocial(); }
      N5.toast('שלום ' + (user.displayName || '') + '! ההתקדמות מסתנכרנת בענן ☁️');
    }).catch(function (e) {
      console.error('N5 sync:', e);
      N5.toast('שגיאה בסנכרון — נסה לרענן');
    });
  }

  /* ═══════════ מסמך משתמש + מיזוג התקדמות ═══════════ */
  function localProgress() {
    return {
      weeks: store.get('weeks', {}), scores: store.get('scores', {}),
      days: store.get('days', []), xp: store.get('xp', 0),
      trail: store.get('trail', {}), fcKnown: store.get('fcKnown', {})
    };
  }
  function mergeProgress(a, b) {
    var out = { weeks: {}, scores: {}, days: [], xp: Math.max(a.xp || 0, b.xp || 0), trail: {}, fcKnown: {} };
    var k, w;
    [a.weeks || {}, b.weeks || {}].forEach(function (m) { for (k in m) if (m[k] && m[k].done && !out.weeks[k]) out.weeks[k] = m[k]; });
    [a.scores || {}, b.scores || {}].forEach(function (m) {
      for (k in m) if (!out.scores[k] || (m[k].best || 0) > (out.scores[k].best || 0)) out.scores[k] = m[k];
    });
    var days = {};
    (a.days || []).concat(b.days || []).forEach(function (d) { days[d] = 1; });
    out.days = Object.keys(days).sort();
    [a.trail || {}, b.trail || {}].forEach(function (m) {
      for (w in m) { out.trail[w] = out.trail[w] || {}; for (k in m[w]) out.trail[w][k] = 1; }
    });
    [a.fcKnown || {}, b.fcKnown || {}].forEach(function (m) { for (k in m) if (m[k]) out.fcKnown[k] = m[k]; });
    return out;
  }
  function applyLocal(p) {
    store.set('weeks', p.weeks); store.set('scores', p.scores); store.set('days', p.days);
    store.set('xp', p.xp); store.set('trail', p.trail); store.set('fcKnown', p.fcKnown);
    if (window.N5G) N5G.syncChip(false);
  }

  function ensureUserDoc() {
    var ref = db.collection('users').doc(me.uid);
    return ref.get().then(function (snap) {
      if (snap.exists) {
        myDoc = snap.data();
        var merged = mergeProgress(localProgress(), myDoc.progress || {});
        applyLocal(merged);
        return push(true);
      }
      return makeCode().then(function (code) {
        myDoc = { code: code, friends: [] };
        return push(true);
      });
    });
  }
  function makeCode() {
    var CH = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    function gen() { var s = ''; for (var i = 0; i < 6; i++) s += CH[Math.floor(Math.random() * CH.length)]; return s; }
    function attempt(n) {
      var code = gen(), ref = db.collection('codes').doc(code);
      return db.runTransaction(function (tx) {
        return tx.get(ref).then(function (s) {
          if (s.exists) throw 'taken';
          tx.set(ref, { uid: me.uid });
          return code;
        });
      }).catch(function (e) {
        if (e === 'taken' && n < 5) return attempt(n + 1);
        throw e;
      });
    }
    return attempt(0);
  }

  /* ═══════════ דחיפת התקדמות לענן ═══════════ */
  function push(now) {
    if (!me || !db) return Promise.resolve();
    var p = localProgress();
    var data = {
      name: me.displayName || '', photo: me.photoURL || '',
      code: (myDoc && myDoc.code) || '',
      friends: (myDoc && myDoc.friends) || [],
      xp: p.xp, level: window.N5G ? N5G.level() : 1,
      streak: N5.currentStreak(), weeksDone: countWeeks(),
      progress: p, updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    return db.collection('users').doc(me.uid).set(data, { merge: true })
      .catch(function (e) { console.error('N5 push:', e); });
  }
  function schedulePush() {
    if (!me) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(push, 2500);
  }

  /* ═══════════ חברים ═══════════ */
  function addFriend() {
    var inp = document.getElementById('n5-friend-code');
    var code = (inp.value || '').trim().toUpperCase();
    if (code.length !== 6) return N5.toast('קוד חבר הוא 6 תווים');
    if (myDoc && code === myDoc.code) return N5.toast('זה הקוד שלך 😄');
    db.collection('codes').doc(code).get().then(function (s) {
      if (!s.exists) return N5.toast('קוד לא נמצא — בדוק עם החבר');
      var uid = s.data().uid;
      if ((myDoc.friends || []).indexOf(uid) > -1) return N5.toast('כבר חברים! 🤝');
      return db.collection('requests').add({
        from: me.uid, fromName: me.displayName || '', fromCode: myDoc.code || '',
        to: uid, status: 'pending', ts: Date.now()
      }).then(function () {
        inp.value = '';
        N5.toast('בקשת חברות נשלחה! 💌');
      });
    }).catch(function (e) { console.error(e); N5.toast('שגיאה בשליחת הבקשה'); });
  }

  function refreshSocial() {
    if (!me || !db) return;
    /* בקשות שאושרו על-ידי הצד השני — נוסיף אותם אצלנו */
    db.collection('requests').where('from', '==', me.uid).where('status', '==', 'accepted').get()
      .then(function (qs) {
        var batch = db.batch(), added = 0;
        qs.forEach(function (doc) {
          var d = doc.data();
          if ((myDoc.friends || []).indexOf(d.to) === -1) {
            myDoc.friends = (myDoc.friends || []).concat([d.to]);
            added++;
          }
          batch.update(doc.ref, { status: 'done' });
        });
        if (qs.size) batch.commit();
        if (added) push(true);
      }).catch(function () { })
      .then(renderRequests).then(renderBoard);
  }

  function renderRequests() {
    var host = document.getElementById('n5-requests');
    if (!host) return;
    return db.collection('requests').where('to', '==', me.uid).where('status', '==', 'pending').get()
      .then(function (qs) {
        if (!qs.size) { host.innerHTML = ''; return; }
        var h = '<h4 class="n5-p-sub">💌 בקשות חברות</h4>';
        qs.forEach(function (doc) {
          var d = doc.data();
          h += '<div class="n5-p-req" data-id="' + doc.id + '" data-from="' + d.from + '">' +
            '<span>' + esc(d.fromName || 'לומד/ת') + '</span>' +
            '<span><button class="ok">אישור ✓</button><button class="no">דחייה ✕</button></span></div>';
        });
        host.innerHTML = h;
        host.querySelectorAll('.n5-p-req').forEach(function (row) {
          row.querySelector('.ok').addEventListener('click', function () { answerReq(row, true); });
          row.querySelector('.no').addEventListener('click', function () { answerReq(row, false); });
        });
      }).catch(function (e) { console.error(e); });
  }
  function answerReq(row, accept) {
    var id = row.dataset.id, from = row.dataset.from;
    var batch = db.batch();
    batch.update(db.collection('requests').doc(id), { status: accept ? 'accepted' : 'declined' });
    if (accept) {
      myDoc.friends = (myDoc.friends || []).concat([from]);
      batch.set(db.collection('users').doc(me.uid), { friends: myDoc.friends }, { merge: true });
    }
    batch.commit().then(function () {
      row.remove();
      if (accept) { N5.toast('חבר חדש! 🎉'); renderBoard(); }
    }).catch(function (e) { console.error(e); N5.toast('שגיאה'); });
  }

  function renderBoard() {
    var host = document.getElementById('n5-board');
    if (!host) return;
    var ids = [me.uid].concat(myDoc.friends || []);
    Promise.all(ids.map(function (id) { return db.collection('users').doc(id).get(); }))
      .then(function (snaps) {
        var rows = snaps.filter(function (s) { return s.exists; }).map(function (s) {
          var d = s.data();
          return { uid: s.id, name: d.name || 'לומד/ת', photo: d.photo || '', xp: d.xp || 0, level: d.level || 1, streak: d.streak || 0 };
        }).sort(function (a, b) { return b.xp - a.xp; });
        var medals = ['🥇', '🥈', '🥉'];
        var h = rows.map(function (r, i) {
          return '<div class="n5-p-row' + (r.uid === me.uid ? ' me' : '') + '">' +
            '<span class="rank">' + (medals[i] || (i + 1)) + '</span>' +
            (r.photo ? '<img src="' + r.photo + '" alt="" referrerpolicy="no-referrer">' : '<span class="n5-p-avatar sm">👤</span>') +
            '<span class="nm">' + esc(r.name) + '<small>רמה ' + r.level + (r.streak > 1 ? ' · 🔥' + r.streak : '') + '</small></span>' +
            '<b>⚡' + r.xp + '</b></div>';
        }).join('');
        if (rows.length === 1) h += '<div class="n5-p-note small">עדיין אין חברים — שתף את קוד החבר שלך! 🤝</div>';
        host.innerHTML = h;
      }).catch(function (e) { console.error(e); host.innerHTML = '<div class="n5-p-note small">שגיאה בטעינת הטבלה</div>'; });
  }

  /* ═══════════ אתחול ═══════════ */
  function init() {
    buildProfileBtn();
    if (CFG) loadSDK(function () { });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.N5S = {
    toggle: toggle,
    storeChanged: function (k) { if (SYNC_KEYS[k]) schedulePush(); },
    progressChanged: function () {
      if (panelOpen && me) {
        var el = panel.querySelector('.n5-p-stats');
        if (el) el.outerHTML = statsRow();
      }
    }
  };
})();
