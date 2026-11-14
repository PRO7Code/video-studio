# Higgsfield in this studio (verified 2026-11-14 from official docs)

## Which integration
| Path | Auth | Billing | Fit for cloud Claude Code |
|---|---|---|---|
| **API** `https://api.higgsfield.ai` | header `Authorization: Key <id>:<secret>` | USD prepaid balance, $5 min top-up, separate from web plans | **Best**: headless, scriptable, `/estimate` endpoint. Key stored as a network secret for `api.higgsfield.ai` (prefix `Key`) so it never enters the chat |
| MCP `https://mcp.higgsfield.ai/mcp` | browser sign-in | web plan credits (paid plan required), no credit cap | Good for interactive exploration if added as a claude.ai custom connector; sign-in can't be completed from inside the container |
| CLI `@higgsfield/cli` + skills | browser login, short-lived token | web plan credits | Officially recommended for *local* Claude Code; headless login undocumented → not for cloud |

## Edit endpoints that keep the original video (people, motion, product)
| Endpoint | Input video | References | Output | Notes |
|---|---|---|---|---|
| `kling-video/o3/video-edit` | 3–15.5 s, ≤200 MB, public URL | `image_urls` 0–4, `elements` 0–4 | duration = source; mode std/pro/4k | **First choice for the product**: up to 4 product reference images |
| `kling-video/omni/video-edit` | 3–10 s | same | std/pro | cheaper fallback |
| `bytedance/seedance-2.5/video-edit` | source + up to 9 ref videos, ≤30 s budget | `image_urls` up to 30, audio refs | framing follows source; 480/720/1080p; `generate_audio` default true → set false | strong scene consistency |
| `higgsfield/genjutsu/object-swap/v1.0` | ≥4 s, ≥409,600 px/frame | `image_urls` 1–8 | 480/720/1080p | swaps objects; not for environment |
| `higgsfield/genjutsu/restyle/v1.0` | 4–30 s | presets only | keeps source audio | $0.318 / $0.681 / $1.632 per s (480/720/1080p); "does not guarantee exact preservation" |

None documents an `aspect_ratio` field: output framing follows the source, so **shoot vertical 9:16**.
None guarantees logo fidelity → always run the product lock.

## Prices
Per-endpoint edit prices are NOT published. Catalogue "from" rates (per second, change often): Kling O3 $0.068,
Kling Omni $0.063, Seedance 2.5 ~$0.118 (ref/edit $0.139 at 480p), Kling 4.0 $0.126. **Always** `hf.py estimate`
the exact body; that number is authoritative. Failed/nsfw requests are not charged. Results are deleted after 7 days
(download immediately).

## Flow
1. Local file → `hf.py upload FILE --approved-upload` → public_url (presigned upload, 1 h)
2. Body JSON → `hf.py estimate ENDPOINT body.json` → show cost → user approves amount
3. `hf.py submit ENDPOINT body.json --approve-usd X --ledger projects/<p>/ledger.jsonl` → request_id
4. `hf.py wait ID --out projects/<p>/gen/<look>.mp4`
5. `lock.py check/composite/check` → review

## Image-to-video path (product photos → ad) — verified 2026-11-14
Use when there is no footage: the AI makes scenes, the product stays real.

**Stage A – scene stills (9:16):**
| Endpoint | Refs | 9:16 | Res | Use |
|---|---|---|---|---|
| `marketing-studio/image` | `image_urls` ≤16 | ✔ | 1k/2k/4k | **first choice** for scene + people with the box as reference |
| `xai/grok-imagine-image-2.0` | `image_urls` ≤10 | ✔ | 1k/2k | alternative, strong edits |
| `alibaba/qwen-image-3/edit` | 1–3, `negative_prompt` | ✔ | 1k/2k | relight/harmonise a composite |
| `higgsfield/ads-studio/v1.0` | ≤10, batch 1–8 | ✔ | 2k fixed | ad concepts; "exact preservation of a product, label or text is not guaranteed" (~$0.084/img illustrative) |
| `ideogram/v4.0` | 1 | ✔ | — | text-heavy graphics |
Then `tools/product_lock/place.py` pastes the REAL box cut-out into the still (+ contact shadow, light match) and
writes the exact `mask.json`.

**Stage B – motion:**
| Endpoint | Frames / refs | Dur | 9:16 | Notes |
|---|---|---|---|---|
| `kling-video/o3/image-reference` | `first_frame_url`, `last_frame_url`, `image_urls`, `elements` | 3–15 s | ✔ | **first choice**: locked keyframe as first frame + box photos as refs; `sound` off |
| `kling-video/o3/first-last-frame` | first (+last) | 3–15 s | ✔ | AI transition between two environments (last frame of A → first of B) |
| `kling-video/v3.0/pro/image-to-video` | `image_url`, `last_image_url`, `elements` | 3–15 s | no field (follows image?) | multi-shot up to 6 |
| `bytedance/seedance-2.5/reference-to-video` | `image_urls` 1–30 | 4–30 s | ✔ | 480/720/1080p; set `generate_audio` false |
| `bytedance/seedance-2.0/reference-to-video` | `image_urls` 1–9 | 4–15 s | ✔ | up to 4k |
| `alibaba/wan-3.0/reference-to-video` | `image_urls` ≤10 | 2–30 s | ✔ | cheapest family |
Not in the docs: Kling 4.0/O1 endpoints, Nano Banana, Seedream, element creation API (elements are referenced by ID only).

**Stage C – lock:** camera move gentle, box static → `lock.py composite KEYFRAME-VIDEO GEN --mask mask.json`
(the source is a still-image video made from the keyframe; keyframe the mask if the camera pushes in).

Prices per endpoint are not published; catalogue "from" rates: Kling O3 $0.068/s, Kling 3.0 $0.071/s,
Seedance 2.5 $0.118/s, Wan 3.0 $0.038/s, Marketing Studio image $0.013–0.016, Grok/Qwen image $0.04.
`/estimate` is documented with a Soul example only → verify it on each endpoint with the live key before relying on it.
