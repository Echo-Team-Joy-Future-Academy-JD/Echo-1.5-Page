# Cloudflare video migration inventory

For an interactive, single-case EchoWM publishing workflow, use [the repository `wm-case-publisher` skill](../.agents/skills/wm-case-publisher/SKILL.md). It uploads only the requested MP4, returns the CDN URL, and routes the corresponding WM page edit.

Generated from the current site source and local media tree. Query strings are intentionally removed from BOS URLs so signed credentials are not copied into the inventory.

## Migration set

| Set | Objects | Known bytes | Purpose |
| --- | ---: | ---: | --- |
| Required by current pages | 97 | 1.40 GB | Upload or proxy these first. |
| Local extras, not currently referenced | 40 | 164 MB | Optional archive; not required for launch. |
| Full inventory | 137 | 1.57 GB | Every local or explicit remote video found. |

The local tree contains 130 MP4 files but only 119 unique SHA-256 payloads (11 duplicate copies). The exact object-level list is in [cloudflare-video-assets.csv](./cloudflare-video-assets.csv).

## Cloudflare layout

- Required objects are stored in the `joyai` R2 bucket using the CSV `target_r2_key` values.
- Public video delivery reuses the Echo 1.0 accelerated hostname: `https://echovideo.jd.cn/Echo15/`.
- Keep video responses cacheable and support byte ranges (`Range`, `206 Partial Content`).
- Return `Content-Type: video/mp4`, `Access-Control-Allow-Origin` for the site origins, and expose `Accept-Ranges`, `Content-Length`, `Content-Range`, and `ETag`.
- Replace the BOS base URL and long-video local video paths with one configurable media base URL.
- Do not copy the existing one-year signed BOS query string; use the Cloudflare hostname instead.

## DNS routing

The existing `echovideo.jd.cn` route is reused. Its DNS resolves through `cloudscdn.net`, and byte-range requests for the new `Echo15/` objects are served through Cloudflare.

## Verification after upload

1. Compare uploaded object count and byte totals with the required rows in the CSV.
2. Verify a sample from each page with `HEAD` and a byte-range request.
3. Confirm CORS using both the production GitHub Pages origin and the development origin.
4. Switch the site media base URL, build, and test seeking, sound, and WM waveform analysis.
