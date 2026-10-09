#!/usr/bin/env bash
# Download the reel's Pexels photos (ids in photo-ids.txt) into photos/.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p photos
while read -r id; do
  [ -s "photos/$id.jpg" ] && continue
  curl -sS --retry 3 -o "photos/$id.jpg" \
    "https://images.pexels.com/photos/$id/pexels-photo-$id.jpeg?auto=compress&cs=tinysrgb&w=3200"
  echo "photos/$id.jpg"
done < photo-ids.txt
