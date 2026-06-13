#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$ROOT/public/shop/category-icons"
BASE="https://shop.swr-loerrach.de/benutzerdaten/400050/shop/layout/icons"
WAYBACK="https://web.archive.org/web/2024"

mkdir -p "$DEST"

download() {
  local local_name="$1"
  local remote_name="$2"
  local dest_path="$DEST/$local_name"

  echo "Downloading $local_name ..."
  if curl --fail --location --silent --show-error \
    --connect-timeout 10 --max-time 30 \
    -o "$dest_path" \
    "$BASE/$remote_name"; then
    echo "  source: live shop"
    return 0
  fi

  echo "  live shop unreachable, trying Wayback Machine ..."
  curl --fail --location --silent --show-error \
    --connect-timeout 15 --max-time 45 \
    -o "$dest_path" \
    "$WAYBACK/$BASE/$remote_name"
  echo "  source: Wayback Machine"
}

download schweisstechnik.png schweisstechnik.png
download werkzeuge.png werkzeuge.png
download maschinen.png maschinen.png
download arbeitsschutz.png arbeitsschutz.png
download lager-betriebseinrichtung.png lager-betriebseinrichtung.png
download werkstattbedarf.png wekstattausstattung.png
download druckluft.png druckluft.png

count="$(find "$DEST" -maxdepth 1 -name '*.png' | wc -l | tr -d ' ')"
echo "Saved $count icons to $DEST"
