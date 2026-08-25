#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { basename, extname, resolve } from "node:path";

const ACCOUNT_ID = "3f33af015e86fa3495efaed77d9c8c36";
const BUCKET = "joyai";
const ROOT_PREFIX = "Echo15/wm";
const PUBLIC_ROOT = "https://echovideo.jd.cn/Echo15/wm";
const PRODUCTION_ORIGIN = "https://echo-team-joy-future-academy-jd.github.io";

const sectionDirectories = new Map([
  ["hero", "assets/optimized/featured"],
  ["audio", "assets/optimized/featured/audio"],
  ["demos", "assets/optimized/featured/viewpoint"],
  ["fpp", "assets/optimized/results/01-fpp-world-generalization"],
  ["tpp", "assets/optimized/results/02-tpp-camera-subject-control"],
  ["native-audio", "assets/optimized/results/03-native-audio-visual"],
  ["multi-turn", "assets/optimized/results/04-multi-turn"],
]);

const aliases = new Map([
  ["viewpoint", "demos"],
  ["on-screen-voice", "audio"],
  ["01", "fpp"],
  ["02", "tpp"],
  ["03", "native-audio"],
  ["04", "multi-turn"],
]);

const args = process.argv.slice(2);
const option = (name) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};
const flag = (name) => args.includes(name);

if (flag("--help")) {
  console.log(`Usage:
  npm run upload:wm-case -- --file /absolute/case.mp4 --section <section> [--slug case-slug] [--dry-run] [--replace]

Sections: ${[...sectionDirectories.keys()].join(", ")}`);
  process.exit(0);
}

const sourceArg = option("--file");
const requestedSection = option("--section");
if (!sourceArg || !requestedSection) {
  throw new Error("Both --file and --section are required. Run with --help for usage.");
}

const source = resolve(sourceArg);
if (!existsSync(source) || !statSync(source).isFile()) throw new Error(`Video not found: ${source}`);
if (extname(source).toLowerCase() !== ".mp4") throw new Error("The upload helper accepts MP4 files only.");

const section = aliases.get(requestedSection) || requestedSection;
const directory = sectionDirectories.get(section);
if (!directory) throw new Error(`Unknown section: ${requestedSection}`);

const slugify = (value) => value
  .normalize("NFKD")
  .replace(/\.[^.]+$/, "")
  .toLowerCase()
  .replace(/\.{3,}/g, "-")
  .replace(/[()]/g, "")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "")
  .replace(/-+/g, "-");

const slug = slugify(option("--slug") || basename(source));
if (!slug) throw new Error("Could not derive an ASCII slug. Supply --slug explicitly.");

const relativeKey = `${directory}/${slug}.mp4`;
const objectKey = `${ROOT_PREFIX}/${relativeKey}`;
const publicUrl = `${PUBLIC_ROOT}/${relativeKey.split("/").map(encodeURIComponent).join("/")}`;
const expectedBytes = statSync(source).size;

const run = (command, commandArgs, options = {}) => {
  const result = spawnSync(command, commandArgs, {
    encoding: "utf8",
    stdio: options.capture ? ["ignore", "pipe", "pipe"] : "inherit",
    env: { ...process.env, CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID || ACCOUNT_ID },
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} exited with ${result.status}${options.capture ? `: ${(result.stderr || result.stdout).trim()}` : ""}`);
  }
  return result.stdout || "";
};

const ffprobe = JSON.parse(run("ffprobe", [
  "-v", "error",
  "-show_entries", "stream=codec_type,codec_name",
  "-of", "json",
  source,
], { capture: true }));
const videoStream = ffprobe.streams?.find((stream) => stream.codec_type === "video");
const audioStream = ffprobe.streams?.find((stream) => stream.codec_type === "audio");
if (!videoStream) throw new Error("The MP4 has no video stream.");
if (["audio", "native-audio"].includes(section) && !audioStream) {
  throw new Error(`Section ${section} requires an audio stream, but none was found.`);
}

console.log(`SOURCE=${source}`);
console.log(`SECTION=${section}`);
console.log(`VIDEO_CODEC=${videoStream.codec_name}`);
console.log(`AUDIO_CODEC=${audioStream?.codec_name || "none"}`);
console.log(`R2_BUCKET=${BUCKET}`);
console.log(`OBJECT_KEY=${objectKey}`);
console.log(`PUBLIC_URL=${publicUrl}`);
console.log(`BYTES=${expectedBytes}`);

if (flag("--dry-run")) process.exit(0);

const existing = await fetch(publicUrl, {
  method: "HEAD",
  headers: { Origin: PRODUCTION_ORIGIN, "Cache-Control": "no-cache" },
}).catch(() => null);
if (existing?.ok && !flag("--replace")) {
  throw new Error(`The public URL already exists. Use a new slug, or obtain explicit approval and pass --replace: ${publicUrl}`);
}

const customWrangler = process.env.WRANGLER_BIN;
const wranglerCommand = customWrangler || "npx";
const wranglerPrefix = customWrangler ? [] : ["--yes", "wrangler@latest"];
run(wranglerCommand, [
  ...wranglerPrefix,
  "r2", "object", "put", `${BUCKET}/${objectKey}`,
  "--file", source,
  "--content-type", "video/mp4",
  "--cache-control", "public, max-age=31536000, immutable",
  "--force",
  "--remote",
]);

const delay = (milliseconds) => new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds));
let response;
for (let attempt = 0; attempt < 10; attempt += 1) {
  response = await fetch(`${publicUrl}?verify=${Date.now()}`, {
    method: "HEAD",
    headers: { Origin: PRODUCTION_ORIGIN, "Cache-Control": "no-cache" },
  }).catch(() => null);
  if (response?.ok && Number(response.headers.get("content-length")) === expectedBytes) break;
  await delay(2000);
}

if (!response?.ok) throw new Error(`CDN verification failed for ${publicUrl}`);
const actualBytes = Number(response.headers.get("content-length") || 0);
if (actualBytes !== expectedBytes) {
  throw new Error(`CDN size mismatch: expected ${expectedBytes}, received ${actualBytes}. Use a versioned slug if replacing a cached object.`);
}
if (!response.headers.get("access-control-allow-origin")) {
  throw new Error("CDN response is missing Access-Control-Allow-Origin.");
}

const rangeResponse = await fetch(`${publicUrl}?range=${Date.now()}`, {
  headers: { Origin: PRODUCTION_ORIGIN, Range: "bytes=0-1023", "Cache-Control": "no-cache" },
});
if (rangeResponse.status !== 206) {
  throw new Error(`Byte-range verification expected HTTP 206, received ${rangeResponse.status}.`);
}
await rangeResponse.body?.cancel();

console.log("UPLOAD_VERIFIED=yes");
