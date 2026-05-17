#!/usr/bin/env python3
"""
🔱 Poll Vercel for the deployment matching the current commit SHA.

Used by GitHub Actions after firing the deploy hook. Exits 0 on READY,
prints the deployment URL to $GITHUB_OUTPUT.

Usage:
  PROJECT_ID=... VERCEL_TOKEN=... COMMIT_SHA=... python3 poll_vercel_deploy.py
"""

from __future__ import annotations

import json
import os
import sys
import time
import urllib.request


PROJECT_ID = os.environ["PROJECT_ID"]
TOKEN = os.environ["VERCEL_TOKEN"]
SHORT_SHA = (os.environ.get("COMMIT_SHA") or "")[:10]
TIMEOUT_SEC = int(os.environ.get("TIMEOUT_SEC", "300"))
INITIAL_WAIT = int(os.environ.get("INITIAL_WAIT", "15"))
POLL_INTERVAL = int(os.environ.get("POLL_INTERVAL", "10"))


def fetch(limit: int = 8) -> list[dict]:
    url = f"https://api.vercel.com/v6/deployments?projectId={PROJECT_ID}&limit={limit}"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {TOKEN}"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read())["deployments"]


def find_match(deps: list[dict]) -> tuple[str, str, str] | None:
    """Return (state, url, kind) for the best matching deployment."""
    # First pass: exact SHA match
    if SHORT_SHA:
        for d in deps:
            sha = (d.get("meta") or {}).get("githubCommitSha", "") or ""
            if sha.startswith(SHORT_SHA):
                return (d["state"], d["url"], "sha-match")
    # Second pass: most recent hook-source deployment that's still active
    for d in deps:
        if d.get("source") == "deploy-hook" and d["state"] in (
            "READY", "BUILDING", "QUEUED", "INITIALIZING"
        ):
            return (d["state"], d["url"], "hook")
    return None


def write_output(url: str) -> None:
    out = os.environ.get("GITHUB_OUTPUT")
    if out:
        with open(out, "a") as f:
            f.write(f"url=https://{url}\n")


def main() -> int:
    print(f"Looking for deployment of sha {SHORT_SHA!r} in project {PROJECT_ID}")
    print(f"Initial wait {INITIAL_WAIT}s for Vercel hook to register…")
    time.sleep(INITIAL_WAIT)

    deadline = time.time() + TIMEOUT_SEC
    iteration = 0
    last_url = ""
    while time.time() < deadline:
        iteration += 1
        try:
            deps = fetch(limit=8)
        except Exception as e:
            print(f"[{iteration}] fetch error: {e}")
            time.sleep(POLL_INTERVAL)
            continue

        match = find_match(deps)
        if not match:
            print(f"[{iteration}] no matching deployment yet")
        else:
            state, url, kind = match
            last_url = url
            print(f"[{iteration}] state={state} kind={kind} url={url}")
            if state == "READY":
                write_output(url)
                return 0
            if state in ("ERROR", "CANCELED"):
                print(f"::error::Deploy failed with state {state}")
                return 1
        time.sleep(POLL_INTERVAL)

    # Fallback — use latest READY regardless of SHA
    try:
        deps = fetch(limit=20)
        for d in deps:
            if d["state"] == "READY":
                last_url = d["url"]
                break
    except Exception:
        pass

    if last_url:
        print(f"::warning::Timed out polling for sha {SHORT_SHA}; falling back to {last_url}")
        write_output(last_url)
        return 0
    print(f"::error::No READY deployment available after {TIMEOUT_SEC}s")
    return 1


if __name__ == "__main__":
    sys.exit(main())
