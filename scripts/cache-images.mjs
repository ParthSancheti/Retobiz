#!/usr/bin/env node
/**
 * Optional offline demo mode (DESIGN §4.1): downloads every registry photo to
 * /public/img/{pexelsId}.jpg and flips USE_LOCAL_IMAGES to true.
 *
 *   npm run images:cache          # download + switch to local
 *   npm run images:cache -- --off # switch back to remote URLs
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const registryPath = path.join(root, "data/images.ts");
const src = readFileSync(registryPath, "utf8");
const setFlag = (on) =>
  writeFileSync(registryPath, src.replace(/USE_LOCAL_IMAGES = (true|false)/, `USE_LOCAL_IMAGES = ${on}`));

if (process.argv.includes("--off")) {
  setFlag(false);
  console.log("Switched back to remote image URLs.");
  process.exit(0);
}

const ids = [...new Set([...src.matchAll(/pexelsId:\s*(\d+)/g)].map((m) => m[1]))];
const out = path.join(root, "public/img");
mkdirSync(out, { recursive: true });

let failed = 0;
for (const id of ids) {
  const url = `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1080`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const isJpeg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
    if (!isJpeg) throw new Error(`not a JPEG (${res.headers.get("content-type")})`);
    if (buf.length < 15 * 1024) throw new Error(`too small (${buf.length} bytes)`);
    writeFileSync(path.join(out, `${id}.jpg`), buf);
    console.log(`✓ ${id}  ${(buf.length / 1024).toFixed(0)} KB`);
  } catch (e) {
    failed++;
    console.log(`✗ ${id}  ${e.message}`);
  }
}

if (failed) {
  console.error(`\n${failed} downloads failed; registry left on remote URLs.`);
  process.exit(1);
}
setFlag(true);
console.log(`\nCached ${ids.length} images to public/img and enabled USE_LOCAL_IMAGES.`);
