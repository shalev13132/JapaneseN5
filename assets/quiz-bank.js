/* ═══════════════════════════════════════════════════════════
   quiz-bank.js — מאגר שאלות גדול לכל תיבות הבחינה
   מייצר אוטומטית שאלות משמעות / תרגום-הפוך / קריאה מתוך
   deck-data.js, וממזג אותן עם השאלות הכתובות-ידנית.
   makeQuiz מגריל בכל סיבוב תת-קבוצה מהמאגר המלא.
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var m = decodeURIComponent(location.pathname).match(/N5-week(\d+)-lesson/);
  var W = m ? +m[1] : null;
  var HAS_K = /[一-鿿]/;

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function J(s) { return '<span class="jp">' + s + '</span>'; }
  function BIG(s) { return '<span class="jp"><span class="big">' + s + '</span></span>'; }

  function deck() { return (window.N5_DECKS || {})[W] || null; }
  function allRows(kind) {
    var D = window.N5_DECKS || {}, out = [];
    for (var k in D) out = out.concat(D[k][kind] || []);
    return out;
  }

  // מסיחים כמחרוזות ייחודיות, שונות מהתשובה הנכונה
  function distractStrings(pool, correct, n) {
    var seen = {}; seen[correct] = 1;
    var out = [], sh = shuffle(pool.slice());
    for (var i = 0; i < sh.length && out.length < n; i++) {
      var v = sh[i];
      if (!v || seen[v]) continue;
      seen[v] = 1; out.push(v);
    }
    return out;
  }
  // מסיחים מתוך זוגות [יפנית, עברית] — פוסל גם מילים נרדפות (אותה עברית)
  function distractTerms(pairs, jp, he, n) {
    var seen = {}; seen[jp] = 1;
    var out = [], sh = shuffle(pairs.slice());
    for (var i = 0; i < sh.length && out.length < n; i++) {
      var p = sh[i];
      if (!p[0] || seen[p[0]] || p[1] === he) continue;
      seen[p[0]] = 1; out.push(p[0]);
    }
    return out;
  }

  function vocabBank() {
    var d = deck();
    if (!d || !d.vocab.length) return [];
    var rows = d.vocab, glob = allRows('vocab'), qs = [];
    var hePool = glob.map(function (r) { return r[2]; });
    var rdPool = glob.map(function (r) { return r[1]; }).filter(Boolean);
    var jpPairs = glob.map(function (r) { return [r[0], r[2]]; });
    rows.forEach(function (r) {
      var jp = r[0], rd = r[1], he = r[2];
      var heD = distractStrings(hePool, he, 3);
      if (heD.length === 3) qs.push({ q: 'מה הפירוש של ' + J(jp) + '?', options: [he].concat(heD), answer: 0 });
      var jpD = distractTerms(jpPairs, jp, he, 3);
      if (jpD.length === 3) qs.push({ q: 'איך אומרים "' + he + '" ביפנית?', options: [J(jp)].concat(jpD.map(J)), answer: 0 });
      if (rd && rd !== jp && HAS_K.test(jp)) {
        var rdD = distractStrings(rdPool, rd, 3);
        if (rdD.length === 3) qs.push({ q: 'מה הקריאה של ' + J(jp) + '?', options: [J(rd)].concat(rdD.map(J)), answer: 0 });
      }
    });
    return qs;
  }

  function kanjiBank() {
    var d = deck();
    if (!d || !d.kanji.length) return [];
    var rows = d.kanji, glob = allRows('kanji'), qs = [];
    var hePool = glob.map(function (r) { return r[2]; });
    var rdPool = glob.map(function (r) { return r[1]; }).filter(Boolean);
    var kPairs = glob.map(function (r) { return [r[0], r[2]]; });
    rows.forEach(function (r) {
      var k = r[0], rd = r[1], he = r[2];
      var heD = distractStrings(hePool, he, 3);
      if (heD.length === 3) qs.push({ q: 'מה המשמעות של ' + BIG(k) + '?', options: [he].concat(heD), answer: 0 });
      if (rd) {
        var rdD = distractStrings(rdPool, rd, 3);
        if (rdD.length === 3) qs.push({ q: 'מה הקריאה של ' + BIG(k) + '?', options: [J(rd)].concat(rdD.map(J)), answer: 0 });
      }
      var kD = distractTerms(kPairs, k, he, 3);
      if (kD.length === 3) qs.push({ q: 'איזה קאנג\'י מתאים למשמעות "' + he + '"?', options: [J(k)].concat(kD.map(J)), answer: 0 });
    });
    return qs;
  }

  window.N5_QUIZ = {
    expand: function (rootId, data) {
      if (!W || !window.N5_DECKS) return data;
      var extra = [];
      if (/vocab/.test(rootId)) extra = vocabBank();
      else if (/kanji/.test(rootId)) extra = kanjiBank();
      else if (rootId === 'quiz-final' || rootId === 'quiz-bonus') {
        extra = shuffle(vocabBank().concat(kanjiBank())).slice(0, 15);
      }
      if (!extra.length) return data;
      var seen = {};
      data.forEach(function (x) { seen[x.q] = 1; });
      extra = extra.filter(function (x) {
        if (seen[x.q]) return false;
        seen[x.q] = 1; return true;
      });
      var bank = data.concat(extra);
      bank.__show = data.length; // כמה שאלות מציגים בכל סיבוב
      return bank;
    }
  };
})();
