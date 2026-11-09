// Markdown -> DOCX для документов ГДД.
// Поддержка: заголовки, абзацы, списки, таблицы, цитаты, код, **жирный**, [ссылки](url),
// разметка изменений {+новое+} (жёлтое выделение) и {-старое-} (серое выделение).
// Использование: node md2docx.js in.md out.docx [--legend]
const fs = require('fs');
const d = require('docx');
const [, , inPath, outPath, ...flags] = process.argv;
const legend = flags.includes('--legend');
// [[Документ|подпись]] → ссылка на Google Docs (если документ там есть), иначе «подпись»
const GDOC = JSON.parse(fs.readFileSync(require('path').join(__dirname, 'gdoc_links.json'), 'utf8'));
const wiki = (name, label) => (GDOC[name] ? `[${label}](${GDOC[name]})` : `«${label}»`);
const src = fs.readFileSync(inPath, 'utf8').replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, (_, n, l) => wiki(n, l)).replace(/\[\[([^\]]+)\]\]/g, (_, n) => wiki(n, n)).replace(/\\([-+.!#*\[\]()_])/g, '$1').replace(/\u202f|\u00a0/g, ' ');
const FONT = 'Arial';
const PAGE_W = 11906, MARGIN = 1134, CONTENT_W = PAGE_W - 2 * MARGIN;
const HL = { '+': 'yellow', '-': 'lightGray' };

function inline(text, base) {
  const out = [];
  const re = /(\*\*([^*]+)\*\*)|(\[([^\]]+)\]\(([^)]+)\))|(`([^`]+)`)/g;
  let last = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(new d.TextRun({ text: text.slice(last, m.index), font: FONT, ...base }));
    if (m[1]) out.push(new d.TextRun({ text: m[2], bold: true, font: FONT, ...base }));
    else if (m[3]) out.push(new d.ExternalHyperlink({ link: m[5], children: [new d.TextRun({ text: m[4], style: 'Hyperlink', font: FONT, ...base })] }));
    else out.push(new d.TextRun({ text: m[7], font: 'Courier New', ...base }));
    last = re.lastIndex;
  }
  if (last < text.length) out.push(new d.TextRun({ text: text.slice(last), font: FONT, ...base }));
  return out;
}

function runs(text, base = {}) {
  const out = [];
  const re = /\{([+-])([\s\S]*?)\1\}/g;
  let last = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(...inline(text.slice(last, m.index), base));
    out.push(...inline(m[2], { ...base, highlight: HL[m[1]], ...(m[1] === '-' ? { color: '595959' } : {}) }));
    last = re.lastIndex;
  }
  if (last < text.length) out.push(...inline(text.slice(last), base));
  return out;
}
const cleanHeading = (s) => s.replace(/\*\*/g, '').trim();

const children = [];
if (legend) {
  children.push(new d.Paragraph({ spacing: { after: 160 }, border: { left: { style: d.BorderStyle.SINGLE, size: 12, color: 'C9A227', space: 8 } }, indent: { left: 240 }, children: [
    new d.TextRun({ text: 'Правки: ', bold: true, font: FONT, size: 20 }),
    new d.TextRun({ text: 'новое — жёлтым', font: FONT, size: 20, highlight: 'yellow' }),
    new d.TextRun({ text: ', ', font: FONT, size: 20 }),
    new d.TextRun({ text: 'старое (заменено) — серым', font: FONT, size: 20, highlight: 'lightGray', color: '595959' }),
    new d.TextRun({ text: '. Серый текст оставлен для сравнения; при переносе в Google Docs его можно удалить.', font: FONT, size: 20 }),
  ] }));
}
const lines = src.split('\n');
let first = true;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trimEnd();
  if (line.startsWith('```')) {
    i++;
    while (i < lines.length && !lines[i].startsWith('```')) { children.push(new d.Paragraph({ spacing: { after: 0 }, children: [new d.TextRun({ text: lines[i] || ' ', font: 'Courier New', size: 18 })] })); i++; }
    children.push(new d.Paragraph({ children: [] }));
    continue;
  }
  if (!line.trim()) continue;
  const h = line.match(/^(#{1,3})\s+(.*)$/);
  if (h) {
    const txt = cleanHeading(h[2]);
    if (!txt) continue;
    const level = first ? d.HeadingLevel.TITLE : [d.HeadingLevel.HEADING_1, d.HeadingLevel.HEADING_2, d.HeadingLevel.HEADING_3][h[1].length - 1];
    children.push(new d.Paragraph({ heading: level, children: runs(txt) }));
    first = false;
    continue;
  }
  first = false;
  if (line.trim().startsWith('|')) {
    const rows = [];
    while (i < lines.length && lines[i].trim().startsWith('|')) {
      const cells = lines[i].trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      if (!cells.every((c) => /^:?-+:?$/.test(c))) rows.push(cells);
      i++;
    }
    i--;
    const n = Math.max(...rows.map((r) => r.length));
    const w = Math.floor(CONTENT_W / n), widths = Array(n).fill(w);
    widths[n - 1] = CONTENT_W - w * (n - 1);
    children.push(new d.Table({
      width: { size: CONTENT_W, type: d.WidthType.DXA }, columnWidths: widths,
      rows: rows.map((r, ri) => new d.TableRow({
        tableHeader: ri === 0,
        children: widths.map((cw, ci) => new d.TableCell({
          width: { size: cw, type: d.WidthType.DXA },
          shading: ri === 0 ? { type: d.ShadingType.CLEAR, fill: 'E8E4DA', color: 'auto' } : undefined,
          margins: { top: 60, bottom: 60, left: 100, right: 100 },
          children: [new d.Paragraph({ children: runs(r[ci] || '', { size: 18, bold: ri === 0 }) })],
        })),
      })),
    }));
    children.push(new d.Paragraph({ children: [] }));
    continue;
  }
  const b = line.match(/^\s*[*-]\s+(.*)$/);
  if (b) { children.push(new d.Paragraph({ numbering: { reference: 'bul', level: 0 }, children: runs(b[1]) })); continue; }
  const num = line.match(/^(\d+)\.\s+(.*)$/);
  if (num) { children.push(new d.Paragraph({ indent: { left: 540, hanging: 260 }, children: runs(num[1] + '. ' + num[2]) })); continue; }
  const q = line.match(/^>\s?(.*)$/);
  if (q) { children.push(new d.Paragraph({ border: { left: { style: d.BorderStyle.SINGLE, size: 12, color: 'C9A227', space: 8 } }, indent: { left: 240 }, children: runs(q[1], { italics: true, color: '555555' }) })); continue; }
  children.push(new d.Paragraph({ children: runs(line) }));
}

const hd = (size, ol) => ({ run: { font: FONT, size, bold: true }, paragraph: { spacing: { before: 240, after: 120 }, keepNext: true, outlineLevel: ol } });
const doc = new d.Document({
  styles: {
    default: { document: { run: { font: FONT, size: 22 }, paragraph: { spacing: { after: 100, line: 276 } } } },
    paragraphStyles: [
      { id: 'Title', name: 'Title', basedOn: 'Normal', run: { font: FONT, size: 40, bold: true }, paragraph: { spacing: { before: 0, after: 200 }, keepNext: true } },
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, ...hd(30, 0) },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, ...hd(26, 1) },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, ...hd(23, 2) },
    ],
  },
  numbering: { config: [{ reference: 'bul', levels: [{ level: 0, format: d.LevelFormat.BULLET, text: '•', alignment: d.AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 260 } } } }] }] },
  sections: [{ properties: { page: { size: { width: PAGE_W, height: 16838 }, margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN } } }, children }],
});
d.Packer.toBuffer(doc).then((buf) => { fs.writeFileSync(outPath, buf); console.log('wrote', outPath); });
