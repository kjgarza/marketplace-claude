"""Unified device discovery: Yeelight (TCP probe) + Google Cast (mDNS)."""

import concurrent.futures
import ipaddress
import socket
import struct

from . import cache, cast, yeelight


def _get_local_subnet():
    """Auto-detect the local subnet by finding the default route interface IP."""
    try:
        # Connect to a public IP (doesn't send data) to find local interface IP
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("8.8.8.8", 80))
            local_ip = s.getsockname()[0]
        # Assume /24 subnet
        net = ipaddress.IPv4Network(f"{local_ip}/24", strict=False)
        return net
    except OSError:
        return ipaddress.IPv4Network("192.168.178.0/24")


def _scan_yeelight(subnet, timeout=1, max_workers=50):
    """Scan subnet for Yeelight bulbs on port 55443."""
    devices = []

    def _probe(ip_str):
        if yeelight.probe(ip_str, timeout=timeout):
            try:
                status = yeelight.get_status(ip_str)
                name = status.get("name", "") or f"Yeelight-{ip_str.split('.')[-1]}"
                return {
                    "type": "yeelight",
                    "name": name,
                    "host": ip_str,
                    "port": 55443,
                    "model": status.get("model", "unknown"),
                    "power": status.get("power", "unknown"),
                    "brightness": status.get("bright", "unknown"),
                    "ct": status.get("ct", "unknown"),
                }
            except Exception:
                return {
                    "type": "yeelight",
                    "name": f"Yeelight-{ip_str.split('.')[-1]}",
                    "host": ip_str,
                    "port": 55443,
                }
        return None

    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as pool:
        futures = {pool.submit(_probe, str(ip)): str(ip) for ip in subnet.hosts()}
        for future in concurrent.futures.as_completed(futures):
            result = future.result()
            if result:
                devices.append(result)

    return devices


def discover_all(timeout=5, use_cache=True):
    """Discover all devices. Returns cached results if fresh, otherwise re-scans."""
    if use_cache:
        cached = cache.read()
        if cached is not None:
            return cached

    subnet = _get_local_subnet()

    # Discover both types in parallel
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        yeelight_future = pool.submit(_scan_yeelight, subnet, timeout=1)
        cast_future = pool.submit(cast.discover, timeout=timeout)

        yeelight_devices = yeelight_future.result()
        try:
            cast_devices = cast_future.result()
        except Exception:
            cast_devices = []

    devices = yeelight_devices + cast_devices
    cache.write(devices)
    return devices


def match_device(devices, query):
    """Fuzzy-match a device by name. Supports 'all-lights' and 'all-speakers' aliases."""
    q = query.lower().strip()

    if q == "all-lights":
        return [d for d in devices if d["type"] == "yeelight"]
    if q in ("all-speakers", "all-cast"):
        return [d for d in devices if d["type"] == "cast"]
    if q == "all":
        return devices

    matches = [d for d in devices if q in d["name"].lower()]
    return matches
