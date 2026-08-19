import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const sourcePath = resolve(
  projectRoot,
  process.argv[2] || "public/media/source/blue-beard-long.mp4",
);
const outputRoot = resolve(
  projectRoot,
  process.argv[3] || "public/media/blue-beard",
);
const shotDuration = 10;
const memoryCount = 7;

if (!existsSync(sourcePath)) {
  throw new Error(`Source video not found: ${sourcePath}`);
}

const run = (program, args, options = {}) =>
  execFileSync(program, args, {
    cwd: projectRoot,
    stdio: options.capture ? ["ignore", "pipe", "inherit"] : "inherit",
    maxBuffer: 32 * 1024 * 1024,
  });

const probe = JSON.parse(
  run(
    "ffprobe",
    [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "json",
      sourcePath,
    ],
    { capture: true },
  ).toString(),
);

const duration = Number(probe.format.duration);
const shotCount = Math.ceil(duration / shotDuration);
const shotsDirectory = join(outputRoot, "shots");
const visualDirectory = join(outputRoot, "visual");
const audioDirectory = join(outputRoot, "audio");

rmSync(outputRoot, { recursive: true, force: true });
[shotsDirectory, visualDirectory, audioDirectory].forEach((directory) => {
  mkdirSync(directory, { recursive: true });
});

run("ffmpeg", [
  "-hide_banner",
  "-loglevel",
  "warning",
  "-i",
  sourcePath,
  "-map",
  "0:v:0",
  "-map",
  "0:a:0?",
  "-c:v",
  "libx264",
  "-preset",
  "veryfast",
  "-crf",
  "24",
  "-force_key_frames",
  `expr:gte(t,n_forced*${shotDuration})`,
  "-c:a",
  "aac",
  "-b:a",
  "96k",
  "-f",
  "segment",
  "-segment_time",
  String(shotDuration),
  "-reset_timestamps",
  "1",
  "-segment_format_options",
  "movflags=+faststart",
  join(shotsDirectory, "segment-%02d.mp4"),
  "-y",
]);

const createWaveform = (startTime, segmentLength) => {
  const raw = run(
    "ffmpeg",
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-ss",
      String(startTime),
      "-t",
      String(segmentLength),
      "-i",
      sourcePath,
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

const manifestShots = [];

for (let shotIndex = 0; shotIndex < shotCount; shotIndex += 1) {
  const shotNumber = shotIndex + 1;
  const shotId = `shot-${String(shotNumber).padStart(2, "0")}`;
  const startTime = shotIndex * shotDuration;
  const endTime = Math.min(duration, startTime + shotDuration);
  const segmentLength = endTime - startTime;
  const shotVisualDirectory = join(visualDirectory, shotId);
  mkdirSync(shotVisualDirectory, { recursive: true });

  run("ffmpeg", [
    "-hide_banner",
    "-loglevel",
    "error",
    "-ss",
    String(startTime),
    "-t",
    String(segmentLength),
    "-i",
    sourcePath,
    "-vf",
    `fps=${memoryCount}/${segmentLength},scale=480:-2`,
    "-frames:v",
    String(memoryCount),
    "-q:v",
    "4",
    join(shotVisualDirectory, "frame-%02d.jpg"),
    "-y",
  ]);

  const temporaryAudioPath = join(audioDirectory, `${shotId}.m4a`);
  run("ffmpeg", [
    "-hide_banner",
    "-loglevel",
    "error",
    "-ss",
    String(startTime),
    "-t",
    String(segmentLength),
    "-i",
    sourcePath,
    "-map",
    "0:a:0",
    "-c:a",
    "aac",
    "-b:a",
    "64k",
    temporaryAudioPath,
    "-y",
  ]);

  const shotClipFromFfmpeg = join(
    shotsDirectory,
    `segment-${String(shotIndex).padStart(2, "0")}.mp4`,
  );
  const shotClipPath = join(shotsDirectory, `${shotId}.mp4`);
  renameSync(shotClipFromFfmpeg, shotClipPath);

  manifestShots.push({
    id: shotId,
    index: shotIndex,
    startTime: Number(startTime.toFixed(3)),
    endTime: Number(endTime.toFixed(3)),
    duration: Number(segmentLength.toFixed(3)),
    src: `shots/${shotId}.mp4`,
    writtenMemory: {
      visual: Array.from({ length: memoryCount }, (_, frameIndex) => ({
        id: `${shotId}-memory-${String(frameIndex + 1).padStart(2, "0")}`,
        src: `visual/${shotId}/frame-${String(frameIndex + 1).padStart(2, "0")}.jpg`,
        timestamp: Number(
          (
            startTime
            + ((frameIndex + 0.5) / memoryCount) * segmentLength
          ).toFixed(3),
        ),
        label: `${shotId} / visual memory ${frameIndex + 1}`,
      })),
      audio: {
        id: `${shotId}-audio-memory`,
        src: `audio/${shotId}.m4a`,
        timestamp: Number(startTime.toFixed(3)),
        duration: Number(segmentLength.toFixed(3)),
        label: `${shotId} / audio memory`,
        waveform: createWaveform(startTime, segmentLength),
      },
    },
  });
}

const manifest = {
  schemaVersion: 1,
  id: "echo-1.5-blue-beard-long-case",
  title: "Blue Beard Long Case",
  source: "../source/blue-beard-long.mp4",
  duration: Number(duration.toFixed(3)),
  shotDuration,
  memoryCount,
  rule: "Shot N reads seven visual frames and one audio memory from Shot N-1.",
  shots: manifestShots.map((shot, shotIndex) => ({
    ...shot,
    readsMemoryFrom: shotIndex === 0 ? null : manifestShots[shotIndex - 1].id,
    visualMemory: shotIndex === 0
      ? []
      : manifestShots[shotIndex - 1].writtenMemory.visual,
    audioMemory: shotIndex === 0
      ? null
      : manifestShots[shotIndex - 1].writtenMemory.audio,
  })),
};

writeFileSync(
  join(outputRoot, "manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
);

console.log(
  `Prepared ${shotCount} shots, ${shotCount * memoryCount} frames, and ${shotCount} audio memories in ${outputRoot}`,
);
