/** Layer 3 — Composite engine: place pack renders into master scenes via Sharp. */

import sharp from "sharp";

import { getScene } from "./master-scene-catalog.mjs";

const DEFAULT_SHADOW = { opacity: 0.22, blur: 14, offsetX: 4, offsetY: 10 };

/**
 * Remove near-white background and produce RGBA PNG.
 * @param {Buffer} buffer
 */
export async function isolateProduct(buffer) {
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = new Uint8Array(data);
  for (let i = 0; i < pixels.length; i += info.channels) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    const whiteness = Math.min(r, g, b);
    if (lum > 235 && whiteness > 210) {
      pixels[i + 3] = 0;
    } else if (lum > 200 && whiteness > 180) {
      pixels[i + 3] = Math.round(((235 - lum) / 35) * pixels[i + 3]);
    }
  }

  return sharp(pixels, {
    raw: { width: info.width, height: info.height, channels: info.channels },
  })
    .png()
    .toBuffer();
}

/**
 * @param {Buffer} productBuffer
 * @param {{ left: number; top: number; width: number; height: number }} crop - fractions 0–1
 */
export async function cropPackRegion(productBuffer, crop) {
  const meta = await sharp(productBuffer).metadata();
  const w = meta.width ?? 1024;
  const h = meta.height ?? 1024;
  const left = Math.round(crop.left * w);
  const top = Math.round(crop.top * h);
  const width = Math.round(crop.width * w);
  const height = Math.round(crop.height * h);
  return sharp(productBuffer).extract({ left, top, width, height }).png().toBuffer();
}

async function buildShadow(productRgba, shadowOpts) {
  const meta = await sharp(productRgba).metadata();
  const w = meta.width ?? 1;
  const h = meta.height ?? 1;
  const { opacity, blur, offsetX, offsetY } = { ...DEFAULT_SHADOW, ...shadowOpts };

  const silhouette = await sharp(productRgba)
    .ensureAlpha()
    .extractChannel(3)
    .toColourspace("b-w")
    .linear(0, 0)
    .blur(blur)
    .toBuffer();

  const shadowW = w + Math.abs(offsetX) + blur * 2;
  const shadowH = h + Math.abs(offsetY) + blur * 2;

  const shadowLayer = await sharp({
    create: {
      width: shadowW,
      height: shadowH,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: silhouette,
        left: Math.max(0, offsetX) + blur,
        top: Math.max(0, offsetY) + blur,
        blend: "over",
      },
    ])
    .png()
    .toBuffer();

  const { data, info } = await sharp(shadowLayer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const px = new Uint8Array(data);
  for (let i = 0; i < px.length; i += 4) {
    const a = px[i + 3];
    px[i] = 30;
    px[i + 1] = 25;
    px[i + 2] = 20;
    px[i + 3] = Math.round(a * opacity);
  }

  return {
    buffer: await sharp(px, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer(),
    width: shadowW,
    height: shadowH,
    offsetX: Math.max(0, offsetX) + blur - blur,
    offsetY: Math.max(0, offsetY) + blur - blur,
    pad: blur,
  };
}

/**
 * Composite product onto scene background.
 * @param {object} opts
 * @param {Buffer} opts.sceneBuffer
 * @param {Buffer} opts.productBuffer
 * @param {{ x?: number; y?: number; scale?: number }} [opts.placement] - normalized 0–1 center + scale of canvas width
 * @param {object} [opts.shadow]
 * @param {boolean} [opts.useIsolation]
 */
export async function compositeProductOnScene(opts) {
  const started = Date.now();
  const { sceneBuffer, productBuffer, placement = {}, shadow, useIsolation = true } = opts;

  const sceneMeta = await sharp(sceneBuffer).metadata();
  const canvasW = sceneMeta.width ?? 1280;
  const canvasH = sceneMeta.height ?? 960;

  let product = productBuffer;
  if (useIsolation) {
    product = await isolateProduct(productBuffer);
  }

  const prodMeta = await sharp(product).metadata();
  const prodW = prodMeta.width ?? 512;
  const prodH = prodMeta.height ?? 512;

  const scale = placement.scale ?? 0.3;
  const targetW = Math.round(canvasW * scale);
  const targetH = Math.round((prodH / prodW) * targetW);

  const resized = await sharp(product).resize(targetW, targetH, { fit: "inside" }).png().toBuffer();
  const resizedMeta = await sharp(resized).metadata();
  const rw = resizedMeta.width ?? targetW;
  const rh = resizedMeta.height ?? targetH;

  const cx = (placement.x ?? 0.5) * canvasW;
  const cy = (placement.y ?? 0.5) * canvasH;
  const left = Math.round(cx - rw / 2);
  const top = Math.round(cy - rh / 2);

  const shadowData = await buildShadow(resized, shadow);
  const shadowLeft = left + (shadow?.offsetX ?? DEFAULT_SHADOW.offsetX) - shadowData.pad;
  const shadowTop = top + (shadow?.offsetY ?? DEFAULT_SHADOW.offsetY) - shadowData.pad;

  const sceneBase = await sharp(sceneBuffer).resize(canvasW, canvasH, { fit: "fill" }).png().toBuffer();

  const layers = [];
  if (shadowData.buffer) {
    layers.push({ input: shadowData.buffer, left: Math.max(0, shadowLeft), top: Math.max(0, shadowTop), blend: "over" });
  }
  layers.push({ input: resized, left: Math.max(0, left), top: Math.max(0, top), blend: "over" });

  const composed = await sharp(sceneBase).composite(layers).png().toBuffer();

  const warmed = await sharp(composed)
    .modulate({ brightness: 1.02, saturation: 0.98 })
    .sharpen({ sigma: 0.4 })
    .png()
    .toBuffer();

  return {
    buffer: warmed,
    durationMs: Date.now() - started,
    width: canvasW,
    height: canvasH,
  };
}

/**
 * Composite using scene slug + pack buffer with scene default placement.
 */
export async function compositeFromSceneSlug(sceneSlug, sceneBuffer, productBuffer, overrides = {}) {
  const scene = getScene(sceneSlug);
  const placement = { ...scene?.placement, ...overrides.placement };
  return compositeProductOnScene({
    sceneBuffer,
    productBuffer,
    placement,
    shadow: overrides.shadow,
    useIsolation: overrides.useIsolation ?? true,
  });
}
