#!/usr/bin/env bash
# ============================================================================
# install.sh — install (or uninstall) the scheduled Claude Code jobs as launchd
# agents on macOS.
#
#   bash automation/install.sh            # show plan, then install
#   bash automation/install.sh --yes      # install without the confirmation pause
#   bash automation/install.sh --uninstall
#   bash automation/install.sh --dry-run  # show plan only
#
# Idempotent: re-running reinstalls scripts and reloads agents.
# Jobs are copied to ~/Scripts/claude-jobs/; plists to ~/Library/LaunchAgents/.
# ============================================================================

set -uo pipefail

AUTOMATION_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEST="$HOME/Scripts/claude-jobs"
LAUNCH_AGENTS="$HOME/Library/LaunchAgents"
LABEL_PREFIX="com.kristiangarza"
UID_NUM="$(id -u)"

JOBS=(berlin-flats-hunt readitlater-digest berlin-events-weekly vhs-watch-check bookclub-dispatch taskwarrior-daily finanz-quarterly)

# Human-readable schedule (for the plan printout).
schedule_desc() {
  case "$1" in
    berlin-flats-hunt)   echo "every 30 min (quiet hours 22–07 gated in-script)";;
    readitlater-digest)  echo "Mondays 06:00";;
    berlin-events-weekly) echo "Fridays 10:00";;
    vhs-watch-check)     echo "daily 08:00";;
    bookclub-dispatch)   echo "daily 09:00";;
    taskwarrior-daily)   echo "daily 08:30";;
    finanz-quarterly)    echo "1st of Jan/Apr/Jul/Oct 09:00";;
  esac
}

# The <key>…</key> XML fragment that sets the trigger for each job.
schedule_xml() {
  case "$1" in
    berlin-flats-hunt)
      echo '  <key>StartInterval</key>
  <integer>1800</integer>';;
    readitlater-digest)
      echo '  <key>StartCalendarInterval</key>
  <dict><key>Weekday</key><integer>1</integer><key>Hour</key><integer>6</integer><key>Minute</key><integer>0</integer></dict>';;
    berlin-events-weekly)
      echo '  <key>StartCalendarInterval</key>
  <dict><key>Weekday</key><integer>5</integer><key>Hour</key><integer>10</integer><key>Minute</key><integer>0</integer></dict>';;
    vhs-watch-check)
      echo '  <key>StartCalendarInterval</key>
  <dict><key>Hour</key><integer>8</integer><key>Minute</key><integer>0</integer></dict>';;
    bookclub-dispatch)
      echo '  <key>StartCalendarInterval</key>
  <dict><key>Hour</key><integer>9</integer><key>Minute</key><integer>0</integer></dict>';;
    taskwarrior-daily)
      echo '  <key>StartCalendarInterval</key>
  <dict><key>Hour</key><integer>8</integer><key>Minute</key><integer>30</integer></dict>';;
    finanz-quarterly)
      echo '  <key>StartCalendarInterval</key>
  <array>
    <dict><key>Month</key><integer>1</integer><key>Day</key><integer>1</integer><key>Hour</key><integer>9</integer><key>Minute</key><integer>0</integer></dict>
    <dict><key>Month</key><integer>4</integer><key>Day</key><integer>1</integer><key>Hour</key><integer>9</integer><key>Minute</key><integer>0</integer></dict>
    <dict><key>Month</key><integer>7</integer><key>Day</key><integer>1</integer><key>Hour</key><integer>9</integer><key>Minute</key><integer>0</integer></dict>
    <dict><key>Month</key><integer>10</integer><key>Day</key><integer>1</integer><key>Hour</key><integer>9</integer><key>Minute</key><integer>0</integer></dict>
  </array>';;
  esac
}

