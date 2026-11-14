# Runbook – Rimadi qatayef test (each 💲 step needs the client's approval first)

0. `bash scripts/doctor.sh` – everything green except the Higgsfield key until it is saved.
1. Put assets in `assets/` (see assets-guide.md). Make the cut-out if needed.
2. 💲 Upload refs (approval to upload): `python tools/higgsfield/hf.py upload assets/box_34.jpg --approved-upload` → public_url into bodies/*.json
3. 💲 Stills: `hf.py estimate marketing-studio/image bodies/still_bar.json` → show → approve →
   `hf.py submit marketing-studio/image bodies/still_bar.json --approve-usd <X> --ledger projects/restaurants/rimadi-lounge/qatayef-winter/ledger.jsonl`
   → `hf.py wait <id> --out projects/restaurants/rimadi-lounge/qatayef-winter/gen/still_bar.png` (×3 looks, pick best variant with the client)
4. Place the real box: `.venv/bin/python -I tools/product_lock/place.py gen/still_bar.png assets/box_front.png --out keyframes/bar.png --mask-out keyframes/bar.mask.json --cx 0.5 --base 0.68 --width 0.4`
   (look at it; adjust position/size; optional Qwen relight pass then re-place)
5. 💲 Motion: upload keyframe → estimate → approve → submit `kling-video/o3/image-reference` bodies/motion_bar.json → wait → gen/bar.mp4
6. Lock: make a still-video of the keyframe (`ffmpeg -loop 1 -i keyframes/bar.png -t 3 -r 30 -pix_fmt yuv420p keyframes/bar.mp4`),
   `lock.py check keyframes/bar.mp4 gen/bar.mp4 --mask keyframes/bar.mask.json` → `composite ... --out locked/bar.mp4` → check = OK.
7. Copy locked clips to `core/remotion/public/projects/rimadi/locked/` → `npx remotion render RimadiLookTest out/rimadi-test-v1.mp4`
   and `RimadiLookCompare` for the review grid.
8. Review with the client. Only then plan the full ad (copy, music, SFX, end card with logo).
