/**
 * Echo 1.5 long-case data contract.
 *
 * The bundled demo uses a precomputed static manifest:
 *   public/media/blue-beard/manifest.json
 *
 * A production integration can still replace any method by defining
 * `window.ECHO_MEMORY_PROVIDER` before script.js executes.
 */

const caseBaseUrl = new URL("./media/blue-beard/", document.baseURI);
const manifestUrl = new URL("manifest.json", caseBaseUrl);
let manifestPromise;

const resolveAsset = (path) => (
  path ? new URL(path, caseBaseUrl).href : null
);

const loadManifest = () => {
  if (!manifestPromise) {
    manifestPromise = fetch(manifestUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Memory manifest failed: ${response.status}`);
        }
        return response.json();
      });
  }
  return manifestPromise;
};

export const memoryDemoConfig = {
  shotDuration: 10,
  visualMemoryCount: 7,
  video: {
    mode: "continuous",
    src: new URL("./media/source/the-last-visa.mp4", document.baseURI).href,
    poster: new URL(
      "./media/source/the-last-visa-poster.jpg",
      document.baseURI,
    ).href,
  },
};

const defaultProvider = {
  async getShot({ shotIndex, startTime, endTime }) {
    const manifest = await loadManifest();
    return manifest.shots[shotIndex] || {
      id: `shot-${String(shotIndex + 1).padStart(2, "0")}`,
      index: shotIndex,
      startTime,
      endTime,
    };
  },

  async getVisualMemories({ targetShotIndex }) {
    const manifest = await loadManifest();
    const shot = manifest.shots[targetShotIndex];
    if (!shot) return [];

    return shot.visualMemory.map((memory) => ({
      ...memory,
      src: resolveAsset(memory.src),
      metadata: {
        sourceShotId: shot.readsMemoryFrom,
        precomputed: true,
      },
    }));
  },

  async getAudioMemories({ targetShotIndex }) {
    const manifest = await loadManifest();
    const shot = manifest.shots[targetShotIndex];
    if (!shot?.audioMemory) return [];

    return [{
      ...shot.audioMemory,
      src: resolveAsset(shot.audioMemory.src),
      metadata: {
        sourceShotId: shot.readsMemoryFrom,
        precomputed: true,
      },
    }];
  },

  async getMemoryList({ targetShotIndex }) {
    const manifest = await loadManifest();
    const shot = manifest.shots[targetShotIndex];
    if (!shot) return [];

    const images = (shot.visualMemory || []).map((memory) => ({
      id: memory.id,
      type: "img",
      img: {
        ...memory,
        src: resolveAsset(memory.src),
      },
      metadata: {
        sourceShotId: shot.readsMemoryFrom,
        precomputed: true,
      },
    }));

    const audio = shot.audioMemory
      ? [{
          id: shot.audioMemory.id,
          type: "audio",
          audio: {
            ...shot.audioMemory,
            src: resolveAsset(shot.audioMemory.src),
          },
          metadata: {
            sourceShotId: shot.readsMemoryFrom,
            precomputed: true,
          },
        }]
      : [];

    return [...images, ...audio];
  },

  async onMemoriesWritten() {},
};

export function getMemoryProvider() {
  return {
    ...defaultProvider,
    ...(window.ECHO_MEMORY_PROVIDER || {}),
  };
}