emit_plist() {
  local job="$1" label="$LABEL_PREFIX.$1"
  cat <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>$label</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>-l</string>
    <string>$DEST/$job.sh</string>
  </array>
$(schedule_xml "$job")
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$HOME/.local/bin:$HOME/.bun/bin</string>
  </dict>
  <key>WorkingDirectory</key>
  <string>$HOME</string>
  <key>StandardOutPath</key>
  <string>$HOME/Logs/$job/launchd-stdout.log</string>
  <key>StandardErrorPath</key>
  <string>$HOME/Logs/$job/launchd-stderr.log</string>
  <key>TimeOut</key>
  <integer>1800</integer>
  <key>Nice</key>
  <integer>5</integer>
  <key>RunAtLoad</key>
  <false/>
</dict>
</plist>
PLIST
}

uninstall() {
  echo "Uninstalling Claude jobs…"
  for job in "${JOBS[@]}"; do
    local label="$LABEL_PREFIX.$job"
    launchctl bootout "gui/$UID_NUM/$label" 2>/dev/null && echo "  booted out $label"
    rm -f "$LAUNCH_AGENTS/$label.plist" && echo "  removed plist $label"
  done
  echo "Job scripts in $DEST left in place (delete manually if desired)."
  echo "Done."
}

print_plan() {
  echo "=== Claude Code automation install plan ==="
  echo "Job scripts  -> $DEST/"
  echo "Plists       -> $LAUNCH_AGENTS/$LABEL_PREFIX.<job>.plist"
  echo "Logs         -> ~/Logs/<job>/"
  echo
  echo "Jobs:"
  for job in "${JOBS[@]}"; do printf "  %-22s %s\n" "$job" "$(schedule_desc "$job")"; done
  echo
  echo "NOTE: replaces any existing '$LABEL_PREFIX.readitlater-digest' agent that pointed"
  echo "      at ~/Scripts/readitlater-digest.sh (old script left on disk, no longer scheduled)."
}

# --- arg parsing ---
DRY=0; YES=0
for a in "$@"; do
  case "$a" in
    --uninstall) uninstall; exit 0 ;;
    --dry-run) DRY=1 ;;
    --yes|-y) YES=1 ;;
    *) echo "unknown arg: $a"; exit 2 ;;
  esac
done

print_plan
[ "$DRY" -eq 1 ] && exit 0
if [ "$YES" -ne 1 ]; then
  printf "\nProceed with install? [y/N] "
  read -r ans
  case "$ans" in y|Y|yes) ;; *) echo "aborted"; exit 0 ;; esac
fi

mkdir -p "$DEST" "$LAUNCH_AGENTS"

# Copy the runnable layer (jobs + lib + notify) into DEST so plists don't depend on the repo path.
cp "$AUTOMATION_DIR/notify-telegram.sh" "$DEST/"
mkdir -p "$DEST/lib"
cp "$AUTOMATION_DIR/lib/headless-claude.sh" "$DEST/lib/"
for job in "${JOBS[@]}"; do
  cp "$AUTOMATION_DIR/jobs/$job.sh" "$DEST/"
done
chmod +x "$DEST"/*.sh "$DEST"/lib/*.sh

# Old readitlater agent cleanup (different script path, same label).
launchctl bootout "gui/$UID_NUM/$LABEL_PREFIX.readitlater-digest" 2>/dev/null || true

for job in "${JOBS[@]}"; do
  label="$LABEL_PREFIX.$job"
  plist="$LAUNCH_AGENTS/$label.plist"
  mkdir -p "$HOME/Logs/$job"
  emit_plist "$job" > "$plist"
  launchctl bootout "gui/$UID_NUM/$label" 2>/dev/null || true
  if launchctl bootstrap "gui/$UID_NUM" "$plist" 2>/dev/null; then
    echo "  loaded $label ($(schedule_desc "$job"))"
  else
    echo "  WARNING: failed to bootstrap $label — load manually: launchctl bootstrap gui/$UID_NUM $plist"
  fi
done

echo
echo "Installed. Test any job now with:  bash $DEST/<job>.sh"
echo "Tail logs with:                    tail -f ~/Logs/<job>/*.log"
