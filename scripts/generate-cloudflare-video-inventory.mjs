import { createHash } from "node:crypto";
import { createReadStream, existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, join, relative, resolve, sep } from "node:path";

const root = resolve(import.meta.dirname, "..");
const publicRoot = join(root, "public");
const r2Prefix = "Echo15";
const cdnOrigin = "https://echovideo.jd.cn";
const sourceFiles = ["memory-demo-data.js", "script.js", "long-video/index.html", "wm/index.html", "wm/script.js"];
const sourceText = Object.fromEntries(sourceFiles.map((file) => [file, readFileSync(join(root, file), "utf8")]));

const walk = (directory) => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const path = join(directory, entry.name);
  return entry.isDirectory() ? walk(path) : [path];
});

const sha256 = (path) => new Promise((resolveHash, reject) => {
  const hash = createHash("sha256");
  const stream = createReadStream(path);
  stream.on("data", (chunk) => hash.update(chunk));
  stream.on("error", reject);
  stream.on("end", () => resolveHash(hash.digest("hex")));
});

const encodePath = (value) => value.split("/").map(encodeURIComponent).join("/");
const cleanUrl = (value) => value.split("?")[0];
const csvCell = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
const humanBytes = (bytes) => {
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = units[0];
  for (let index = 1; index < units.length && value >= 1000; index += 1) {
    value /= 1000;
    unit = units[index];
  }
  return `${value.toFixed(value >= 100 ? 0 : value >= 10 ? 1 : 2)} ${unit}`;
};
const sanitizeR2Path = (path) => path.split("/").map((segment) => segment
  .replaceAll("...", "-")
  .replace(/[()]/g, "")
  .replace(/\s+/g, "-")
  .replace(/-+/g, "-"))
  .join("/");
const r2KeyFor = (path) => `${r2Prefix}/${sanitizeR2Path(path)}`;

const longVideoText = [sourceText["memory-demo-data.js"], sourceText["script.js"], sourceText["long-video/index.html"]].join("\n");
const wmText = [sourceText["wm/index.html"], sourceText["wm/script.js"]].join("\n");
const referencedBlueBeardShots = new Set(Array.from({ length: 6 }, (_, index) => `shot-${String(index + 1).padStart(2, "0")}.mp4`));

const localVideos = walk(publicRoot).filter((path) => extname(path).toLowerCase() === ".mp4").sort();
const rows = [];

