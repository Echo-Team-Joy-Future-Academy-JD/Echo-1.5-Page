import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, extname, join, resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const sourceVideo = resolve(process.argv[2] || "");
const caseId = process.argv[3]?.trim();
const caseTitle = process.argv.slice(4).join(" ").trim() || caseId;

if (!sourceVideo || !existsSync(sourceVideo) || !caseId) {
  throw new Error(
    "Usage: node scripts/prepare-previous-shot-case.mjs <video> <case-id> [title]",
  );
}

const outputRoot = join(projectRoot, "public", "media", caseId);
const sourceRoot = join(projectRoot, "public", "media", "source");
const sourceExtension = extname(sourceVideo) || ".mp4";
const outputVideoName = `${caseId}${sourceExtension}`;
const outputVideo = join(sourceRoot, outputVideoName);
const outputPosterName = `${caseId}-poster.jpg`;
const outputPoster = join(sourceRoot, outputPosterName);
const referencesRoot = join(outputRoot, "references");
const audioRoot = join(outputRoot, "audio");
const shotDuration = 10;

const run = (program, args, { capture = false } = {}) => execFileSync(
  program,
  args,
  {
    cwd: projectRoot,
    stdio: capture ? ["ignore", "pipe", "inherit"] : "inherit",
    maxBuffer: 32 * 1024 * 1024,
  },
);

const duration = Number(run(
  "ffprobe",
  [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    sourceVideo,
  ],
  { capture: true },
).toString().trim());

if (!Number.isFinite(duration) || duration <= 0) {
  throw new Error(`Could not read duration from ${basename(sourceVideo)}`);
}

const waveformForRange = (startTime, rangeDuration) => {
  const raw = run(
    "ffmpeg",
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-ss",
      startTime.toFixed(3),
      "-t",
      rangeDuration.toFixed(3),
      "-i",
      sourceVideo,
      "-map",
      "0:a:0",
      "-ac",
      "1",
      "-ar",
      "180",
      "-f",
      "f32le",
      "pipe:1",
    ],
    { capture: true },
  );
  const samples = new Float32Array(
    raw.buffer,
    raw.byteOffset,
    Math.floor(raw.byteLength / Float32Array.BYTES_PER_ELEMENT),
  );
  const bucketCount = 180;
  const bucketSize = Math.max(1, Math.ceil(samples.length / bucketCount));

  return Array.from({ length: bucketCount }, (_, bucketIndex) => {
    const start = bucketIndex * bucketSize;
    const end = Math.min(samples.length, start + bucketSize);
    let peak = 0;
    for (let sampleIndex = start; sampleIndex < end; sampleIndex += 1) {
      peak = Math.max(peak, Math.abs(samples[sampleIndex]));
    }
    return Number(Math.min(1, peak).toFixed(4));
  });
};

rmSync(outputRoot, { recursive: true, force: true });
mkdirSync(referencesRoot, { recursive: true });
mkdirSync(audioRoot, { recursive: true });
mkdirSync(sourceRoot, { recursive: true });
copyFileSync(sourceVideo, outputVideo);

run("ffmpeg", [
  "-hide_banner",
  "-loglevel",
  "error",
  "-ss",
  Math.min(0.5, duration / 2).toFixed(3),
  "-i",
  sourceVideo,
  "-frames:v",
  "1",
  "-vf",
  "scale=640:-2",
  "-q:v",
  "3",
  outputPoster,
  "-y",
]);

const shotCount = Math.ceil(duration / shotDuration);
const shots = [];

for (let shotIndex = 0; shotIndex < shotCount; shotIndex += 1) {
  const shotNumber = String(shotIndex + 1).padStart(3, "0");
  const shotId = `shot-${shotNumber}`;
  const startTime = shotIndex * shotDuration;
  const endTime = Math.min(duration, startTime + shotDuration);
  const currentDuration = endTime - startTime;
  const previousShotIndex = shotIndex - 1;
  let visualMemory = [];
  let audioMemory = null;

  if (previousShotIndex >= 0) {
    const previousNumber = String(previousShotIndex + 1).padStart(3, "0");
    const previousShotId = `shot-${previousNumber}`;
    const previousStart = previousShotIndex * shotDuration;
    const previousEnd = Math.min(duration, previousStart + shotDuration);
    const previousDuration = previousEnd - previousStart;
    const sampleTime = previousStart + previousDuration * 0.58;
    const referenceDirectory = join(referencesRoot, shotId);
    const referenceName = "reference-01.jpg";
    const referencePath = join(referenceDirectory, referenceName);
    const audioName = `${previousShotId}.m4a`;
    const audioPath = join(audioRoot, audioName);

    mkdirSync(referenceDirectory, { recursive: true });
    run("ffmpeg", [
      "-hide_banner",
      "-loglevel",
      "error",
      "-ss",
      sampleTime.toFixed(3),
      "-i",
      sourceVideo,
      "-frames:v",
      "1",
      "-vf",
      "scale=320:-2",
      "-q:v",
      "3",
      referencePath,
      "-y",
    ]);
    run("ffmpeg", [
      "-hide_banner",
      "-loglevel",
      "error",
      "-ss",
      previousStart.toFixed(3),
      "-t",
      previousDuration.toFixed(3),
      "-i",
      sourceVideo,
      "-map",
      "0:a:0",
      "-c:a",
      "aac",
      "-b:a",
      "64k",
      audioPath,
      "-y",
    ]);

    visualMemory = [{
      id: `${shotId}-previous-shot-frame`,
      src: `references/${shotId}/${referenceName}`,
      label: `${previousShotId} · previous shot`,
      referenceType: "previous_shot",
      memoryId: "PREVIOUS_SHOT",
      sourceShotId: previousShotId,
      timestamp: Number(sampleTime.toFixed(3)),
    }];
    audioMemory = {
      id: `${previousShotId}-audio-memory`,
      src: `audio/${audioName}`,
      timestamp: Number(previousStart.toFixed(3)),
      duration: Number(previousDuration.toFixed(3)),
      label: `${previousShotId} · audio memory`,
      waveform: waveformForRange(previousStart, previousDuration),
    };
  }

  shots.push({
    id: shotId,
    index: shotIndex,
    sequence: shotIndex + 1,
    title: `${caseTitle} · ${shotId}`,
    startTime: Number(startTime.toFixed(3)),
    endTime: Number(endTime.toFixed(3)),
    duration: Number(currentDuration.toFixed(3)),
    loadedIds: visualMemory.length ? ["PREVIOUS_SHOT"] : [],
    readsMemoryFrom: previousShotIndex >= 0
      ? `shot-${String(previousShotIndex + 1).padStart(3, "0")}`
      : null,
    visualMemory,
    promptMemory: [],
    audioMemory,
  });
}

const manifest = {
  schemaVersion: 1,
  id: `echo-1.5-${caseId}`,
  title: caseTitle,
  source: `../source/${outputVideoName}`,
  poster: `../source/${outputPosterName}`,
  duration: Number(duration.toFixed(3)),
  shotDuration,
  shotCount,
  rule: "Each ten-second target shot displays one frame and the audio extracted from the immediately preceding shot. Intermediate generation requests were unavailable, so prompt memory is intentionally empty.",
  shots,
};

writeFileSync(
  join(outputRoot, "manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
);

console.log(
  `Prepared ${caseTitle}: ${shotCount} shots, ${Math.max(shotCount - 1, 0)} image memories, and ${Math.max(shotCount - 1, 0)} audio memories.`,
);
