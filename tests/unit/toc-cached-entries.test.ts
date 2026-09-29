// An imported index keeps the rows its file cached, as both word processors show them,
// and they survive a save through either format.
import { describe, it, expect } from 'vitest';
import { zipSync, strToU8 } from 'fflate';
import { importDocx } from '../../src/lib/import/docx';
import { importOdt } from '../../src/lib/import/odt';
import { buildDocx } from '../../src/lib/export/docx';
import { buildOdt } from '../../src/lib/export/odt';

const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const MARGINS = { top: 2, bottom: 2, left: 2, right: 2 };

const row = (style: string, text: string, page: string) =>
  `<w:p><w:pPr><w:pStyle w:val="${style}"/></w:pPr><w:r><w:t>${text}</w:t></w:r><w:r><w:tab/></w:r><w:r><w:t>${page}</w:t></w:r></w:p>`;

// The cache deliberately lists one heading fewer than the document holds.
const docx = zipSync({
  'word/document.xml': strToU8(`<?xml version="1.0"?>
<w:document xmlns:w="${W}"><w:body>
  <w:p>
    <w:r><w:fldChar w:fldCharType="begin"/></w:r>
    <w:r><w:instrText xml:space="preserve"> TOC \\o "1-3" \\h </w:instrText></w:r>
    <w:r><w:fldChar w:fldCharType="separate"/></w:r>
    <w:r><w:t>1</w:t></w:r><w:r><w:tab/></w:r><w:r><w:t>Chapter</w:t></w:r><w:r><w:tab/></w:r><w:r><w:t>3</w:t></w:r>
  </w:p>
  ${row('TOC2', 'Section', '4')}
  <w:p><w:r><w:fldChar w:fldCharType="end"/></w:r></w:p>
  <w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Chapter</w:t></w:r></w:p>
  <w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:t>Section</w:t></w:r></w:p>
  <w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:t>Left out</w:t></w:r></w:p>
</w:body></w:document>`),
  'word/styles.xml': strToU8(`<?xml version="1.0"?>
<w:styles xmlns:w="${W}"><w:style w:type="paragraph" w:styleId="TOC2"><w:name w:val="toc 2"/></w:style></w:styles>`),
});

const toc = (doc: any) => doc.content.content.find((n: any) => n.type === 'tableOfContents');
const CACHED = [{ text: '1 Chapter', level: 1, page: 3 }, { text: 'Section', level: 2, page: 4 }];

describe('an imported index', () => {
  it('shows the rows its DOCX field cached', () => {
    expect(toc(importDocx(docx)).attrs.entries).toEqual(CACHED);
  });

  it('keeps them through ODF and DOCX', async () => {
    const doc: any = importDocx(docx).content;
    expect(toc(importOdt(await buildOdt(doc, MARGINS, 'portrait'))).attrs.entries).toEqual(CACHED);
    expect(toc(importDocx(await buildDocx(doc, MARGINS, 'portrait'))).attrs.entries).toEqual(CACHED);
  });
});
