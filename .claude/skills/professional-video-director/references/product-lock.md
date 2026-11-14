# Product & logo lock

Why: generative video re-renders every pixel; lettering and logos drift between frames.
How: `tools/product_lock/lock.py`
1. Pick a clean frame → write `mask.json` (normalised polygon around the box incl. its contact shadow edge).
2. `lock.py preview ORIG --mask mask.json --out mask.png` → look at it.
3. `lock.py check ORIG GEN --mask mask.json` → drift score of the AI output (structure SSIM; colour reported apart).
4. `lock.py composite ORIG GEN --mask mask.json --out LOCKED --match 0.6 --feather 25`
   – original product pixels, feathered edge, colour pulled toward the new scene's light (`--match` 0 = none, 1 = full).
5. `check ORIG LOCKED` → must be **OK**. Then eyeball the edge: shadow/contact with the new table.

Shooting rules that make this work: tripod, no camera move (or slow move → keyframed mask), nobody's hand crosses
in front of the box during the shot (hands may touch it from the side/back), box fully visible, logo facing camera,
soft even light without hard coloured spill, 30 fps, 9:16, 6–10 s.
Limits: occlusions need a segmented mask (SAM-type model; not installed – CPU only box).
Keep the original table in the AI prompt ("keep the same table and the box exactly") so contact shadows agree.
