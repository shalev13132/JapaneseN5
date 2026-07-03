// Extracts vocab + kanji tables from all N5-week*.html lessons into assets/deck-data.js
const fs = require('fs');
const path = require('path');

const root = process.argv[2];
const strip = s => s.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

function parseTable(seg) {
  const tableM = seg.match(/<table[\s\S]*?<\/table>/);
  if (!tableM) return null;
  const t = tableM[0];
  const headM = t.match(/<thead>[\s\S]*?<\/thead>/);
  const headers = headM ? [...headM[0].matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)].map(m => strip(m[1])) : [];
  const rows = [...t.matchAll(/<tr>([\s\S]*?)<\/tr>/g)]
    .map(m => [...m[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(c => strip(c[1])))
    .filter(cells => cells.length >= 2);
  return { headers, rows };
}

function colMap(headers) {
  // maps header labels to semantic keys
  const map = {};
  headers.forEach((h, i) => {
    if (/קאנג/.test(h) || /יפנית/.test(h)) map.jp = i;
    else if (/קריאה/.test(h)) map.read = i;
    else if (/עברית/.test(h) || /משמעות/.test(h)) map.he = i;
    else if (/סוג/.test(h)) map.type = i;
  });
  return map;
}

function extractSection(html, headRe) {
  const m = html.match(headRe);
  if (!m) return null;
  const start = m.index + m[0].length;
  const next = html.indexOf('<h2 class="section', start);
  return html.slice(start, next === -1 ? html.length : next);
}

const decks = {};
for (let w = 1; w <= 20; w++) {
  const file = path.join(root, `N5-week${w}-lesson.html`);
  if (!fs.existsSync(file)) continue;
  const html = fs.readFileSync(file, 'utf8');
  const titleM = html.match(/<title>שבוע \d+ — ([^|<]+)/);
  const week = { title: titleM ? titleM[1].trim() : `שבוע ${w}`, vocab: [], kanji: [] };

  const vseg = extractSection(html, /<h2 class="section">אוצר מילים[^<]*<\/h2>/);
  if (vseg) {
    const t = parseTable(vseg);
    if (t) {
      const c = colMap(t.headers);
      for (const r of t.rows) {
        const jp = r[c.jp ?? 0], he = r[c.he ?? (r.length - 1)];
        let read = c.read != null ? r[c.read] : '';
        // week1 style: 私（わたし） — split reading out of parens
        let front = jp;
        const pm = jp.match(/^(.+?)（(.+?)）$/);
        if (pm) { front = pm[1]; if (!read) read = pm[2]; }
        if (front && he) week.vocab.push([front, read || '', he]);
      }
    }
  }

  const kseg = extractSection(html, /<h2 class="section k">קאנג'י[^<]*<\/h2>/);
  if (kseg) {
    const t = parseTable(kseg);
    if (t) {
      const c = colMap(t.headers);
      for (const r of t.rows) {
        const k = r[c.jp ?? 0], read = c.read != null ? r[c.read] : (r[1] || ''), he = r[c.he ?? (r.length - 1)];
        if (k && he) week.kanji.push([k, read, he]);
      }
    }
  }
  decks[w] = week;
}

const totals = Object.values(decks).reduce((a, w) => { a.v += w.vocab.length; a.k += w.kanji.length; return a; }, { v: 0, k: 0 });
console.log(`vocab: ${totals.v}, kanji: ${totals.k}`);
for (const [w, d] of Object.entries(decks)) console.log(`week ${w}: ${d.vocab.length} vocab, ${d.kanji.length} kanji — ${d.title}`);

fs.mkdirSync(path.join(root, 'assets'), { recursive: true });
const out = '// Auto-generated from lesson pages — vocab & kanji decks for flashcards\nwindow.N5_DECKS = ' + JSON.stringify(decks) + ';\n';
fs.writeFileSync(path.join(root, 'assets', 'deck-data.js'), out, 'utf8');
console.log('written assets/deck-data.js');
