/* ═══════════════════════════════════════════════════════════
   word-art.js — אימוג'י לכל מילת אוצר
   מוסיף תמונה קטנה לטבלאות אוצר המילים ולכרטיסיות
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* מפה: מילה יפנית ← אימוג'י */
  var MAP = {
    /* שבוע 1 */
    'こんにちは': '👋', 'ありがとう': '🙏', 'すみません': '🙇', 'はい': '✅', 'いいえ': '❌',
    '私': '🙋', 'あなた': '🫵', 'これ': '☝️', '学生': '🧑‍🎓', '先生': '👩‍🏫',
    /* שבוע 2 */
    '一つ〜十': '🔢', '百': '💯', '千': '🧮', '万': '🗻', 'いくら': '🏷️', '円': '💴',
    'お金': '💵', '本': '📖', '猫': '🐱', '車': '🚗',
    /* שבוע 3 */
    '高い': '📈', '安い': '📉', '新しい': '✨', '古い': '🏚️', '大きい': '🐘', '小さい': '🐭',
    'おいしい': '😋', 'いい': '👍', 'よい': '👍', '忙しい': '🏃', 'おもしろい': '😄', '静か': '🤫',
    '有名': '⭐', '元気': '💪', 'きれい': '🌸', '今日': '📅', '明日': '🌅', '昨日': '🌇', '毎日': '🔁',
    /* שבוע 4 */
    'あります': '📦', 'います': '🧍', 'どこ': '🗺️', 'ここ': '📍', 'そこ': '👉', 'あそこ': '🔭',
    '上': '⬆️', '下': '⬇️', '中': '🎯', '前': '⏩', '後ろ': '⏪', '隣': '🤝',
    '部屋': '🚪', '机': '🖥️', 'いす': '🪑', '財布': '👛', '犬': '🐶', '誰': '❓',
    /* שבוע 5 */
    '好き': '❤️', '嫌い': '💔', '上手': '🏆', '下手': '😅', '難しい': '🧗', '楽しい': '🎉',
    'かわいい': '🥰', '音楽': '🎵', '料理': '🍳', '歌': '🎤', '英語': '🇬🇧', '日本語': '🇯🇵',
    'サッカー': '⚽', '父': '👨', '母': '👩', '兄': '👦', '姉': '👧', '家族': '👨‍👩‍👧‍👦',
    /* שבוע 6 */
    '食べる': '🍽️', '飲む': '🥤', '見る': '👀', '聞く': '👂', '読む': '📖', '書く': '✍️',
    '話す': '💬', '買う': '🛒', '行く': '🚶', '来る': '🛬', 'する': '⚙️', '勉強する': '📚',
    '起きる': '⏰', '寝る': '😴', '一緒に': '👫', '何も': '🚫', '映画': '🎬', '水': '💧',
    /* שבוע 7 */
    '帰る': '🏠', '会う': '🤝', '送る': '📮', '朝ごはん': '🍳', '昼ごはん': '🍱', '晩ごはん': '🍜',
    '手紙': '✉️', '学校': '🏫', '大学': '🎓', '図書館': '📚', '公園': '🌳', 'それから': '➡️',
    '午前': '🌅', '午後': '🌇', '夜': '🌙', '名前': '📛',
    /* שבוע 8 */
    '電車': '🚃', 'バス': '🚌', '自転車': '🚲', '飛行機': '✈️', '駅': '🚉', '箸': '🥢',
    '傘': '☂️', '雨': '🌧️', '疲れた': '😫', '眠い': '🥱', '早く': '💨', 'どうして': '❓',
    'なぜ': '🤔', '働く': '💼', '一人で': '🧍', '週末': '🎡', '新幹線': '🚄',
    /* שבוע 9 */
    '言う': '🗣️', '走る': '🏃', '切る': '✂️', '出かける': '🚪', '降る': '🌧️', '洗う': '🧼',
    '磨く': '🪥', 'と思う': '💭', 'まえに': '⏪', '歯': '🦷', '手': '✋', '雪': '❄️',
    '野菜': '🥦', '肉': '🥩', '魚': '🐟', '果物': '🍎',
    /* שבוע 10 */
    '待つ': '⏳', '遊ぶ': '🎮', '泳ぐ': '🏊', '死ぬ': '💀', '宿題': '📝', '怒る': '😠',
    'テレビ': '📺', 'もう': '✅', 'まだ': '⌛', 'お腹': '🍙', '空く': '😋', 'ラーメン': '🍜',
    'わかる': '💡', '嬉しい': '😊', '悲しい': '😢',
    /* שבוע 11 */
    '住む': '🏡', '知る': '🧠', '結婚する': '💍', '撮る': '📸', '写真': '🖼️', '心配する': '😟',
    '少し': '🤏', 'ゆっくり': '🐢', 'もう一度': '🔁', '電話する': '📞', '座る': '🪑', '立つ': '🧍',
    /* שבוע 12 */
    '使う': '🔧', '吸う': '🚬', '止める': '🛑', '開ける': '🔓', '閉める': '🔒', '手伝う': '🤝',
    '教室': '🏫', '授業': '👩‍🏫', '休み時間': '☕', '携帯': '📱', 'タバコ': '🚬', '窓': '🪟',
    'どうぞ': '🤲', '静かに': '🤫',
    /* שבוע 13 */
    'ほしい': '🎁', '時間': '⏰', '誕生日': '🎂', 'プレゼント': '🎁', '何か': '❔',
    '誰か': '👤', 'どこか': '🗺️', 'どんな': '🤷', 'ので': '➡️',
    /* שבוע 14 */
    '明るい': '💡', '暗い': '🌑', '短い': '📏', '長い': '🦒', '親切': '💗', '面白い': '😄',
    '大丈夫': '👌', '開いている': '🔓',
    /* שבוע 15 */
    'より': '⚖️', 'ほう': '👉', 'どちら': '🤔', 'いつ': '🕐', '人': '🧑', '枚': '📄',
    '冊': '📚', '匹': '🐾', 'お茶': '🍵', '飛ぶ': '🕊️',
    /* שבוע 16 */
    'だけ': '☝️', 'とき': '⏰', '時': '⏰', '必要': '❗', 'パスポート': '🛂', 'お土産': '🎁',
    '本当': '💯', 'コート': '🧥', '寒い': '🥶', 'おにぎり': '🍙', 'コンビニ': '🏪',
    /* שבוע 17 */
    '復習': '🔁', '練習': '🏋️', '試験': '📝', '点数': '💯', '合格する': '🎉', '間違える': '❌',
    '正しい': '✅', '自信': '💪',
    /* שבוע 18 */
    '読解': '📖', '聴解': '🎧', 'お知らせ': '📢', '借りる': '🤲', '着く': '🛬',
    'いらっしゃいませ': '🙇', '探す': '🔍', 'サイズ': '📐'
  };

  /* נירמול: "父（ちち）/ お父さん" → "父" · "とき／時" → "とき" */
  function norm(s) {
    return (s || '')
      .replace(/（[^）]*）/g, '')
      .replace(/\([^)]*\)/g, '')
      .split('／')[0].split('/')[0]
      .replace(/[\s　]+/g, ' ')
      .trim();
  }
  function emoji(jp) { return MAP[norm(jp)] || null; }

  /* מפה הפוכה: עברית ← אימוג'י (לכרטיסיות בכיוון עברית←יפנית) */
  var HE = {};
  (function () {
    var D = window.N5_DECKS || {};
    Object.keys(D).forEach(function (w) {
      (D[w].vocab || []).forEach(function (r) {
        var e = emoji(r[0]);
        if (e && r[2] && !HE[r[2].trim()]) HE[r[2].trim()] = e;
      });
    });
  })();
  function heEmoji(t) { return HE[(t || '').trim()] || null; }

  /* ── טבלאות אוצר מילים בשיעורים ── */
  function decorateTables() {
    document.querySelectorAll('table').forEach(function (tb) {
      if (tb.classList.contains('kanji')) return;
      tb.querySelectorAll('tbody tr').forEach(function (tr) {
        var td = tr.querySelector('td.jp');
        if (!td || td.classList.contains('big') || td.querySelector('.n5-wa')) return;
        var e = emoji(td.textContent);
        if (!e) return;
        var s = document.createElement('span');
        s.className = 'n5-wa r';   /* class r — לא ייכלל בהקראה */
        s.textContent = e;
        td.insertBefore(s, td.firstChild);
      });
    });
  }

  /* ── כרטיסיות זיכרון ── */
  function decorateCard(scene) {
    var jpMain = scene.querySelector('.fc-main.jp');
    var heMain = scene.querySelector('.fc-front .fc-main.he');
    var e = jpMain ? emoji(jpMain.textContent) : null;
    if (!e && heMain) e = heEmoji(heMain.textContent);
    if (!e) return;
    /* צד התשובה תמיד מקבל אימוג'י */
    var back = scene.querySelector('.fc-back');
    if (back && !back.querySelector('.n5-wa-big')) {
      var b = document.createElement('div');
      b.className = 'n5-wa-big'; b.textContent = e;
      back.insertBefore(b, back.firstChild);
    }
    /* צד קדמי — רק כשהוא בעברית (לא מסגיר את התשובה) */
    if (heMain) {
      var front = scene.querySelector('.fc-front');
      if (front && !front.querySelector('.n5-wa-big')) {
        var f = document.createElement('div');
        f.className = 'n5-wa-big'; f.textContent = e;
        front.insertBefore(f, front.firstChild);
      }
    }
  }
  function watchFlashcards() {
    var area = document.getElementById('fc-area');
    if (!area) return;
    new MutationObserver(function () {
      var scene = area.querySelector('.fc-scene');
      if (scene) decorateCard(scene);
    }).observe(area, { childList: true });
    var scene = area.querySelector('.fc-scene');
    if (scene) decorateCard(scene);
  }

  function init() { decorateTables(); watchFlashcards(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.N5_ART = { emoji: emoji, heEmoji: heEmoji };
})();
