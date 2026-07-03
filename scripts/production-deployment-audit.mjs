#!/usr/bin/env node
/**
 * Production deployment audit — read-only analysis.
 * Run: node scripts/production-deployment-audit.mjs
 */
import { createHash } from "node:crypto";
import { createReadStream, existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function dirname(p) {
  return p.replace(/\/[^/]+$/, "");
}

function formatBytes(n) {
  if (n >= 1024 ** 3) return `${(n / 1024 ** 3).toFixed(2)} GB`;
  if (n >= 1024 ** 2) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  if (n >= 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${n} B`;
}

function dirSize(dirPath) {
  if (!existsSync(dirPath)) return 0;
  let total = 0;
  const stack = [dirPath];
  while (stack.length) {
    const current = stack.pop();
    let entries;
    try {
      entries = readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.isFile()) {
        try {
          total += statSync(full).size;
        } catch {
          /* skip */
        }
      }
    }
  }
  return total;
}

function walkFiles(dirPath, opts = {}) {
  const skip = opts.skip ?? [];
  const exts = opts.exts;
  const files = [];
  if (!existsSync(dirPath)) return files;
  const stack = [dirPath];
  while (stack.length) {
    const current = stack.pop();
    const rel = relative(root, current);
    if (skip.some((s) => rel === s || rel.startsWith(`${s}/`))) continue;
    let entries;
    try {
      entries = readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const full = join(current, entry.name);
      const r = relative(root, full);
      if (entry.isDirectory()) {
        if (!skip.some((s) => r === s || r.startsWith(`${s}/`))) stack.push(full);
      } else if (entry.isFile()) {
        if (exts && !exts.includes(extname(entry.name).toLowerCase())) continue;
        try {
          files.push({ path: full, rel: r, size: statSync(full).size });
        } catch {
          /* skip */
        }
      }
    }
  }
  return files;
}

async function hashFile(filePath) {
  return new Promise((resolvePromise, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(filePath);
    stream.on("data", (d) => hash.update(d));
    stream.on("end", () => resolvePromise(hash.digest("hex")));
    stream.on("error", reject);
  });
}

function readTextSources() {
  const dirs = ["src", "scripts", "tests", "supabase"];
  const exts = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".css", ".json", ".sql", ".md"]);
  const chunks = [];
  for (const dir of dirs) {
    const full = join(root, dir);
    for (const f of walkFiles(full)) {
      if (!exts.has(extname(f.path).toLowerCase())) continue;
      try {
        chunks.push(readFileSync(f.path, "utf8"));
      } catch {
        /* skip */
      }
    }
  }
  try {
    chunks.push(readFileSync(join(root, "next.config.ts"), "utf8"));
  } catch {
    /* optional */
  }
  return chunks.join("\n");
}

const SKIP_FOR_SCAN = ["node_modules", ".git", ".next", "tools/comfyui/ComfyUI", "tools/comfyui/venv", "tools/comfyui/models", "coverage"];

const IMAGE_EXT = [".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".ico", ".avif"];
const VIDEO_EXT = [".mp4", ".webm", ".mov", ".avi", ".mkv"];
const FONT_EXT = [".woff", ".woff2", ".ttf", ".otf", ".eot"];

async function main() {
  const folders = {
    node_modules: dirSize(join(root, "node_modules")),
    ".next": dirSize(join(root, ".next")),
    ".git": dirSize(join(root, ".git")),
    public: dirSize(join(root, "public")),
    "public/images/generated": dirSize(join(root, "public/images/generated")),
    "public/icons": dirSize(join(root, "public/icons")),
    scripts: dirSize(join(root, "scripts")),
    src: dirSize(join(root, "src")),
    tools: dirSize(join(root, "tools")),
    "tools/comfyui/models": dirSize(join(root, "tools/comfyui/models")),
    coverage: dirSize(join(root, "coverage")),
    ".next/cache": dirSize(join(root, ".next/cache")),
  };

  const totalProject = dirSize(root);

  const allFiles = walkFiles(root, { skip: SKIP_FOR_SCAN });
  allFiles.sort((a, b) => b.size - a.size);
  const top100 = allFiles.slice(0, 100);

  // Duplicate detection (images in public only, >4KB)
  const publicImages = walkFiles(join(root, "public"), { exts: IMAGE_EXT });
  const hashMap = new Map();
  const duplicates = [];
  for (const f of publicImages.filter((x) => x.size > 4096)) {
    try {
      const h = await hashFile(f.path);
      const existing = hashMap.get(h);
      if (existing) duplicates.push({ hash: h.slice(0, 12), size: f.size, files: [existing.rel, f.rel] });
      else hashMap.set(h, f);
    } catch {
      /* skip */
    }
  }

  const sourceBlob = readTextSources();

  function isReferenced(relPath) {
    const variants = new Set([
      relPath,
      `/${relPath.replace(/^public\//, "")}`,
      relPath.replace(/^public\//, ""),
      basename(relPath),
    ]);
    for (const v of variants) {
      if (v.length > 3 && sourceBlob.includes(v)) return true;
    }
    return false;
  }

  const unusedImages = publicImages.filter((f) => !isReferenced(f.rel)).slice(0, 50);
  const videos = walkFiles(root, { skip: SKIP_FOR_SCAN, exts: VIDEO_EXT });
  const unusedVideos = videos.filter((f) => !isReferenced(f.rel));
  const fonts = walkFiles(root, { skip: SKIP_FOR_SCAN, exts: FONT_EXT });
  const unusedFonts = fonts.filter((f) => !isReferenced(f.rel));

  const deployablePublic = dirSize(join(root, "public")) - dirSize(join(root, "public/images/generated"));
  const deployableEstimate = folders.src + deployablePublic + folders.scripts * 0 + dirSize(join(root, "supabase"));

  const gitignore = existsSync(join(root, ".gitignore")) ? readFileSync(join(root, ".gitignore"), "utf8") : "";
  const gitignoreChecks = {
    node_modules: /node_modules/.test(gitignore),
    ".next": /\.next/.test(gitignore),
    coverage: /coverage/.test(gitignore),
    cache: /cache|\.cache|\.turbo/.test(gitignore),
    logs: /log|npm-debug/.test(gitignore),
    temp: /\.tmp|temp|\.DS_Store/.test(gitignore),
    env: /\.env/.test(gitignore),
    comfyui: /comfyui|tools\/comfyui/.test(gitignore),
    generated: /generated/.test(gitignore),
  };

  const report = {
    generatedAt: new Date().toISOString(),
    totalProjectSize: formatBytes(totalProject),
    totalProjectBytes: totalProject,
    folders: Object.fromEntries(Object.entries(folders).map(([k, v]) => [k, formatBytes(v)])),
    folderBytes: folders,
    deployableEstimate: formatBytes(deployableEstimate + 500_000),
    deployableNote: "src + public (excl. generated/) + supabase + config — built on CI; excludes node_modules, .next, tools/",
    top100Files: top100.map((f) => ({ size: formatBytes(f.size), path: f.rel })),
    duplicateGroups: duplicates.length,
    duplicateSamples: duplicates.slice(0, 20),
    unusedImagesCount: publicImages.filter((f) => !isReferenced(f.rel)).length,
    unusedImagesSample: unusedImages.map((f) => ({ size: formatBytes(f.size), path: f.rel })),
    videosCount: videos.length,
    unusedVideos,
    fontsCount: fonts.length,
    unusedFonts,
    gitignoreChecks,
    cachesToExcludeFromDeploy: [
      { path: ".next/", size: formatBytes(folders[".next"]), note: "Build output — regenerate on CI" },
      { path: ".next/cache/", size: formatBytes(folders[".next/cache"]), note: "Webpack/Turbopack cache" },
      { path: "node_modules/", size: formatBytes(folders.node_modules), note: "Install on CI" },
      { path: "coverage/", size: formatBytes(folders.coverage), note: "Test coverage" },
      { path: "tools/comfyui/", size: formatBytes(folders["tools/comfyui/models"] + dirSize(join(root, "tools/comfyui/venv")) + dirSize(join(root, "tools/comfyui/ComfyUI"))), note: "Local AI — not for web deploy" },
    ],
  };

  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
