"use strict";
/* Centipede Peer to Peer, LLC — filled-form PDF generator.
   Self-contained (no CDN, no build step): writes a real PDF using the
   standard Helvetica core fonts. Used by the Client Dashboard to turn a
   completed in-dashboard form into the filled PDF of the official form
   layout — for in-dashboard viewing (native PDF viewer in an embedded
   frame), download for filing/printing, and the binder record.

   The header block uses the company's CURRENT letterhead contact
   standard (business cell (209) 871-3939 and the current website), per
   the CEO's standing contact update. The paper originals in the
   Library still show the retired cell number and the old .org site;
   every field, statement, and section below the header mirrors the
   paper original exactly. */
window.CentipedePDF = (function () {
  const PAGE_W = 612, PAGE_H = 792, MARGIN = 54;
  const CONTENT_W = PAGE_W - MARGIN * 2;

  /* Sanitize to WinAnsi-safe text. */
  function clean(s) {
    return String(s ?? "")
      .replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
      .replace(/[–—]/g, "-").replace(/•/g, "-")
      .replace(/[^\x20-\x7E\xA0-\xFF]/g, "");
  }
  function escPdf(s) {
    return clean(s).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  }
  /* Approximate Helvetica character width (units of em). */
  function charW(ch) {
    if (ch === " ") return 0.278;
    if ("ilj.,:;'!|".includes(ch)) return 0.278;
    if ("ft()[]".includes(ch)) return 0.333;
    if ("mwMW".includes(ch)) return 0.889;
    if (ch >= "A" && ch <= "Z") return 0.667;
    if (ch >= "0" && ch <= "9") return 0.556;
    return 0.556;
  }
  function textW(s, size) {
    let w = 0;
    for (const ch of s) w += charW(ch);
    return w * size;
  }
  function wrap(s, size, maxW) {
    const words = clean(s).split(/\s+/).filter(Boolean);
    const lines = [];
    let line = "";
    for (const word of words) {
      const trial = line ? line + " " + word : word;
      if (textW(trial, size) <= maxW || !line) line = trial;
      else { lines.push(line); line = word; }
    }
    if (line) lines.push(line);
    return lines.length ? lines : [""];
  }

  function fieldLines(f, values) {
    const v = values ? values[f.key] : undefined;
    const out = [];
    const push = (text, opts) => out.push(Object.assign({ text }, opts || {}));
    if (f.type === "checkboxes") {
      push(f.label + ":", { bold: true });
      const sel = Array.isArray(v) ? v : [];
      for (const opt of f.options || []) push((sel.includes(opt) ? "[X] " : "[ ] ") + opt, { indent: 14 });
      return out;
    }
    if (f.type === "radio") {
      push(f.label + ":", { bold: true });
      for (const opt of f.options || []) push((v === opt ? "(X) " : "( ) ") + opt, { indent: 14 });
      return out;
    }
    if (f.type === "rows") {
      push(f.label + ":", { bold: true });
      const rowsArr = Array.isArray(v) ? v : [];
      rowsArr.forEach((row, i) => {
        const parts = (f.rowFields || []).map((rf) => rf.label + ": " + (row && row[rf.key] ? row[rf.key] : "—"));
        push("Row " + (i + 1) + " — " + parts.join("  ·  "), { indent: 14 });
      });
      if (!rowsArr.length) push("(none entered)", { indent: 14 });
      return out;
    }
    const val = v == null ? "" : String(v);
    if (f.type === "signature") {
      push(f.label + ":");
      push(val || "—", { indent: 14, italic: true, size: 12 });
      return out;
    }
    if (f.type === "initials") {
      push(f.label + ": " + (val || "—"));
      return out;
    }
    if (f.type === "textarea" || textW(f.label + ": " + val, 10.5) > CONTENT_W) {
      push(f.label + ":", { bold: true });
      for (const ln of wrap(val || "—", 10.5, CONTENT_W - 14)) push(ln, { indent: 14 });
      return out;
    }
    push(f.label + ": " + (val || "—"));
    return out;
  }

  function buildLines(form, completion) {
    const values = completion.values || {};
    const lines = [];
    const push = (text, opts) => lines.push(Object.assign({ text }, opts || {}));
    push("Centipede Peer to Peer, LLC", { bold: true, size: 15, color: "navy" });
    push("Cell: (209) 871-3939 | Office: (209) 625-9863 or (209) 426-0964", { size: 8.5 });
    push("Email: centipedepeertopeer.llc@gmail.com | Board: board.centipede.stockton@gmail.com", { size: 8.5 });
    push("Web: centipedepeertopeerllc-svg.github.io | LIC: 0714781", { size: 8.5 });
    push("717 E. Longview Ave., Stockton, CA 95207 | CalMHSA Driven", { size: 8.5 });
    push("", {});
    push(form.title.toUpperCase(), { bold: true, size: 13, color: "navy" });
    push("Client: " + (completion.clientLabel || completion.clientCode || ""), { bold: true, size: 10.5 });
    push("Completed in the Centipede Client Dashboard by " + (completion.completedBy || "") + " on " + (completion.completedAtDisplay || ""), { size: 9.5 });
    push("", {});
    if (form.intro) for (const ln of wrap(form.intro, 9.5, CONTENT_W)) push(ln, { size: 9.5 });
    for (const sec of form.sections || []) {
      push("", {});
      push(sec.heading.toUpperCase(), { bold: true, size: 11, color: "navy" });
      if (sec.note) for (const ln of wrap(sec.note, 9.5, CONTENT_W)) push(ln, { size: 9.5, italic: true });
      for (const f of sec.fields || []) for (const ln of fieldLines(f, values)) push(ln.text, ln);
    }
    push("", {});
    push("— End of form —", { size: 9.5, italic: true });
    return lines;
  }

  function paginate(lines) {
    const pages = [];
    let page = [], y = PAGE_H - MARGIN;
    for (const ln of lines) {
      const size = ln.size || 10.5;
      const wrapped = ln.text === "" ? [""] : wrap(ln.text, size, CONTENT_W - (ln.indent || 0));
      for (const w of wrapped) {
        const lh = size * 1.45;
        if (y - lh < MARGIN + 30) { pages.push(page); page = []; y = PAGE_H - MARGIN; }
        page.push({ text: w, size, bold: ln.bold, italic: ln.italic, color: ln.color, indent: ln.indent || 0, y });
        y -= lh;
      }
    }
    if (page.length || !pages.length) pages.push(page);
    return pages;
  }

  function contentStream(pageLines, footerLines) {
    let s = "";
    for (const ln of pageLines) {
      if (!ln.text) continue;
      const font = ln.bold ? "F2" : (ln.italic ? "F3" : "F1");
      const color = ln.color === "navy" ? "0.063 0.141 0.243 rg" : "0.114 0.153 0.200 rg";
      s += "BT /" + font + " " + ln.size + " Tf " + color + " " + (MARGIN + ln.indent) + " " + ln.y.toFixed(1) + " Td (" + escPdf(ln.text) + ") Tj ET\n";
    }
    /* gold rule under the header on page 1 handled by caller via marker */
    let fy = MARGIN - 6;
    for (const fl of footerLines) {
      s += "BT /F1 7.5 Tf 0.35 0.32 0.25 rg " + MARGIN + " " + fy.toFixed(1) + " Td (" + escPdf(fl) + ") Tj ET\n";
      fy -= 10;
    }
    return s;
  }

  function buildBytes(form, completion) {
    const lines = buildLines(form, completion);
    const pages = paginate(lines);
    const footerBase = [
      "Source form: " + (form.source || ""),
      "Dashboard completion — client: " + (completion.clientCode || "") + " · completed by: " + (completion.completedBy || "") + " · " + (completion.completedAtDisplay || ""),
      "Locked client binders remain the official record (CPP-POL-2026-022). Confidential — share only with a signed release of information or a judge-signed court order."
    ];
    const objects = [];
    const add = (body) => { objects.push(body); return objects.length; }; // 1-based ids after header offset below
    // Object numbering: 1 catalog, 2 pages, 3 F1, 4 F2, 5 F3, then per page: page obj + content obj
    const pageIds = [], contentIds = [];
    let nextId = 6;
    for (let i = 0; i < pages.length; i++) { pageIds.push(nextId++); contentIds.push(nextId++); }
    const objs = new Map();
    objs.set(1, "<< /Type /Catalog /Pages 2 0 R >>");
    objs.set(2, "<< /Type /Pages /Kids [" + pageIds.map((id) => id + " 0 R").join(" ") + "] /Count " + pages.length + " >>");
    objs.set(3, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
    objs.set(4, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
    objs.set(5, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>");
    pages.forEach((pageLines, i) => {
      objs.set(pageIds[i], "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 " + PAGE_W + " " + PAGE_H + "] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R >> >> /Contents " + contentIds[i] + " 0 R >>");
      const footer = footerBase.concat(["Page " + (i + 1) + " of " + pages.length]);
      const stream = contentStream(pageLines, footer);
      objs.set(contentIds[i], "<< /Length " + stream.length + " >>\nstream\n" + stream + "endstream");
    });
    let out = "%PDF-1.4\n";
    const offsets = [0];
    const maxId = Math.max(...objs.keys());
    for (let id = 1; id <= maxId; id++) {
      offsets[id] = out.length;
      out += id + " 0 obj\n" + objs.get(id) + "\nendobj\n";
    }
    const xrefPos = out.length;
    out += "xref\n0 " + (maxId + 1) + "\n0000000000 65535 f \n";
    for (let id = 1; id <= maxId; id++) out += String(offsets[id]).padStart(10, "0") + " 00000 n \n";
    out += "trailer\n<< /Size " + (maxId + 1) + " /Root 1 0 R >>\nstartxref\n" + xrefPos + "\n%%EOF";
    const bytes = new Uint8Array(out.length);
    for (let i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 0xff;
    return bytes;
  }

  function buildBlob(form, completion) {
    return new Blob([buildBytes(form, completion)], { type: "application/pdf" });
  }

  return { buildBytes, buildBlob, _clean: clean };
})();
