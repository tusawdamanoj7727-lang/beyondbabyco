#!/usr/bin/env node
/**
 * Compare homepage image payload: simulated BEFORE (w=1920,q=90 defaults)
 * vs AFTER (correct sizes/quality from image-delivery.ts).
 *
 * Requires a running Next server. Usage:
 *   node scripts/compare-homepage-image-payload.mjs [baseUrl]
 */
const base = process.argv[2] ?? "http://127.0.0.1:3000";

/** Representative homepage assets and their BEFORE vs AFTER optimizer params. */
const HOMEPAGE_IMAGES = [
  {
    label: "Hero editorial photo",
    path: "/images/generated/hero/gentle-care-hero.webp",
    before: { w: 1920, q: 90 },
    after: { w: 1200, q: 82 },
    note: "sizes: 50vw desktop → max deviceSize 1200",
  },
  {
    label: "Hero mascot (wave/welcome/hug) ×3",
    path: "/icons/bella-bunny/wave.webp",
    count: 3,
    before: { w: 1920, q: 90 },
    after: { w: 128, q: 70 },
    note: "sizes: 112px display",
  },
  {
    label: "Footer mascots ×6",
    path: "/icons/bella-bunny/wave.webp",
    count: 6,
    before: { w: 1920, q: 90 },
    after: { w: 128, q: 65 },
    note: "sizes: 64px",
  },
  {
    label: "Science feature icons ×3",
    path: "/images/generated/science/lab-environment.webp",
    count: 3,
    before: { w: 1920, q: 85 },
    after: { w: 128, q: 68 },
    note: "sizes: 56px (was Unsplash remote)",
  },
  {
    label: "Lifestyle card thumbs ×6",
    path: "/images/generated/lifestyle/bath-time.webp",
    count: 6,
    before: { w: 1920, q: 85 },
    after: { w: 128, q: 68 },
    note: "sizes: 96px (was width=400)",
  },
  {
    label: "Brand promise card icons ×3",
    path: "/images/generated/lifestyle/premium-home.webp",
    count: 3,
    before: { w: 1920, q: 85 },
    after: { w: 256, q: 68 },
    note: "sizes: 144px (was width=400)",
  },
  {
    label: "Featured product cards ×8",
    path: "/images/generated/products/baby-wipes/front.webp",
    count: 8,
    before: { w: 1920, q: 85 },
    after: { w: 400, q: 80 },
    note: "sizes: 25vw desktop grid",
  },
  {
    label: "Lifestyle/science/research hero panels ×3",
    path: "/images/generated/lifestyle/bath-time.webp",
    count: 3,
    before: { w: 1920, q: 85 },
    after: { w: 640, q: 78 },
    note: "sizes: 30vw desktop split hero",
  },
  {
    label: "Research timeline entries ×6",
    path: "/images/generated/research/lab-bench.webp",
    count: 6,
    before: { w: 1920, q: 85 },
    after: { w: 400, q: 78 },
    note: "sizes: 400px",
  },
  {
    label: "Meet Our Friends mascots ×6",
    path: "/icons/bella-bunny/default.webp",
    count: 6,
    before: { w: 1920, q: 90 },
    after: { w: 384, q: 70 },
    note: "sizes: 320px (160px display)",
  },
  {
    label: "Decorative section mascots ×4",
    path: "/icons/poppy-panda/hug.webp",
    count: 4,
    before: { w: 1920, q: 90 },
    after: { w: 256, q: 70 },
    note: "120–170px display accents",
  },
  {
    label: "Testimonial avatars (~6 visible)",
    path: "/images/generated/lifestyle/applying-lotion.webp",
    count: 6,
    before: { w: 1920, q: 85 },
    after: { w: 96, q: 68 },
    note: "sizes: 48px",
  },
];

async function measureOptimized(path, w, q) {
  const url = `${base}/_next/image?url=${encodeURIComponent(path)}&w=${w}&q=${q}`;
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  const buf = await res.arrayBuffer();
  return { bytes: buf.byteLength, url };
}

async function main() {
  console.log(`Measuring against ${base}\n`);
  let beforeTotal = 0;
  let afterTotal = 0;
  const rows = [];

  for (const item of HOMEPAGE_IMAGES) {
    const n = item.count ?? 1;
    try {
      const beforeOne = await measureOptimized(item.path, item.before.w, item.before.q);
      const afterOne = await measureOptimized(item.path, item.after.w, item.after.q);
      const beforeBytes = beforeOne.bytes * n;
      const afterBytes = afterOne.bytes * n;
      beforeTotal += beforeBytes;
      afterTotal += afterBytes;
      rows.push({
        label: item.label,
        beforeW: item.before.w,
        beforeQ: item.before.q,
        afterW: item.after.w,
        afterQ: item.after.q,
        beforeKB: (beforeBytes / 1024).toFixed(1),
        afterKB: (afterBytes / 1024).toFixed(1),
        savedKB: ((beforeBytes - afterBytes) / 1024).toFixed(1),
        note: item.note,
      });
    } catch (err) {
      rows.push({
        label: item.label,
        beforeW: item.before.w,
        beforeQ: item.before.q,
        afterW: item.after.w,
        afterQ: item.after.q,
        beforeKB: "ERR",
        afterKB: "ERR",
        savedKB: "-",
        note: String(err),
      });
    }
  }

  console.log("| Image group | Before w×q | After w×q | Before KB | After KB | Saved KB |");
  console.log("|---|---|---|---|---|---|");
  for (const r of rows) {
    console.log(
      `| ${r.label} | ${r.beforeW}×q${r.beforeQ} | ${r.afterW}×q${r.afterQ} | ${r.beforeKB} | ${r.afterKB} | ${r.savedKB} |`,
    );
  }

  console.log(`\n**Estimated homepage image payload**`);
  console.log(`Before: ${(beforeTotal / 1024).toFixed(0)} KB (${(beforeTotal / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`After:  ${(afterTotal / 1024).toFixed(0)} KB (${(afterTotal / 1024 / 1024).toFixed(2)} MB)`);
  console.log(
    `Saved:  ${((beforeTotal - afterTotal) / 1024).toFixed(0)} KB (${(((beforeTotal - afterTotal) / beforeTotal) * 100).toFixed(0)}% reduction)`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
