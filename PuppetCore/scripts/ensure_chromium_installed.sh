#!/bin/bash

if [[ -n "${DEBUG:-}" ]]; then
  set -x
fi

# Ensure Chromium is installed, and update config.ini with the correct path

CONFIG_FILE="$(dirname "$0")/../config/config.ini"
CONFIG_FILE="$(realpath "$CONFIG_FILE")"

echo "Config file path: $CONFIG_FILE"
echo "Running on: $(uname -a)"

# ---------------------------------------------------------------------------
# Locate a Chromium/Chrome executable
# ---------------------------------------------------------------------------

# Respect CHROME_PATH env if provided and executable
if [[ -n "${CHROME_PATH:-}" && -x "${CHROME_PATH}" ]]; then
  CHROMIUM_PATH="${CHROME_PATH}"
else
  for c in chromium chromium-browser google-chrome google-chrome-stable; do
    if command -v "$c" >/dev/null 2>&1; then
      CHROMIUM_PATH="$(command -v "$c")"
      break
    fi
  done
fi

if [[ -z "$CHROMIUM_PATH" ]]; then
  echo "Chromium is not installed. Installing Chromium..."

  if [ -f /etc/debian_version ]; then
    # Debian/Ubuntu
    sudo apt update
    sudo apt install -y chromium || sudo apt install -y chromium-browser || true
  else
    echo "Unsupported OS. Please install Chromium manually." >&2
    exit 1
  fi

  # Re-check after attempted install
  for c in chromium chromium-browser google-chrome google-chrome-stable; do
    if command -v "$c" >/dev/null 2>&1; then
      CHROMIUM_PATH="$(command -v "$c")"
      break
    fi
  done
fi

if [[ -z "$CHROMIUM_PATH" ]]; then
  echo "Could not find Chromium executable." >&2
  exit 1
else
  echo "Chromium path: $CHROMIUM_PATH"
fi

# Update config.ini
echo "Updating config.ini..."

# Use sed to update config.ini
if grep -q '^chromePath=' "$CONFIG_FILE"; then
  sed -i "s|^\(chromePath=\).*|\1$CHROMIUM_PATH|" "$CONFIG_FILE"
else
  echo "chromePath=$CHROMIUM_PATH" >> "$CONFIG_FILE"
fi

echo "config.ini updated with chromePath=$CHROMIUM_PATH"
