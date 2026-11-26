#!/usr/bin/env node
/**
 * Zero-404 guardrail: HEAD-checks every URL produced by data/images.ts
 * (all sizes) and exits 1 if any does not return HTTP 200.
 *
 *   npm run images:verify
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const src = readFileSync(path.join(root, "data/images.ts"), "utf8");

const entries = [...src.matchAll(/"([a-z0-9-]+)":\s*\{\s*pexelsId:\s*(\d+)/g)].map(([, key, id]) => ({ key, id }));
if (entries.length === 0) {
  console.error("No registry entries found in data/images.ts");
  process.exit(1);
}

const sizes = { card: 600, reel: 1080 };
const urlFor = (id, w, reel) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}${reel ? `&h=${Math.round(w * (16 / 9))}&fit=crop` : ""}`;

async function check(url) {
  for (const method of ["HEAD", "GET"]) {
    try {
      const res = await fetch(url, { method, redirect: "follow", signal: AbortSignal.timeout(15000) });
      if (method === "GET") res.body?.cancel();
      if (res.status === 200 || method === "GET") return { status: res.status, type: res.headers.get("content-type") ?? "" };
    } catch (e) {
      if (method === "GET") return { status: 0, type: String(e.cause?.code ?? e.message) };
    }
  }
  return { status: 0, type: "unknown" };
}

let failed = 0;
const queue = entries.flatMap(({ key, id }) => [
  { key, url: urlFor(id, sizes.card, false) },
  { key, url: urlFor(id, sizes.reel, true) },
]);

const results = [];
const CONCURRENCY = 6;
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length) {
      const job = queue.shift();
      const r = await check(job.url);
      results.push({ ...job, ...r });
    }
  }),
);

for (const r of results.sort((a, b) => a.key.localeCompare(b.key))) {
  const ok = r.status === 200 && r.type.startsWith("image/");
  if (!ok) failed++;
  console.log(`${ok ? "✓" : "✗"} ${String(r.status).padEnd(3)} ${r.key.padEnd(26)} ${ok ? "" : r.type + "  " + r.url}`);
}

console.log(`\n${results.length - failed}/${results.length} URLs OK across ${entries.length} registry images.`);
process.exit(failed ? 1 : 0);