for (const path of localVideos) {
  const repoPath = relative(root, path).split(sep).join("/");
  const publicPath = repoPath.replace(/^public\//, "");
  const filename = path.split(sep).at(-1);
  const scope = publicPath.startsWith("wm/") ? "world-model" : "long-video";
  let referenced = false;
  let referencedBy = "local inventory only";

  if (scope === "world-model") {
    if (publicPath.startsWith("wm/assets/optimized/results/")) {
      referenced = sourceText["wm/script.js"].includes(filename);
      referencedBy = referenced ? "wm/script.js generated runs" : referencedBy;
    } else {
      const wmRelative = publicPath.replace(/^wm\//, "");
      referenced = sourceText["wm/index.html"].includes(`./${wmRelative}`) || sourceText["wm/index.html"].includes(filename);
      referencedBy = referenced ? "wm/index.html" : referencedBy;
    }
  } else if (publicPath.startsWith("media/blue-beard/shots/")) {
    referenced = referencedBlueBeardShots.has(filename);
    referencedBy = referenced ? "script.js case manifest" : referencedBy;
  } else {
    referenced = longVideoText.includes(filename);
    referencedBy = referenced ? "long-video demo configuration" : referencedBy;
  }

  const targetKey = r2KeyFor(publicPath);
  const currentUrl = referenced ? `${cdnOrigin}/${encodePath(targetKey)}` : `/${publicPath}`;

  rows.push({
    scope,
    referenced,
    referencedBy,
    sourceKind: currentUrl.startsWith("http") ? "r2+local-copy" : "local-only",
    repoPath,
    currentUrl,
    targetKey,
    bytes: statSync(path).size,
    sha256: await sha256(path),
    status: "local-ok",
  });
}

const externalPattern = /https:\/\/(?:mayanwen\.bj\.bcebos\.com|echovideo\.jd\.cn)\/[^"\s]+?\.mp4(?:\?[^"\s]+)?/g;
const externalUrls = [...new Set(Object.values(sourceText).flatMap((text) => text.match(externalPattern) || []).map(cleanUrl))].sort();
const knownUrls = new Set(rows.map((row) => decodeURI(cleanUrl(row.currentUrl))));

for (const url of externalUrls) {
  if (knownUrls.has(decodeURI(url))) continue;
  let bytes = "";
  let status = "not-probed";
  try {
    const response = await fetch(url, { method: "HEAD", headers: { Origin: "https://echo-team-joy-future-academy-jd.github.io" } });
    status = `http-${response.status}`;
    bytes = response.headers.get("content-length") || "";
  } catch {
    status = "probe-failed";
  }
  const objectPath = new URL(url).pathname
    .replace(/^\/datatransfer\/echo15-page-assets-20260824\/videos\//, "")
    .replace(/^\/Echo15\//, "");
  rows.push({
    scope: url.includes("/wm") || url.includes("game") || url.includes("ti2av_") ? "world-model" : "long-video",
    referenced: true,
    referencedBy: "literal BOS URL in source",
    sourceKind: url.includes("echovideo.jd.cn") ? "r2-only" : "bos-only",
    repoPath: "",
    currentUrl: url,
    targetKey: r2KeyFor(decodeURI(objectPath)),
    bytes,
    sha256: "",
    status,
  });
}

rows.sort((left, right) => Number(right.referenced) - Number(left.referenced) || left.scope.localeCompare(right.scope) || left.targetKey.localeCompare(right.targetKey));

const columns = ["scope", "required", "source_kind", "repo_path", "current_url", "target_r2_key", "bytes", "sha256", "referenced_by", "status"];
const csvRows = rows.map((row) => [row.scope, row.referenced ? "yes" : "no", row.sourceKind, row.repoPath, row.currentUrl, row.targetKey, row.bytes, row.sha256, row.referencedBy, row.status]);
const csv = [columns, ...csvRows].map((row) => row.map(csvCell).join(",")).join("\n") + "\n";

const requiredRows = rows.filter((row) => row.referenced);
const optionalRows = rows.filter((row) => !row.referenced);
const requiredBytes = requiredRows.reduce((total, row) => total + Number(row.bytes || 0), 0);
const optionalBytes = optionalRows.reduce((total, row) => total + Number(row.bytes || 0), 0);
const localHashes = rows.filter((row) => row.sha256).map((row) => row.sha256);
const uniqueLocalHashes = new Set(localHashes);
const duplicateCopies = localHashes.length - uniqueLocalHashes.size;

const markdown = `# Cloudflare video migration inventory

Generated from the current site source and local media tree. Query strings are intentionally removed from BOS URLs so signed credentials are not copied into the inventory.

## Migration set

| Set | Objects | Known bytes | Purpose |
| --- | ---: | ---: | --- |
| Required by current pages | ${requiredRows.length} | ${humanBytes(requiredBytes)} | Upload or proxy these first. |
| Local extras, not currently referenced | ${optionalRows.length} | ${humanBytes(optionalBytes)} | Optional archive; not required for launch. |
| Full inventory | ${rows.length} | ${humanBytes(requiredBytes + optionalBytes)} | Every local or explicit remote video found. |

The local tree contains ${localVideos.length} MP4 files but only ${uniqueLocalHashes.size} unique SHA-256 payloads (${duplicateCopies} duplicate copies). The exact object-level list is in [cloudflare-video-assets.csv](./cloudflare-video-assets.csv).

## Cloudflare layout

- Required objects are stored in the \`joyai\` R2 bucket using the CSV \`target_r2_key\` values.
- Public video delivery reuses the Echo 1.0 accelerated hostname: \`https://echovideo.jd.cn/Echo15/\`.
- Keep video responses cacheable and support byte ranges (\`Range\`, \`206 Partial Content\`).
- Return \`Content-Type: video/mp4\`, \`Access-Control-Allow-Origin\` for the site origins, and expose \`Accept-Ranges\`, \`Content-Length\`, \`Content-Range\`, and \`ETag\`.
- Replace the BOS base URL and long-video local video paths with one configurable media base URL.
- Do not copy the existing one-year signed BOS query string; use the Cloudflare hostname instead.

## DNS routing

The existing \`echovideo.jd.cn\` route is reused. Its DNS resolves through \`cloudscdn.net\`, and byte-range requests for the new \`Echo15/\` objects are served through Cloudflare.

## Verification after upload

1. Compare uploaded object count and byte totals with the required rows in the CSV.
2. Verify a sample from each page with \`HEAD\` and a byte-range request.
3. Confirm CORS using both the production GitHub Pages origin and the development origin.
4. Switch the site media base URL, build, and test seeking, sound, and WM waveform analysis.
`;

writeFileSync(join(root, "Doc/cloudflare-video-assets.csv"), csv);
writeFileSync(join(root, "Doc/CLOUDFLARE_VIDEO_MIGRATION.md"), markdown);
console.log(`Wrote ${rows.length} rows (${requiredRows.length} required, ${optionalRows.length} optional).`);
