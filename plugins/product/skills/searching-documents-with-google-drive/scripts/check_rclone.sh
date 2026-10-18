#!/bin/bash
# Check if rclone is installed and configured with gdrive remote
# Usage: ./check_rclone.sh [remote_name]
# Exit codes: 0 = ready, 1 = rclone not installed, 2 = remote not configured

REMOTE_NAME="${1:-gdrive}"

# Check if rclone is installed
if ! command -v rclone &> /dev/null; then
    echo "ERROR: rclone is not installed"
    echo "Install with: brew install rclone"
    exit 1
fi

# Check if the remote is configured
if ! rclone listremotes | grep -q "^${REMOTE_NAME}:$"; then
    echo "ERROR: rclone remote '${REMOTE_NAME}' is not configured"
    echo "Run 'rclone config' to set up a Google Drive remote named '${REMOTE_NAME}'"
    exit 2
fi

# Verify connection by listing root (quick check)
if ! rclone lsd "${REMOTE_NAME}:" --max-depth 0 &> /dev/null; then
    echo "ERROR: Cannot connect to '${REMOTE_NAME}'. Check authentication."
    echo "Run 'rclone config reconnect ${REMOTE_NAME}:' to re-authenticate"
    exit 3
fi

echo "OK: rclone is installed and '${REMOTE_NAME}' remote is configured and accessible"
rclone version | head -1
exit 0
