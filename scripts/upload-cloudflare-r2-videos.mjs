import { createWriteStream, existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { get } from "node:https";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawn } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const bucket = process.env.R2_BUCKET || "joyai";
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const wrangler = process.env.WRANGLER_BIN;
const concurrency = Number(process.env.UPLOAD_CONCURRENCY || 3);
const maxAttempts = Number(process.env.UPLOAD_ATTEMPTS || 4);
const startIndex = Number(process.env.UPLOAD_START_INDEX || 0);
const publicBase = process.env.R2_PUBLIC_BASE?.replace(/\/+$/, "");
const cacheRoot = join(tmpdir(), "echo15-r2-migration");

if (!accountId) throw new Error("CLOUDFLARE_ACCOUNT_ID is required.");
if (!wrangler || !existsSync(wrangler)) throw new Error("WRANGLER_BIN must point to the Wrangler executable.");

const parseCsvLine = (line) => {
  const values = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      values.push(value);
      value = "";
    } else {
      value += char;
    }
  }
  values.push(value);
  return values;
};

const [headerLine, ...dataLines] = readFileSync(join(root, "Doc/cloudflare-video-assets.csv"), "utf8")
  .trim()
  .split(/\r?\n/);
const headers = parseCsvLine(headerLine);
const allRows = dataLines
  .map((line) => Object.fromEntries(headers.map((header, index) => [header, parseCsvLine(line)[index]])))
  .filter((row) => row.required === "yes");
const rows = allRows.slice(startIndex);

const run = (command, args) => new Promise((resolveRun, rejectRun) => {
  const child = spawn(command, args, {
    cwd: root,
    env: { ...process.env, CLOUDFLARE_ACCOUNT_ID: accountId },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  child.stdout.on("data", (chunk) => { output += chunk; });
  child.stderr.on("data", (chunk) => { output += chunk; });
  child.on("error", rejectRun);
  child.on("close", (code) => {
    if (code === 0) resolveRun(output);
    else rejectRun(new Error(`${command} exited with ${code}: ${output.trim()}`));
  });
});

const delay = (milliseconds) => new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds));

const runWithRetry = async (command, args) => {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await run(command, args);
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) await delay(attempt * 5000);
    }
  }
  throw lastError;
};

const download = (url, destination, redirects = 0) => new Promise((resolveDownload, rejectDownload) => {
  mkdirSync(dirname(destination), { recursive: true });
  const request = get(url, (response) => {
    if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location && redirects < 5) {
      response.resume();
      resolveDownload(download(new URL(response.headers.location, url).href, destination, redirects + 1));
      return;
    }
    if (response.statusCode !== 200) {
      response.resume();
      rejectDownload(new Error(`Download failed with HTTP ${response.statusCode}: ${new URL(url).pathname}`));
      return;
    }
    const stream = createWriteStream(destination);
    response.pipe(stream);
    stream.on("finish", () => stream.close(resolveDownload));
    stream.on("error", rejectDownload);
  });
  request.setTimeout(120_000, () => request.destroy(new Error("Download timed out")));
  request.on("error", rejectDownload);
});

const localPathFor = async (row) => {
  if (row.repo_path) return join(root, row.repo_path);
  const destination = join(cacheRoot, row.target_r2_key);
  const expectedBytes = Number(row.bytes || 0);
  if (!existsSync(destination) || (expectedBytes && statSync(destination).size !== expectedBytes)) {
    await download(row.current_url, destination);
  }
  if (expectedBytes && statSync(destination).size !== expectedBytes) {
    throw new Error(`Size mismatch after download: ${row.target_r2_key}`);
  }
  return destination;
};

const encodePath = (value) => value.split("/").map(encodeURIComponent).join("/");
const isAlreadyPublic = async (row) => {
  if (!publicBase) return false;
  try {
    const response = await fetch(`${publicBase}/${encodePath(row.target_r2_key)}`, {
      method: "HEAD",
      headers: { Origin: "https://echo-team-joy-future-academy-jd.github.io" },
    });
    const expectedBytes = Number(row.bytes || 0);
    const actualBytes = Number(response.headers.get("content-length") || 0);
    return response.ok && (!expectedBytes || expectedBytes === actualBytes);
  } catch {
    return false;
  }
};

let nextIndex = 0;
let completed = 0;
const failures = [];

const worker = async () => {
  while (nextIndex < rows.length) {
    const index = nextIndex;
    nextIndex += 1;
    const row = rows[index];
    try {
      if (await isAlreadyPublic(row)) {
        completed += 1;
        console.log(`[${startIndex + completed}/${allRows.length}] skip ${row.target_r2_key}`);
        continue;
      }
      const localPath = await localPathFor(row);
      await runWithRetry(wrangler, [
        "r2", "object", "put", `${bucket}/${row.target_r2_key}`,
        "--file", localPath,
        "--content-type", "video/mp4",
        "--cache-control", "public, max-age=31536000, immutable",
        "--force",
        "--remote",
      ]);
      completed += 1;
      console.log(`[${startIndex + completed}/${allRows.length}] ${row.target_r2_key}`);
    } catch (error) {
      failures.push({ key: row.target_r2_key, error: error.message });
      console.error(`[failed] ${row.target_r2_key}: ${error.message}`);
    }
  }
};

mkdirSync(cacheRoot, { recursive: true });
await Promise.all(Array.from({ length: Math.max(1, concurrency) }, worker));

if (failures.length) {
  console.error(JSON.stringify(failures, null, 2));
  process.exitCode = 1;
} else {
  console.log(`Uploaded ${completed} video objects from required index ${startIndex}; target ${bucket}/Echo15/.`);
}
