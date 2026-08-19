import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, join, resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const packageRoot = resolve(process.argv[2] || "");
const outputRoot = resolve(
  projectRoot,
  process.argv[3] || "public/media/last-visa",
);

if (!packageRoot || !existsSync(join(packageRoot, "index.json"))) {
  throw new Error("Pass the extracted The Last Visa shot-package directory.");
}

const index = JSON.parse(readFileSync(join(packageRoot, "index.json"), "utf8"));
const referencesRoot = join(outputRoot, "references");
const audioRoot = join(outputRoot, "audio");

rmSync(outputRoot, { recursive: true, force: true });
mkdirSync(referencesRoot, { recursive: true });
mkdirSync(audioRoot, { recursive: true });

const run = (program, args, { capture = false } = {}) =>
  execFileSync(program, args, {
    cwd: projectRoot,
    stdio: capture ? ["ignore", "pipe", "inherit"] : "inherit",
    maxBuffer: 32 * 1024 * 1024,
  });

const createWaveform = (videoPath) => {
  const raw = run(
    "ffmpeg",
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-i",
      videoPath,
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
  const floats = new Float32Array(
    raw.buffer,
    raw.byteOffset,
    Math.floor(raw.byteLength / Float32Array.BYTES_PER_ELEMENT),
  );
  const bucketCount = 180;
  const bucketSize = Math.max(1, Math.floor(floats.length / bucketCount));

  return Array.from({ length: bucketCount }, (_, bucketIndex) => {
    let peak = 0;
    const start = bucketIndex * bucketSize;
    const end = Math.min(floats.length, start + bucketSize);
    for (let sampleIndex = start; sampleIndex < end; sampleIndex += 1) {
      peak = Math.max(peak, Math.abs(floats[sampleIndex]));
    }
    return Number(Math.min(1, peak).toFixed(4));
  });
};

let timelineTime = 0;
const shots = index.entries.map((entry, shotIndex) => {
  const shotNumber = String(entry.sequence).padStart(3, "0");
  const shotId = `shot-${shotNumber}`;
  const sourceDirectory = join(packageRoot, entry.directory);
  const sourceVideo = join(packageRoot, entry.video);
  const metadata = JSON.parse(
    readFileSync(join(sourceDirectory, "metadata.json"), "utf8"),
  );
  const referenceDirectory = join(referencesRoot, shotId);
  mkdirSync(referenceDirectory, { recursive: true });

  const seenPaths = new Set();
  const visualMemory = [];
  for (const reference of metadata.references || []) {
    if (!reference.packaged_path || seenPaths.has(reference.packaged_path)) continue;
    seenPaths.add(reference.packaged_path);
    const sourceReference = join(sourceDirectory, reference.packaged_path);
    if (!existsSync(sourceReference)) continue;
    const referenceNumber = String(visualMemory.length + 1).padStart(2, "0");
    const extension = basename(sourceReference).split(".").pop() || "jpg";
    const outputName = `reference-${referenceNumber}.${extension}`;
    copyFileSync(sourceReference, join(referenceDirectory, outputName));
    visualMemory.push({
      id: `${shotId}-${reference.type}-${reference.id}-${referenceNumber}`,
      src: `references/${shotId}/${outputName}`,
      label: `${reference.id} · ${reference.type.replaceAll("_", " ")}`,
      referenceType: reference.type,
      memoryId: reference.id,
      sourceShotId: reference.source_shot_id ?? null,
    });
  }

  const audioName = `${shotId}.m4a`;
  run("ffmpeg", [
    "-hide_banner",
    "-loglevel",
    "error",
    "-i",
    sourceVideo,
    "-map",
    "0:a:0",
    "-c:a",
    "aac",
    "-b:a",
    "64k",
    join(audioRoot, audioName),
    "-y",
  ]);

  const startTime = timelineTime;
  timelineTime += Number(entry.duration_seconds);
  return {
    id: shotId,
    index: shotIndex,
    sequence: entry.sequence,
    title: entry.selected_shot_directory,
    startTime: Number(startTime.toFixed(3)),
    endTime: Number(timelineTime.toFixed(3)),
    duration: Number(entry.duration_seconds),
    loadedIds: entry.memory_loaded_ids || [],
    readsMemoryFrom: "generation-request",
    visualMemory,
    writtenAudioMemory: {
      id: `${shotId}-audio-memory`,
      src: `audio/${audioName}`,
      timestamp: Number(startTime.toFixed(3)),
      duration: Number(entry.duration_seconds),
      label: `${shotId} · audio memory`,
      waveform: createWaveform(sourceVideo),
    },
  };
});

const manifest = {
  schemaVersion: 1,
  id: "echo-1.5-the-last-visa",
  title: "The Last Visa",
  source: "../source/the-last-visa.mp4",
  duration: Number(timelineTime.toFixed(3)),
  shotCount: shots.length,
  rule: "Each shot displays the exact character and scene references loaded by its generation request, plus audio from the preceding selected shot.",
  shots: shots.map((shot, shotIndex) => ({
    ...shot,
    audioMemory: shotIndex === 0 ? null : shots[shotIndex - 1].writtenAudioMemory,
  })),
};

writeFileSync(
  join(outputRoot, "manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
);

console.log(
  `Prepared ${shots.length} Last Visa shots with ${shots.reduce((total, shot) => total + shot.visualMemory.length, 0)} visual references.`,
);
