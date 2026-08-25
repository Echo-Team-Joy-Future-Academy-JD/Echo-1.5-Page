---
name: wm-case-publisher
description: Add, replace, or publish an EchoWM video case by collecting the missing case metadata from the user, uploading the MP4 to the existing Cloudflare R2/CDN path, updating the correct WM page section, validating playback/audio/waveform behavior, and committing or pushing the link-only repository change when requested. Do not use for long-video memory cases.
---

# EchoWM case publisher

Guide the user through one WM case at a time. Keep the exchange compact, but do not guess the destination section or overwrite an existing object.
Use the user's current language throughout the intake and handoff.

## Fixed project configuration

- Repository: `https://github.com/Echo-Team-Joy-Future-Academy-JD/Echo-1.5-Page.git`
- Default branch: `main`
- WM route: `/wm/`
- Cloudflare account: `JoyAI-Echo`
- Cloudflare account ID: `3f33af015e86fa3495efaed77d9c8c36`
- R2 bucket: `joyai`
- R2 root prefix: `Echo15/wm/`
- Public CDN root: `https://echovideo.jd.cn/Echo15/wm/`
- Upload helper: `npm run upload:wm-case -- ...`
- Static WM cards and hero: `wm/index.html`
- Generated Results chapters: `wm/script.js` → `chapterDefinitions`
- WM presentation only: `wm/styles.css`

The Git repository stores only the public video URL and page metadata. Never add the video binary, Cloudflare tokens, browser session data, or temporary files to Git.
The root `scripts/generate-cloudflare-video-inventory.mjs` and `scripts/upload-cloudflare-r2-videos.mjs` are bulk-migration tools; do not use them for a single new case.

## Start with the user

Inspect `git status`, the current branch, the remote, and the existing target section first. Then ask only for fields that are still missing. Prefer one concise intake message:

> 请把视频的本地绝对路径发我，并告诉我放在 WM 的哪个位置：Hero、Audio、Demos，或 Results 01/02/03/04。再给我卡片标题、标签、一句描述、插入位置；不指定位置我就追加到该板块末尾。也请说明这是新增还是替换，以及是否应该有声音。

Required inputs:

1. Local absolute MP4 path or an attached file.
2. Target section from the table below.
3. New case or replacement; for a replacement, identify the current card.
4. Display title and placement. A label, one-line description, and prompt are optional unless that section displays them.
5. Whether sound is expected. Audio and native-audio sections require an audio stream.

Derive a short lowercase kebab-case slug if the user does not provide one. Show the proposed object key, public URL, target source file, and whether the card will be appended or replaced before making changes. If the user's request already explicitly says to upload and publish/commit, proceed after this summary; otherwise ask for confirmation before the external upload.

## Section and key map

Use a new versioned slug for replacements, rather than overwriting an immutable cached URL.

| User-facing destination | Upload object key | Repository integration |
| --- | --- | --- |
| Hero background | `Echo15/wm/assets/optimized/featured/<slug>.mp4` | Replace `#hero-video source` in `wm/index.html`. |
| Audio / on-screen voice | `Echo15/wm/assets/optimized/featured/audio/<slug>.mp4` | Add or replace an `.audio-feature` in `wm/index.html`. |
| Demos / selected viewpoint | `Echo15/wm/assets/optimized/featured/viewpoint/<slug>.mp4` | Add or replace a `.demo-card` inside `#demos` in `wm/index.html`. |
| Results 01 / FPP world generalization | `Echo15/wm/assets/optimized/results/01-fpp-world-generalization/<slug>.mp4` | Add a `remoteFiles` tuple to chapter `fpp-world-generalization` in `wm/script.js`. |
| Results 02 / TPP camera-subject control | `Echo15/wm/assets/optimized/results/02-tpp-camera-subject-control/<slug>.mp4` | Add a `remoteFiles` tuple to chapter `tpp-camera-subject-control` in `wm/script.js`. |
| Results 03 / native audio-visual | `Echo15/wm/assets/optimized/results/03-native-audio-visual/<slug>.mp4` | Add a `remoteFiles` tuple to chapter `native-audio-visual` in `wm/script.js`. |
| Results 04 / multi-turn or viewpoint transition | `Echo15/wm/assets/optimized/results/04-multi-turn/<slug>.mp4` | Add a `remoteFiles` tuple to chapter `multi-turn` in `wm/script.js`. |

For a Results case, use this tuple and create `remoteFiles` in the chapter if it does not exist:

```js
remoteFiles: [
  ["case-slug", "https://echovideo.jd.cn/Echo15/wm/assets/optimized/results/02-tpp-camera-subject-control/case-slug.mp4", "Display title"]
]
```

Do not add an uploaded-only case to `localFiles`; that path assumes the MP4 also exists under `public/wm/`.

## Inspect and upload

1. Run `git fetch origin` and inspect remote divergence before editing. Do not overwrite unrelated worktree changes.
2. Check the source with `ffprobe`. Require one video stream. Require audio for `audio` and `native-audio`; otherwise tell the user before proceeding.
3. Do not transcode or alter quality unless the user asks. If the codec is unsuitable for the target browsers, report it and ask before converting.
4. Preview the exact key without mutation:

```bash
npm run upload:wm-case -- --file "/absolute/path/case.mp4" --section tpp --slug case-slug --dry-run
```

5. Confirm Cloudflare authentication with `npx wrangler@latest whoami`. If login is required, ask the user to complete `npx wrangler@latest login`; never request a token in chat. The helper targets the fixed `JoyAI-Echo` account.
6. Upload and print the public link:

```bash
npm run upload:wm-case -- --file "/absolute/path/case.mp4" --section tpp --slug case-slug
```

Accepted section values are `hero`, `audio`, `demos`, `fpp`, `tpp`, `native-audio`, and `multi-turn`. The helper refuses an existing public URL unless `--replace` is passed. Use `--replace` only after explicit overwrite approval; prefer a new versioned slug.

The helper must finish with a successful CDN `HEAD`, matching `Content-Length`, CORS, and byte-range response before its printed `PUBLIC_URL` is used in the page.

## Integrate and verify

- Use the exact `PUBLIC_URL` printed by the helper.
- Preserve the existing WM card markup and visual language. Change only the requested content and ordering.
- For static Audio or Demos cards, include `video.demo-video`, `data-src`, `muted loop playsinline preload="metadata" controls`, a `.listen-button`, and the existing metadata structure. `wm/script.js` adds the waveform canvas and cross-origin handling.
- For Results cards, update only the matching chapter definition. `remoteFiles` is rendered by the existing card generator.
- If a prompt was supplied for a Results case, discuss where it should live before adding a new prompt-file convention; remote-only cards currently omit prompt details.

Run:

```bash
npm run build
git diff --check
```

Preview `/wm/` and verify the requested placement, video loading, seeking, sound toggle, and waveform. A silent video must not be presented as an audio example.

## Commit and handoff

Show the user the final card placement and CDN URL. If the user requested commit or push, stage only the relevant page source plus intentional workflow changes, then commit with a focused message such as `Add EchoWM <slug> case`. Push only when requested.

Before committing, confirm that staged files contain no MP4, credentials, Cloudflare tokens, temporary downloads, or unrelated changes. Report the commit hash and public CDN URL on completion.
