#!/usr/bin/env bash
exec /usr/share/spotify/spotify --no-sandbox --disable-gpu \
  --disable-gpu-sandbox --in-process-gpu --disable-dev-shm-usage "$@"
