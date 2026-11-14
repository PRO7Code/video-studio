#!/usr/bin/env python3
"""Place the REAL product photo into an AI-generated scene still (image-to-video keyframe).

The AI makes the environment, table and people; the box and logo come from the actual product photo, so the
first frame of every video is pixel-true. Also writes mask.json (exact product polygon) for lock.py later.

  place.py PLATE.png PRODUCT.png --out keyframe.png --mask-out mask.json \
           --cx 0.5 --base 0.66 --width 0.42 [--rotate 0] [--shadow 0.55] [--match 0.5]

PRODUCT.png must have transparency (cut-out). --cx = horizontal centre, --base = y of the box's bottom edge (where it
touches the table), --width = box width; all as fractions of the plate. --match pulls the box toward the plate's light.
"""
import argparse, json, subprocess, sys
import numpy as np


def load_rgba(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height",
                          "-of", "csv=p=0", path], capture_output=True, text=True).stdout.strip().split(",")
    w, h = int(out[0]), int(out[1])
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-f", "rawvideo", "-pix_fmt", "rgba", "-"], capture_output=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(h, w, 4).astype(np.float32)


def resize(img, w, h, rotate=0.0):
    p = subprocess.run(["ffmpeg", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", f"{img.shape[1]}x{img.shape[0]}", "-i", "-",
                        "-vf", f"scale={w}:{h}:flags=lanczos" + (f",rotate={rotate}*PI/180:c=none:ow=rotw({rotate}*PI/180):oh=roth({rotate}*PI/180)" if rotate else ""),
                        "-f", "rawvideo", "-pix_fmt", "rgba", "-"], input=img.astype(np.uint8).tobytes(), capture_output=True)
    n = len(p.stdout) // 4
    if rotate:
        import math
        r = math.radians(rotate); W = int(abs(w * math.cos(r)) + abs(h * math.sin(r))); H = n // W
        return np.frombuffer(p.stdout, np.uint8).reshape(H, W, 4).astype(np.float32)
    return np.frombuffer(p.stdout, np.uint8).reshape(h, w, 4).astype(np.float32)


def blur(m, r):
    k = np.ones(max(1, r)) / max(1, r)
    m = np.apply_along_axis(lambda v: np.convolve(v, k, "same"), 1, m)
    return np.apply_along_axis(lambda v: np.convolve(v, k, "same"), 0, m)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("plate"); ap.add_argument("product"); ap.add_argument("--out", required=True); ap.add_argument("--mask-out", required=True)
    ap.add_argument("--cx", type=float, default=0.5); ap.add_argument("--base", type=float, default=0.66); ap.add_argument("--width", type=float, default=0.42)
    ap.add_argument("--rotate", type=float, default=0.0); ap.add_argument("--shadow", type=float, default=0.55); ap.add_argument("--match", type=float, default=0.5)
    a = ap.parse_args()
    plate = load_rgba(a.plate)[..., :3]; H, W = plate.shape[:2]
    prod = load_rgba(a.product)
    if prod[..., 3].min() > 250:
        sys.exit("product image has no transparency: supply a cut-out PNG (alpha) of the box")
    pw = int(a.width * W); ph = int(prod.shape[0] * pw / prod.shape[1])
    prod = resize(prod, pw, ph, a.rotate); ph, pw = prod.shape[:2]
    x0 = int(a.cx * W - pw / 2); y0 = int(a.base * H - ph)
    if x0 < 0 or y0 < 0 or x0 + pw > W or y0 + ph > H:
        sys.exit("product falls outside the plate; adjust --cx/--base/--width")
    alpha = prod[..., 3:4] / 255.0
    rgb = prod[..., :3]
    # light match: pull the product's mean toward the plate region it sits in
    if a.match > 0:
        region = plate[max(0, y0 - ph // 2):y0 + ph, max(0, x0 - pw // 2):x0 + pw + pw // 2].reshape(-1, 3)
        pm = (rgb * alpha).reshape(-1, 3).sum(0) / max(1, alpha.sum())
        gain = 1 + a.match * (region.mean(0) / np.maximum(pm, 1) - 1) * 0.35
        rgb = np.clip(rgb * gain, 0, 255)
    out = plate.copy()
    # soft contact shadow: squashed, blurred alpha under the box base
    if a.shadow > 0:
        sh = np.zeros((H, W), np.float32)
        sy = int(ph * 0.12)
        foot = blur(alpha[..., 0][-max(4, ph // 10):, :], 3).max(0)
        for i in range(sy):
            yy = y0 + ph - sy // 2 + i
            if 0 <= yy < H:
                sh[yy, x0:x0 + pw] = np.maximum(sh[yy, x0:x0 + pw], foot * (1 - abs(i - sy / 2) / (sy / 2 + 1)))
        sh = blur(sh, max(3, pw // 12)) * a.shadow
        out *= (1 - sh[..., None] * 0.85)
    out[y0:y0 + ph, x0:x0 + pw] = out[y0:y0 + ph, x0:x0 + pw] * (1 - alpha) + rgb * alpha
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-i", "-", a.out], stdin=subprocess.PIPE)
    p.communicate(np.clip(out, 0, 255).astype(np.uint8).tobytes())
    # exact polygon (bounding quad of opaque pixels) for lock.py
    ys, xs = np.where(alpha[..., 0] > 0.5)
    poly = [[(x0 + xs.min()) / W, (y0 + ys.min()) / H], [(x0 + xs.max()) / W, (y0 + ys.min()) / H],
            [(x0 + xs.max()) / W, (y0 + ys.max()) / H], [(x0 + xs.min()) / W, (y0 + ys.max()) / H]]
    json.dump({"polygon": poly, "source": a.product}, open(a.mask_out, "w"), indent=1)
    print(f"saved {a.out} and {a.mask_out}")


if __name__ == "__main__":
    main()
