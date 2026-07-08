#!/usr/bin/env node
/**
 * Measure total optimized image payload for the homepage.
 * Usage: node scripts/measure-homepage-images.mjs [baseUrl]
 */
const base = process.argv[2] ?? "http://127.0.0.1:3000";

async function fetchText(url) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.text();
}

function extractImageUrls(html) {
  const urls = new Set();
  // Prefer `src` (what the browser downloads) over full srcset enumeration.
  const srcRe = /src="(\/_next\/image\?url=[^"]+)"/g;
  for (const match of html.matchAll(srcRe)) {
    urls.add(match[1].replace(/&amp;/g, "&"));
  }
  if (urls.size === 0) {
    const fallbackRe = /\/_next\/image\?url=[^"\s<>]+/g;
    for (const match of html.matchAll(fallbackRe)) {
      urls.add(match[0].replace(/&amp;/g, "&"));
    }
  }
  return [...urls];
}

async function measureUrl(path) {
  const bytes = await fetch(`${base}${path}`, { redirect: "follow" }).then(async (r) => {
    if (!r.ok) throw new Error(`${path} → ${r.status}`);
    const buf = await r.arrayBuffer();
    return buf.byteLength;
  });
  return bytes;
}

async function main() {
  console.log(`Fetching homepage from ${base}…`);
  const html = await fetchText(`${base}/`);
  const urls = extractImageUrls(html);
  console.log(`Found ${urls.length} unique /_next/image URLs in HTML\n`);

  let total = 0;
  const rows = [];

  for (const path of urls.sort()) {
    try {
      const bytes = await measureUrl(path);
      total += bytes;
      const w = path.match(/[?&]w=(\d+)/)?.[1] ?? "?";
      const q = path.match(/[?&]q=(\d+)/)?.[1] ?? "?";
      const raw = decodeURIComponent(path.match(/url=([^&]+)/)?.[1] ?? "").slice(0, 72);
      rows.push({ w, q, bytes, raw, path });
    } catch (err) {
      rows.push({ w: "?", q: "?", bytes: 0, raw: String(err), path });
    }
  }

  for (const row of rows) {
    console.log(
      `${String(row.bytes).padStart(7)} B  w=${String(row.w).padStart(4)} q=${row.q}  ${row.raw}`,
    );
  }

  console.log(`\nTotal image payload: ${(total / 1024).toFixed(1)} KB (${total} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
