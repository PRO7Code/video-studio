#!/usr/bin/env python3
"""Higgsfield API client for the studio, with mandatory cost gates. Stdlib only.

Auth: HF_API_KEY_ID + HF_API_KEY_SECRET in the environment, OR (cloud sessions) a network secret
saved for api.higgsfield.ai, which the proxy injects -- then the client sends a placeholder that the
proxy replaces. Keys are never written to disk or printed.

Spending rules (enforced here, not just by prompt):
  * every paid call is preceded by POST /estimate/<endpoint>; if the estimate fails, nothing is sent
  * `submit` refuses unless --approve-usd >= estimate (the human-approved budget for THIS request)
  * every submit is appended to ledger.jsonl next to the project (estimate, request id, status)
  * uploads of local media need --approved-upload (private footage leaves the machine)

Usage:
  hf.py estimate kling-video/o3/video-edit body.json
  hf.py upload media/test.mp4 --approved-upload            -> prints public_url
  hf.py submit kling-video/o3/video-edit body.json --approve-usd 1.20 --ledger projects/x/ledger.jsonl
  hf.py wait <request_id> --out projects/x/gen/bar.mp4
  hf.py status <request_id> | cancel <request_id> | delete <request_id>
  add --dry-run to any command to print the request without sending it.
"""
import argparse, json, os, sys, time, uuid, urllib.request, urllib.error, mimetypes, datetime, ssl

BASE = os.environ.get("HF_API_BASE", "https://api.higgsfield.ai")
DRY = False


def _ctx():
    ca = os.environ.get("SSL_CERT_FILE") or os.environ.get("REQUESTS_CA_BUNDLE")
    if not ca and os.path.exists("/root/.ccr/ca-bundle.crt"):
        ca = "/root/.ccr/ca-bundle.crt"
    return ssl.create_default_context(cafile=ca) if ca else ssl.create_default_context()


def _auth():
    kid, sec = os.environ.get("HF_API_KEY_ID"), os.environ.get("HF_API_KEY_SECRET")
    if kid and sec:
        return f"Key {kid}:{sec}"
    return "Key proxy-injected:placeholder"  # replaced by the cloud proxy's saved network secret


def call(method, path, body=None, extra=None):
    url = path if path.startswith("http") else BASE + path
    headers = {"Content-Type": "application/json", "Accept": "application/json", "Authorization": _auth()}
    headers.update(extra or {})
    if DRY:
        shown = {k: ("<redacted>" if k == "Authorization" else v) for k, v in headers.items()}
        print(json.dumps({"DRY_RUN": True, "method": method, "url": url, "headers": shown, "body": body}, ensure_ascii=False, indent=2))
        return {}
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, context=_ctx(), timeout=120) as r:
            raw = r.read()
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        msg = e.read().decode("utf-8", "replace")[:800]
        sys.exit(f"HTTP {e.code} on {method} {path}: {msg}")


def estimate(endpoint, body):
    r = call("POST", f"/estimate/{endpoint}", body)
    if DRY:
        return None
    usd = r.get("usd")
    if usd is None:
        sys.exit(f"estimate returned no 'usd' field ({r}); refusing to continue")
    return float(usd)


def ledger_write(path, rec):
    if not path:
        return
    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
    rec["ts"] = datetime.datetime.utcnow().isoformat() + "Z"
    with open(path, "a", encoding="utf-8") as f:
        f.write(json.dumps(rec, ensure_ascii=False) + "\n")


