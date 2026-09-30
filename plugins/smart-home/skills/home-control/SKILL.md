---
name: home-control
description: "This skill should be used when the user wants to control smart home devices — lights, speakers, music playback, or scenes. Triggers on phrases like 'turn on the lights', 'play some jazz', 'dim the lights', 'stop the music', 'goodnight', 'movie mode', 'what's playing', or any reference to Yeelight bulbs, Google Cast speakers, or SomaFM radio."
argument-hint: "natural language command (e.g., 'play jazz in the living room')"
allowed-tools: ["Bash", "Read","Bash(python3:*)","Bash(pip3:*)"]
model: "haiku"
---

# Home Control

Control Yeelight bulbs and Google Cast speakers on the local network using the `scripts/home.py` script bundled with this skill.

## CLI Reference

All commands output JSON. Always run from the skill's scripts directory (the base directory is provided above as "Base directory for this skill"):

```
cd <base-directory>/scripts
```

### Discover devices
```bash
python3 home.py discover [--timeout 5]
```

### Device status
```bash
python3 home.py status [--cached]
```

### Light control
```bash
python3 home.py lights --device NAME --action {on,off,toggle,brightness,ct} [--value N]
```
- `--device`: fuzzy name match or `all-lights`
- `brightness`: value 1-100
- `ct`: color temperature 1700-6500K (lower=warm, higher=cool)

### Cast/speaker control
```bash
python3 home.py cast --device NAME --action {play,stop,pause,volume,status} [--url URL] [--stream GENRE] [--volume N]
```
- `--device`: fuzzy name match, `all-speakers`, or a specific group/speaker name
- `--stream`: genre keyword (jazz, ambient, metal, electronic, etc.) — maps to SomaFM AAC streams
- `--url`: direct audio URL (overrides --stream). Must be HTTP (not HTTPS) for Cast compatibility.
- `--volume`: 0-100

### Known devices

| Name | Type | Notes |
|---|---|---|
| Kitchen speaker | Google Home Mini | Individual speaker |
| Living Room speaker | Google Nest Mini | Individual speaker |
| Master Room speaker old | Google Home Mini | Individual speaker |
| Living Room TV 2 | Chromecast | TV, may not play audio-only |
| **Motz** | **Cast Group** | Multi-room group — preferred for "play everywhere" |
| **SoundedX** | **Cast Group** | Multi-room group |

### Multi-room audio

For "play on all speakers" or "play everywhere", use `--device all-speakers`. This targets **speaker groups** (Motz, SoundedX) rather than individual devices. Playing on individual Cast speakers sequentially is unreliable; groups handle sync natively.

For single-room playback, target the specific speaker by name (e.g., `--device kitchen`).

## Workflow

1. **Parse the user's intent** into one or more device actions (light control, audio playback, scenes).
2. **Resolve devices**: use fuzzy name matching. For compound commands ("play jazz and dim the lights"), issue multiple CLI calls.
3. **Resolve genres autonomously**: if a genre keyword returns an "unknown stream/genre" error, do NOT ask the user to choose. Instead, consult `references/somafm-channels.md`, pick the closest matching channel, and play it immediately. Mention which channel was chosen. Fallback priority: match by subgenre, then by mood/energy, then by era.
4. **Execute commands** via `python3 home.py ...` and read JSON output.
5. **Report results** naturally. On success, confirm briefly ("Lights dimmed to 40%"). On error, explain and suggest fixes.

## Scene Presets

When the user says one of these, execute the corresponding commands:

**"goodnight"** / **"bedtime"**:
- `lights --device all-lights --action off`
- `cast --device all-speakers --action stop`

**"movie mode"** / **"movie time"**:
- `lights --device all-lights --action brightness --value 15`
- `lights --device all-lights --action ct --value 2700`

**"reading mode"**:
- `lights --device all-lights --action brightness --value 80`
- `lights --device all-lights --action ct --value 4000`

**"focus"** / **"work mode"**:
- `lights --device all-lights --action brightness --value 100`
- `lights --device all-lights --action ct --value 5000`
- `cast --device all-speakers --action stop`

**"relax"** / **"chill"**:
- `lights --device all-lights --action brightness --value 40`
- `lights --device all-lights --action ct --value 2700`
- `cast --device all-speakers --action play --stream ambient`

## SomaFM Genre Keywords

See `references/somafm-channels.md` for the full list. Common mappings:

| Genre keyword | Channel |
|---|---|
| jazz, spy, lounge | Secret Agent |
| ambient, chill | Groove Salad |
| metal, heavy | Metal |
| electronic, electronica | cliqhop |
| folk | Folk Forward |
| 80s | Underground 80s |
| country, americana | Boot Liquor |
| space | Space Station |
| drone | Drone Zone |

If a genre is not directly mapped, autonomously pick the closest channel from `references/somafm-channels.md` and play it. Never ask the user to choose — just pick the best fit and mention what was selected.

## Troubleshooting

- **"no lights matching"**: Lights may be powered off at the switch. Run `discover` to re-scan.
- **"pychromecast not installed"**: Run `bash <base-directory>/scripts/setup.sh`
- **Cast device not found**: Device may be asleep. Try increasing timeout: `--timeout 10`
- **Cast plays but no sound / "IDLE" after play**: Streams must use **HTTP AAC** format (not HTTPS MP3). The built-in SomaFM URLs already use the correct format. For custom URLs, ensure they are HTTP and the content type matches.
- **Connection refused on Yeelight**: Ensure "LAN Control" is enabled in the Yeelight app for each bulb.
- **Stale cache**: Run `discover` to force a fresh scan (bypasses the 30-min cache).
- **Multi-room not working**: Target a Cast group (Motz, SoundedX) instead of individual speakers. Playing on individual speakers sequentially is unreliable due to zeroconf session conflicts.
