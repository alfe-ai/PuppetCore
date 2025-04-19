#!/bin/bash

# Ensure Chromium is installed, and update config.ini with the correct path

CONFIG_FILE="$(dirname "$0")/../config/config.ini"
CONFIG_FILE="$(realpath "$CONFIG_FILE")"

echo "Config file path: $CONFIG_FILE"

# Check if Chromium is installed
if ! command -v chromium > /dev/null 2>&1; then
  echo "Chromium is not installed. Installing Chromium..."

  # Detect package manager and install Chromium
  if [ -f /etc/debian_version ]; then
    # Debian/Ubuntu
    sudo apt update
    sudo apt install -y chromium
  else
    echo "Unsupported OS. Please install Chromium manually."
    exit 1
  fi
else
  echo "Chromium is already installed."
fi

# Find the Chromium executable path
CHROMIUM_PATH=$(which chromium)
if [ -z "$CHROMIUM_PATH" ]; then
  echo "Could not find Chromium executable."
  exit 1
fi

echo "Chromium path: $CHROMIUM_PATH"

# Update config.ini
echo "Updating config.ini..."

# Use sed to update config.ini
if grep -q '^chromePath=' "$CONFIG_FILE"; then
  sed -i "s|^\(chromePath=\).*|\1$CHROMIUM_PATH|" "$CONFIG_FILE"
else
  echo "chromePath=$CHROMIUM_PATH" >> "$CONFIG_FILE"
fi

echo "config.ini updated with chromePath=$CHROMIUM_PATH"
