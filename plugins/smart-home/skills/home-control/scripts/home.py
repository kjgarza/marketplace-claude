#!/usr/bin/env python3
"""Unified home control CLI. All output is JSON."""

import argparse
import json
import sys

from lib import cache, cast, discovery, yeelight


def cmd_discover(args):
    devices = discovery.discover_all(timeout=args.timeout, use_cache=False)
    return {"devices": devices, "count": len(devices)}


def cmd_status(args):
    devices = discovery.discover_all(use_cache=args.cached)
    results = []
    for d in devices:
        if d["type"] == "yeelight":
            try:
                status = yeelight.get_status(d["host"])
                status["name"] = d["name"]
                status["type"] = "yeelight"
                status["host"] = d["host"]
                results.append(status)
            except Exception as e:
                results.append({"name": d["name"], "type": "yeelight", "error": str(e)})
        elif d["type"] == "cast":
            try:
                status = cast.get_status(d["name"])
                status["type"] = "cast"
                results.append(status)
            except Exception as e:
                results.append({"name": d["name"], "type": "cast", "error": str(e)})
    return {"devices": results}


def cmd_lights(args):
    devices = discovery.discover_all()
    matches = discovery.match_device(devices, args.device)
    lights = [d for d in matches if d["type"] == "yeelight"]

    if not lights:
        return {"error": f"no lights matching '{args.device}'"}

    results = []
    for light in lights:
        ip = light["host"]
        try:
            if args.action == "on":
                resp = yeelight.set_power(ip, "on")
            elif args.action == "off":
                resp = yeelight.set_power(ip, "off")
            elif args.action == "toggle":
                resp = yeelight.toggle(ip)
            elif args.action == "brightness":
                if args.value is None:
                    results.append({"name": light["name"], "error": "brightness requires --value (1-100)"})
                    continue
                resp = yeelight.set_brightness(ip, args.value)
            elif args.action == "ct":
                if args.value is None:
                    results.append({"name": light["name"], "error": "ct requires --value (1700-6500)"})
                    continue
                resp = yeelight.set_ct(ip, args.value)
            else:
                results.append({"name": light["name"], "error": f"unknown action: {args.action}"})
                continue

            results.append({"name": light["name"], "status": "ok", "response": resp})
        except Exception as e:
            results.append({"name": light["name"], "error": str(e)})

    return {"results": results}


def cmd_cast(args):
    if args.action == "play":
        if args.device.lower() in ("all-speakers", "all-cast", "all"):
            # Use speaker groups for multi-room; fall back to individual devices
            devices = discovery.discover_all()
            groups = [d for d in devices if d["type"] == "cast" and "group" in d.get("model", "").lower()]
            if groups:
                results = []
                for g in groups:
                    r = cast.play_stream(g["name"], url=args.url, stream=args.stream)
                    results.append(r)
                return {"results": results}
            # No groups found, try individual speakers
            speakers = discovery.match_device(devices, "all-speakers")
            results = []
            for d in speakers:
                r = cast.play_stream(d["name"], url=args.url, stream=args.stream)
                results.append(r)
            return {"results": results}
        return cast.play_stream(args.device, url=args.url, stream=args.stream)

    elif args.action == "stop":
        if args.device.lower() in ("all-speakers", "all-cast", "all"):
            devices = discovery.discover_all()
            groups = [d for d in devices if d["type"] == "cast" and "group" in d.get("model", "").lower()]
            targets = groups if groups else discovery.match_device(devices, "all-speakers")
            results = []
            for d in targets:
                r = cast.stop(d["name"])
                results.append(r)
            return {"results": results}
        return cast.stop(args.device)

    elif args.action == "pause":
        return cast.pause(args.device)

    elif args.action == "volume":
        if args.volume is None:
            return {"error": "volume requires --volume (0-100)"}
        return cast.set_volume(args.device, args.volume)

    elif args.action == "status":
        return cast.get_status(args.device)

    return {"error": f"unknown action: {args.action}"}


def main():
    parser = argparse.ArgumentParser(description="Home device control CLI")
    sub = parser.add_subparsers(dest="command", required=True)

    # discover
    p_discover = sub.add_parser("discover", help="Discover all devices on the network")
    p_discover.add_argument("--timeout", type=int, default=5)

    # status
    p_status = sub.add_parser("status", help="Get status of all devices")
    p_status.add_argument("--cached", action="store_true", help="Use cached device list")

    # lights
    p_lights = sub.add_parser("lights", help="Control Yeelight bulbs")
    p_lights.add_argument("--device", required=True, help="Device name (fuzzy match) or 'all-lights'")
    p_lights.add_argument("--action", required=True, choices=["on", "off", "toggle", "brightness", "ct"])
    p_lights.add_argument("--value", type=int, help="Value for brightness (1-100) or ct (1700-6500)")

    # cast
    p_cast = sub.add_parser("cast", help="Control Google Cast devices")
    p_cast.add_argument("--device", required=True, help="Device name (fuzzy match) or 'all-speakers'")
    p_cast.add_argument("--action", required=True, choices=["play", "stop", "pause", "volume", "status"])
    p_cast.add_argument("--url", help="Media URL to play")
    p_cast.add_argument("--stream", help="SomaFM stream name or genre keyword")
    p_cast.add_argument("--volume", type=int, help="Volume level (0-100)")

    args = parser.parse_args()

    dispatch = {
        "discover": cmd_discover,
        "status": cmd_status,
        "lights": cmd_lights,
        "cast": cmd_cast,
    }

    result = dispatch[args.command](args)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
