#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/../_fixtures/common.sh"
write_config
write_profile
write_posting fit 20 closed
