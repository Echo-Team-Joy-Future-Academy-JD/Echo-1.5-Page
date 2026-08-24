/**
 * Echo 1.5 long-case data contract.
 *
 * The bundled demo uses precomputed static manifests under public/media.
 *
 * A production integration can still replace any method by defining
 * `window.ECHO_MEMORY_PROVIDER` before script.js executes.
 */

const createMemoryCase = ({ id, title, directory, video, videoUrl, poster }) => {
  const baseUrl = new URL(`../media/${directory}/`, document.baseURI);
  return Object.freeze({
    id,
    title,
    baseUrl,
    manifestUrl: new URL("manifest.json", baseUrl),
    video: {
      mode: "continuous",
      src: videoUrl || new URL(`../media/source/${video}`, document.baseURI).href,
      poster: new URL(`../media/source/${poster}`, document.baseURI).href,
    },
  });
};

export const memoryDemoCases = Object.freeze([
  createMemoryCase({
    id: "radio",
    title: "Radio",
    directory: "radio",
    videoUrl: "https://mayanwen.bj.bcebos.com/datatransfer/echo15-page-assets-20260824/videos/radio.mp4?authorization=bce-auth-v1%2FALTAKrzbaeoF9qW4KrfkJNAAX3%2F2026-08-23T16%3A39%3A56Z%2F31536000%2Fhost%2Fa43279be88d9200f81ec132a7b27e1f32dab7c24be1759d9e800fcbddcfbec57",
    poster: "radio-poster.jpg",
  }),
  createMemoryCase({
    id: "rainbow",
    title: "Rainbow",
    directory: "rainbow",
    video: "rainbow.mp4",
    poster: "rainbow-poster.jpg",
  }),
  createMemoryCase({
    id: "task097",
    title: "Task 097",
    directory: "task097",
    video: "task097.mp4",
    poster: "task097-poster.jpg",
  }),
  createMemoryCase({
    id: "last-visa",
    title: "The Last Visa",
    directory: "last-visa",
    video: "the-last-visa.mp4",
    poster: "the-last-visa-poster.jpg",
  }),
  createMemoryCase({
    id: "august-23",
    title: "August 23",
    directory: "august-23",
    video: "august-23.mp4",
    poster: "august-23-poster.jpg",
  }),
  createMemoryCase({
    id: "ancient-times",
    title: "Back to Ancient Times",
    directory: "ancient-times",
    video: "ancient-times.mp4",
    poster: "ancient-times-poster.jpg",
  }),
]);

let activeCaseIndex = 0;
const manifestPromises = new Map();

export const getActiveMemoryDemoCase = () => memoryDemoCases[activeCaseIndex];

export const setActiveMemoryDemoCase = (caseIndex) => {
  const normalizedIndex = Number.isInteger(caseIndex)
    ? ((caseIndex % memoryDemoCases.length) + memoryDemoCases.length) % memoryDemoCases.length
    : memoryDemoCases.findIndex((memoryCase) => memoryCase.id === caseIndex);
  if (normalizedIndex < 0) return getActiveMemoryDemoCase();
  activeCaseIndex = normalizedIndex;
  return getActiveMemoryDemoCase();
};

const resolveAsset = (path, memoryCase) => (
  path ? new URL(path, memoryCase.baseUrl).href : null
);

const loadManifest = (memoryCase) => {
  if (!manifestPromises.has(memoryCase.id)) {
    manifestPromises.set(memoryCase.id, fetch(memoryCase.manifestUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Memory manifest failed: ${response.status}`);
        }
        return response.json();
      }));
  }
  return manifestPromises.get(memoryCase.id);
};

export const memoryDemoConfig = {
  shotDuration: 10,
  visualMemoryCount: 7,
  video: memoryDemoCases[0].video,
  cases: memoryDemoCases,
};

const defaultProvider = {
  async getShotIndexAtTime({ time }) {
    const memoryCase = getActiveMemoryDemoCase();
    const manifest = await loadManifest(memoryCase);
    const shots = manifest.shots || [];
    const match = shots.findIndex((shot) => time >= shot.startTime && time < shot.endTime);
    return match >= 0 ? match : Math.max(shots.length - 1, 0);
  },

  async getShot({ shotIndex, startTime, endTime }) {
    const memoryCase = getActiveMemoryDemoCase();
    const manifest = await loadManifest(memoryCase);
    return manifest.shots[shotIndex] || {
      id: `shot-${String(shotIndex + 1).padStart(2, "0")}`,
      index: shotIndex,
      startTime,
      endTime,
    };
  },

  async getVisualMemories({ targetShotIndex }) {
    const memoryCase = getActiveMemoryDemoCase();
    const manifest = await loadManifest(memoryCase);
    const shot = manifest.shots[targetShotIndex];
    if (!shot) return [];

    return (shot.visualMemory || []).map((memory) => ({
      ...memory,
      src: resolveAsset(memory.src, memoryCase),
      metadata: {
        sourceShotId: shot.readsMemoryFrom,
        precomputed: true,
      },
    }));
  },

  async getAudioMemories({ targetShotIndex }) {
    const memoryCase = getActiveMemoryDemoCase();
    const manifest = await loadManifest(memoryCase);
    const shot = manifest.shots[targetShotIndex];
    if (!shot?.audioMemory) return [];

    return [{
      ...shot.audioMemory,
      src: resolveAsset(shot.audioMemory.src, memoryCase),
      metadata: {
        sourceShotId: shot.readsMemoryFrom,
        precomputed: true,
      },
    }];
  },

  async getMemoryList({ targetShotIndex }) {
    const memoryCase = getActiveMemoryDemoCase();
    const manifest = await loadManifest(memoryCase);
    const shot = manifest.shots[targetShotIndex];
    if (!shot) return [];

    const images = (shot.visualMemory || []).map((memory) => ({
      id: memory.id,
      type: "img",
      img: {
        ...memory,
        src: resolveAsset(memory.src, memoryCase),
      },
      metadata: {
        sourceShotId: shot.readsMemoryFrom,
        isConditionImage: memory.referenceType === "scene_condition"
          || memory.memoryId === "CONDITION_IMAGE",
        precomputed: true,
      },
    }));

    const prompts = (shot.promptMemory || []).map((memory) => ({
      id: memory.id,
      type: "text",
      text: memory,
      metadata: {
        sourceShotId: shot.id,
        precomputed: true,
      },
    }));

    const audio = shot.audioMemory
      ? [{
          id: shot.audioMemory.id,
          type: "audio",
          audio: {
            ...shot.audioMemory,
            src: resolveAsset(shot.audioMemory.src, memoryCase),
          },
          metadata: {
            sourceShotId: shot.readsMemoryFrom,
            precomputed: true,
          },
        }]
      : [];

    return [...images, ...prompts, ...audio];
  },

  async onMemoriesWritten() {},
};

export function getMemoryProvider() {
  return {
    ...defaultProvider,
    ...(window.ECHO_MEMORY_PROVIDER || {}),
  };
}