def upload(path, approved):
    if not approved:
        sys.exit("refusing: uploading private media needs --approved-upload (explicit human approval)")
    ctype = mimetypes.guess_type(path)[0] or "application/octet-stream"
    if ctype not in {"image/jpeg", "image/png", "image/webp", "image/gif", "audio/wav", "audio/x-wav", "video/mp4"}:
        sys.exit(f"unsupported content type {ctype}; convert to mp4/png/jpg/wav first")
    r = call("POST", "/files/generate-upload-url", {"content_type": ctype})
    if DRY:
        return "<public_url>"
    with open(path, "rb") as f:
        data = f.read()
    # never send Higgsfield credentials to the presigned storage URL
    req = urllib.request.Request(r["upload_url"], data=data, method="PUT", headers=dict(r.get("upload_headers", {})))
    with urllib.request.urlopen(req, context=_ctx(), timeout=600) as resp:
        if resp.status >= 300:
            sys.exit(f"upload failed: HTTP {resp.status}")
    return r["public_url"]


def main():
    global DRY
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--dry-run", action="store_true")
    sub = ap.add_subparsers(dest="cmd", required=True)
    e = sub.add_parser("estimate"); e.add_argument("endpoint"); e.add_argument("body")
    u = sub.add_parser("upload"); u.add_argument("file"); u.add_argument("--approved-upload", action="store_true")
    s = sub.add_parser("submit"); s.add_argument("endpoint"); s.add_argument("body")
    s.add_argument("--approve-usd", type=float, required=True, help="human-approved max spend for this request")
    s.add_argument("--ledger", default=None); s.add_argument("--expires-after", default="168h")
    for n in ("status", "cancel", "delete"):
        x = sub.add_parser(n); x.add_argument("request_id")
    w = sub.add_parser("wait"); w.add_argument("request_id"); w.add_argument("--out", required=True)
    w.add_argument("--timeout", type=int, default=1800); w.add_argument("--ledger", default=None)
    a = ap.parse_args()
    DRY = a.dry_run

    if a.cmd == "estimate":
        usd = estimate(a.endpoint, json.load(open(a.body)))
        if usd is not None:
            print(json.dumps({"endpoint": a.endpoint, "usd": usd}))
    elif a.cmd == "upload":
        print(upload(a.file, a.approved_upload))
    elif a.cmd == "submit":
        body = json.load(open(a.body))
        usd = estimate(a.endpoint, body)
        if not DRY and usd > a.approve_usd + 1e-9:
            sys.exit(f"refusing: estimate ${usd:.3f} exceeds approved ${a.approve_usd:.3f}")
        r = call("POST", f"/{a.endpoint}", body, {"Idempotency-Key": str(uuid.uuid4()), "Hf-Expires-After": a.expires_after})
        ledger_write(a.ledger, {"event": "submit", "endpoint": a.endpoint, "estimate_usd": usd, "approved_usd": a.approve_usd,
                                "request_id": r.get("request_id"), "body": body})
        print(json.dumps(r, indent=2))
    elif a.cmd == "status":
        print(json.dumps(call("GET", f"/requests/{a.request_id}/status"), indent=2))
    elif a.cmd == "cancel":
        print(json.dumps(call("POST", f"/requests/{a.request_id}/cancel"), indent=2))
    elif a.cmd == "delete":
        print(json.dumps(call("DELETE", f"/requests/{a.request_id}"), indent=2))
    elif a.cmd == "wait":
        t0 = time.time()
        while True:
            r = call("GET", f"/requests/{a.request_id}/status")
            if DRY:
                return
            st = r.get("status")
            print(f"[{int(time.time() - t0)}s] {st}", flush=True)
            if st in ("completed", "failed", "nsfw", "canceled"):
                break
            if time.time() - t0 > a.timeout:
                sys.exit("timeout waiting; request still running (check later with status)")
            time.sleep(5)
        ledger_write(a.ledger, {"event": "finished", "request_id": a.request_id, "status": st, "error": r.get("error")})
        if st != "completed":
            sys.exit(f"request ended as {st}: {r.get('error')}")
        url = (r.get("video") or {}).get("url") or (r.get("images") or [{}])[0].get("url")
        os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
        urllib.request.urlretrieve(url, a.out)  # result files expire after the retention window
        print(f"saved {a.out}")


if __name__ == "__main__":
    main()
