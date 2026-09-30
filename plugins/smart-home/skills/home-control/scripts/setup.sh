#!/bin/bash
# Setup script for home-control skill dependencies

set -e

echo "Installing pychromecast..."
pip3 install pychromecast

echo "Creating cache directory..."
mkdir -p ~/.cache/home-control

echo "Setup complete."
echo "Test with: python3 $(dirname "$0")/home.py discover"
