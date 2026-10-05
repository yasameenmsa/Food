#!/usr/bin/env bash
# Removes the VS Code Simple Browser service worker registration and its cache.
# A service worker is bound to the ORIGIN (http://localhost:3000), not to a
# project, so a cached one keeps serving the previous project after you switch
# projects on the same port. Close VS Code before running this.
set -euo pipefail

PARTITION="$HOME/.config/Code/Partitions/vscode-browser"

if pgrep -f 'vscode-browser' >/dev/null 2>&1; then
  echo "VS Code is still running. Quit VS Code first, then run this again." >&2
  exit 1
fi

if [ -d "$PARTITION/Service Worker" ]; then
  rm -rf "$PARTITION/Service Worker" "$PARTITION/Cache" \
         "$PARTITION/Session Storage" "$PARTITION/Local Storage"
  echo "removed service worker registration and cached pages for localhost"
else
  echo "nothing to remove"
fi