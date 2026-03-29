#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

SRC_ASSETS="${ROOT_DIR}/src/assets"
WEB_PUBLIC="${ROOT_DIR}/apps/web/public"
MOBILE_ASSETS="${ROOT_DIR}/apps/mobile/assets"

mkdir -p "${WEB_PUBLIC}" "${MOBILE_ASSETS}"

# Web branding assets
cp -f "${SRC_ASSETS}/logo.png" "${WEB_PUBLIC}/logo.png"
cp -f "${SRC_ASSETS}/logo.ico" "${WEB_PUBLIC}/logo.ico"

# Mobile branding assets
cp -f "${SRC_ASSETS}/vipex-1024.png" "${MOBILE_ASSETS}/icon.png"
cp -f "${SRC_ASSETS}/vipex-1024.png" "${MOBILE_ASSETS}/android-icon-foreground.png"
cp -f "${SRC_ASSETS}/vipex.png" "${MOBILE_ASSETS}/splash-icon.png"
cp -f "${SRC_ASSETS}/logo.png" "${MOBILE_ASSETS}/favicon.png"

echo "Brand assets synced from src/assets to web/mobile targets."
