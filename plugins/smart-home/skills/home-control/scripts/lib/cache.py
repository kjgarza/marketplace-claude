"""Device cache with TTL-based invalidation."""

import json
import os
import time

CACHE_DIR = os.path.expanduser("~/.cache/home-control")
CACHE_FILE = os.path.join(CACHE_DIR, "devices.json")
DEFAULT_TTL = 1800  # 30 minutes


def _ensure_dir():
    os.makedirs(CACHE_DIR, exist_ok=True)


def read(ttl=DEFAULT_TTL):
    """Read cached devices. Returns None if cache is missing or stale."""
    try:
        with open(CACHE_FILE) as f:
            data = json.load(f)
        if time.time() - data.get("timestamp", 0) > ttl:
            return None
        return data.get("devices", [])
    except (FileNotFoundError, json.JSONDecodeError, KeyError):
        return None


def write(devices):
    """Write device list to cache."""
    _ensure_dir()
    data = {"timestamp": time.time(), "devices": devices}
    with open(CACHE_FILE, "w") as f:
        json.dump(data, f, indent=2)


def invalidate():
    """Delete the cache file."""
    try:
        os.remove(CACHE_FILE)
    except FileNotFoundError:
        pass
