# JoyAI-Echo-1.5 Project Page

Static project page for the long-video variant of JoyAI-Echo-1.5, designed for
direct deployment to GitHub Pages. The page focuses exclusively on
long-horizon audio-visual generation.

## Local preview

```bash
npm install
npm run dev
```

The development server is protected by a password prompt. Its default password
is `echo15`; set `ECHO15_DEV_PASSWORD` before starting Vite to override it.
The password gate runs only in development and is not included in `dist/`.

## Production build

```bash
npm run build
```

The deployable static site is written to `dist/`. Asset paths are relative, so
the same build works on both user/organization Pages and repository Pages.

## GitHub Pages

The workflow in `.github/workflows/deploy-pages.yml` builds and deploys the site
whenever `main` is pushed. In the repository settings, set **Pages → Build and
deployment → Source** to **GitHub Actions**.

## Bundled long-case memory data

The homepage uses the downloaded “blue beard” case from Echo 1.0. The source
video is divided into 29 fixed ten-second shots (the final shot is 9.221
seconds). For every shot, the preparation script extracts:

- seven evenly spaced visual-memory frames;
- one AAC audio-memory clip;
- a 180-point waveform preview;
- a standalone shot clip.

Shot 01 has no historical memory. Shot 02 reads the seven frames and audio
written by Shot 01, Shot 03 reads Shot 02, and so on. The relationship is
recorded in `public/media/blue-beard/manifest.json`.

To rebuild all derived assets from the downloaded source:

```bash
npm run prepare:memory-case
```

The generator is `scripts/prepare-memory-case.mjs`.

## Replacing the memory data

The visualization remains decoupled from its data source. Configure the video
and static manifest provider in `memory-demo-data.js`.

For production, define `window.ECHO_MEMORY_PROVIDER` before `script.js` runs.
The provider can implement:

- `getShot(context)` for real shot boundaries and metadata.
- `getMemoryList(context)` for the image/audio memory list read by that shot.
- `onMemoriesWritten(context)` to persist memories captured from a shot.

`getMemoryList()` may return any number of image and audio entries:

```js
[
  {
    id: "memory-image-01",
    type: "img",
    img: { src: "./memory-01.jpg", timestamp: 12.4 },
  },
  {
    id: "memory-audio-01",
    type: "audio",
    audio: {
      src: "./memory-01.m4a",
      waveform: [0.02, 0.18, 0.31],
    },
  },
]
```

The page dispatches an `echo:shot-change` browser event whenever playback
enters a new shot and `echo:memory-list-loaded` after its list is mounted. The
bundled provider converts the precomputed visual and audio memories belonging
to the preceding shot into this list.
