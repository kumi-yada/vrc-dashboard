#!/usr/bin/env bash
# Download the latest GitHub release asset matching a name pattern (default: *AppImage*),
# make it executable, place it in ~/Downloads/apps, and delete older AppImages there
# (plus their entries in the rofi run cache, ~/.cache/rofi-4.runcache).
#
# Usage: download-latest-appimage.sh [owner/repo] [asset-name-pattern]
# Defaults to this project's repo (kumi-yada/vrc-dashboard).
# Optional: set GITHUB_TOKEN for higher GitHub API rate limits.

set -euo pipefail

DEFAULT_REPO="kumi-yada/vrc-dashboard"
if [[ $# -ge 1 && "$1" == */* ]]; then
  REPO="$1"
  PATTERN="${2:-AppImage}"
else
  REPO="$DEFAULT_REPO"
  PATTERN="${1:-AppImage}"
fi
DEST_DIR="$HOME/Downloads/apps"
API_URL="https://api.github.com/repos/${REPO}/releases/latest"

mkdir -p "$DEST_DIR"

curl_headers=(-sS -H "Accept: application/vnd.github+json" -H "User-Agent: ${0##*/}")
if [[ -n "${GITHUB_TOKEN:-}" ]]; then
  curl_headers+=(-H "Authorization: Bearer ${GITHUB_TOKEN}")
fi

release_json=$(curl -fL "${curl_headers[@]}" "$API_URL")

if command -v jq >/dev/null 2>&1; then
  mapfile -t asset_urls < <(jq -r --arg p "$PATTERN" '
    .assets[] | select(.name | test($p; "i")) | .browser_download_url
  ' <<<"$release_json")
else
  mapfile -t asset_urls < <(python3 -c '
import json, re, sys
data = json.load(sys.stdin)
pattern = re.compile(sys.argv[1], re.IGNORECASE)
for asset in data.get("assets", []):
    if pattern.search(asset.get("name", "")):
        print(asset["browser_download_url"])
' "$PATTERN" <<<"$release_json")
fi

if [[ ${#asset_urls[@]} -eq 0 ]]; then
  echo "No asset matching '${PATTERN}' found in the latest release of ${REPO}" >&2
  exit 1
fi

# Prefer an x86_64/amd64 build when several assets match.
url="${asset_urls[0]}"
for u in "${asset_urls[@]}"; do
  if [[ "$u" =~ x86_64|amd64 ]]; then
    url="$u"
    break
  fi
done

name="${url##*/}"
dest="$DEST_DIR/$name"
tmp=$(mktemp)
trap 'rm -f "$tmp"' EXIT

echo "Downloading ${name} from ${REPO} ..."
curl -fL --retry 3 --progress-bar -o "$tmp" "$url"
mv -f "$tmp" "$dest"
chmod 755 "$dest"

# Remove only older versions of this same app (filename with version numbers
# wildcarded), leaving other apps' AppImages untouched.
glob_name=$(printf '%s' "$name" | sed -E 's/[0-9]+(\.[0-9]+)*/*/g')
find "$DEST_DIR" -maxdepth 1 -type f -iname "$glob_name" ! -name "$name" -delete

# rofi's run-mode cache ("<hit-count> <command>" per line) would keep offering
# the deleted files, so drop entries that reference previous versions of this app.
cache_file="${XDG_CACHE_HOME:-$HOME/.cache}/rofi-4.runcache"
if [[ -f "$cache_file" ]]; then
  shopt -s nocasematch
  kept=()
  removed=0
  while IFS= read -r line || [[ -n "$line" ]]; do
    entry="${line#* }"
    if [[ "$entry" == *$glob_name* && "$entry" != *$name* ]]; then
      removed=$((removed + 1))
    else
      kept+=("$line")
    fi
  done <"$cache_file"
  shopt -u nocasematch
  if ((removed > 0)); then
    if ((${#kept[@]} > 0)); then
      printf '%s\n' "${kept[@]}" >"$cache_file"
    else
      : >"$cache_file"
    fi
    echo "Removed ${removed} stale entry(ies) from ${cache_file}"
  fi
fi

echo "Installed: $dest"
