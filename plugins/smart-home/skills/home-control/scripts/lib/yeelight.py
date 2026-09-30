"""Yeelight bulb control via direct TCP/JSON (no pip dependency)."""

import json
import socket

DEFAULT_PORT = 55443
TIMEOUT = 3


def _send(ip, method, params=None, port=DEFAULT_PORT):
    """Send a command to a Yeelight bulb and return the response."""
    params = params or []
    msg = json.dumps({"id": 1, "method": method, "params": params}) + "\r\n"
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(TIMEOUT)
        s.connect((ip, port))
        s.sendall(msg.encode())
        data = s.recv(4096).decode()
    # Response may contain multiple JSON lines; parse the first
    for line in data.strip().split("\r\n"):
        try:
            return json.loads(line)
        except json.JSONDecodeError:
            continue
    return {"error": "no valid response"}


def set_power(ip, state, port=DEFAULT_PORT):
    """Turn bulb on or off. state: 'on' or 'off'."""
    return _send(ip, "set_power", [state, "smooth", 300], port)


def toggle(ip, port=DEFAULT_PORT):
    """Toggle bulb power."""
    return _send(ip, "toggle", [], port)


def set_brightness(ip, value, port=DEFAULT_PORT):
    """Set brightness (1-100)."""
    return _send(ip, "set_bright", [int(value), "smooth", 300], port)


def set_ct(ip, value, port=DEFAULT_PORT):
    """Set color temperature (1700-6500K)."""
    return _send(ip, "set_ct_abx", [int(value), "smooth", 300], port)


def get_status(ip, port=DEFAULT_PORT):
    """Get bulb properties."""
    props = ["power", "bright", "ct", "name", "model"]
    resp = _send(ip, "get_prop", props, port)
    if "result" in resp:
        return dict(zip(props, resp["result"]))
    return resp


def probe(ip, port=DEFAULT_PORT, timeout=1):
    """Check if a Yeelight bulb is listening on ip:port. Returns True/False."""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(timeout)
            s.connect((ip, port))
            return True
    except (socket.timeout, ConnectionRefusedError, OSError):
        return False
