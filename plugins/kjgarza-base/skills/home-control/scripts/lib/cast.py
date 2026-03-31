"""Google Cast device control via pychromecast."""

import time

try:
    import pychromecast
except ImportError:
    pychromecast = None

SOMAFM_STREAMS = {
    "groovesalad": "http://ice2.somafm.com/groovesalad-128-aac",
    "dronezone": "http://ice2.somafm.com/dronezone-128-aac",
    "spacestation": "http://ice2.somafm.com/spacestation-128-aac",
    "secretagent": "http://ice2.somafm.com/secretagent-128-aac",
    "lush": "http://ice2.somafm.com/lush-128-aac",
    "defcon": "http://ice2.somafm.com/defcon-128-aac",
    "metal": "http://ice2.somafm.com/metal-128-aac",
    "deepspaceone": "http://ice2.somafm.com/deepspaceone-128-aac",
    "thistle": "http://ice2.somafm.com/thistle-128-aac",
    "bootliquor": "http://ice2.somafm.com/bootliquor-128-aac",
    "seventies": "http://ice2.somafm.com/seventies-128-aac",
    "poptron": "http://ice2.somafm.com/poptron-128-aac",
    "folkfwd": "http://ice2.somafm.com/folkfwd-128-aac",
    "bagel": "http://ice2.somafm.com/bagel-128-aac",
    "beatblender": "http://ice2.somafm.com/beatblender-128-aac",
    "cliqhop": "http://ice2.somafm.com/cliqhop-128-aac",
    "dubstep": "http://ice2.somafm.com/dubstep-128-aac",
    "fluid": "http://ice2.somafm.com/fluid-128-aac",
    "illinois": "http://ice2.somafm.com/illinois-128-aac",
    "indiepop": "http://ice2.somafm.com/indiepop-128-aac",
    "live": "http://ice2.somafm.com/live-128-aac",
    "missioncontrol": "http://ice2.somafm.com/missioncontrol-128-aac",
    "sonicuniverse": "http://ice2.somafm.com/sonicuniverse-128-aac",
    "suburbsofgoa": "http://ice2.somafm.com/suburbsofgoa-128-aac",
    "synphaera": "http://ice2.somafm.com/synphaera-128-aac",
    "thetrip": "http://ice2.somafm.com/thetrip-128-aac",
    "u80s": "http://ice2.somafm.com/u80s-128-aac",
    "vaporwaves": "http://ice2.somafm.com/vaporwaves-128-aac",
}

# Genre keyword → channel name mapping for fuzzy matching
GENRE_MAP = {
    "jazz": "secretagent",
    "spy": "secretagent",
    "lounge": "secretagent",
    "ambient": "groovesalad",
    "chill": "groovesalad",
    "chillout": "groovesalad",
    "drone": "dronezone",
    "space": "spacestation",
    "metal": "metal",
    "heavy": "metal",
    "country": "bootliquor",
    "americana": "bootliquor",
    "folk": "folkfwd",
    "indie": "indiepop",
    "electronic": "cliqhop",
    "electronica": "cliqhop",
    "dubstep": "dubstep",
    "bass": "dubstep",
    "techno": "beatblender",
    "house": "beatblender",
    "synthwave": "synphaera",
    "synth": "synphaera",
    "80s": "u80s",
    "eighties": "u80s",
    "70s": "seventies",
    "seventies": "seventies",
    "classical": "illinois",
    "lush": "lush",
    "hacker": "defcon",
    "trip": "thetrip",
    "psychedelic": "thetrip",
    "vaporwave": "vaporwaves",
    "deep": "deepspaceone",
    "soul": "sonicuniverse",
    "funk": "sonicuniverse",
    "bagel": "bagel",
    "pop": "poptron",
    "celtic": "thistle",
    "live": "live",
    "goa": "suburbsofgoa",
    "trance": "suburbsofgoa",
    "mission": "missioncontrol",
    "fluid": "fluid",
}


def _require_pychromecast():
    if pychromecast is None:
        raise RuntimeError(
            "pychromecast not installed. Run: pip3 install pychromecast"
        )


def resolve_stream(name_or_genre):
    """Resolve a stream name or genre keyword to a SomaFM URL. Returns (channel, url) or None."""
    key = name_or_genre.lower().strip()
    # Direct channel name match
    if key in SOMAFM_STREAMS:
        return key, SOMAFM_STREAMS[key]
    # Genre keyword match
    if key in GENRE_MAP:
        channel = GENRE_MAP[key]
        return channel, SOMAFM_STREAMS[channel]
    return None


def discover(timeout=5):
    """Discover Cast devices on the network. Returns list of dicts."""
    _require_pychromecast()
    services, browser = pychromecast.discovery.discover_chromecasts(timeout=timeout)
    browser.stop_discovery()
    devices = []
    for service in services:
        devices.append({
            "type": "cast",
            "name": service.friendly_name,
            "host": service.host,
            "port": service.port,
            "model": service.model_name,
            "uuid": str(service.uuid),
        })
    return devices


def _get_device(name, timeout=5):
    """Get a pychromecast device by friendly name (fuzzy substring match)."""
    _require_pychromecast()
    chromecasts, browser = pychromecast.get_chromecasts(timeout=timeout)
    target = name.lower()
    cc = None
    for c in chromecasts:
        if target in c.name.lower():
            cc = c
            break
    if cc is None:
        browser.stop_discovery()
        return None
    cc.wait()
    # Stop discovery only after the device has connected
    browser.stop_discovery()
    return cc


def play_stream(device_name, url=None, stream=None, timeout=5):
    """Play a URL or SomaFM stream on a Cast device."""
    if stream and not url:
        result = resolve_stream(stream)
        if result is None:
            return {"error": f"unknown stream/genre: {stream}"}
        channel, url = result
    if not url:
        return {"error": "no url or stream specified"}

    cc = _get_device(device_name, timeout)
    if cc is None:
        return {"error": f"device not found: {device_name}"}
    mc = cc.media_controller
    content_type = "audio/aac" if url.endswith("-aac") else "audio/mpeg"
    mc.play_media(url, content_type, stream_type="LIVE")
    mc.block_until_active(timeout=10)
    return {"status": "ok", "device": cc.name, "url": url}


def stop(device_name, timeout=5):
    """Stop playback on a Cast device."""
    cc = _get_device(device_name, timeout)
    if cc is None:
        return {"error": f"device not found: {device_name}"}
    cc.media_controller.stop()
    time.sleep(0.5)
    return {"status": "ok", "device": cc.name}


def pause(device_name, timeout=5):
    """Pause playback on a Cast device."""
    cc = _get_device(device_name, timeout)
    if cc is None:
        return {"error": f"device not found: {device_name}"}
    cc.media_controller.pause()
    return {"status": "ok", "device": cc.name}


def set_volume(device_name, level, timeout=5):
    """Set volume on a Cast device (0-100)."""
    cc = _get_device(device_name, timeout)
    if cc is None:
        return {"error": f"device not found: {device_name}"}
    cc.set_volume(int(level) / 100.0)
    return {"status": "ok", "device": cc.name, "volume": int(level)}


def get_status(device_name, timeout=5):
    """Get status of a Cast device."""
    cc = _get_device(device_name, timeout)
    if cc is None:
        return {"error": f"device not found: {device_name}"}
    status = cc.status
    media = cc.media_controller.status
    return {
        "name": cc.name,
        "model": cc.model_name,
        "volume": round(status.volume_level * 100),
        "app": status.display_name,
        "media_title": media.title if media else None,
        "player_state": media.player_state if media else None,
    }
