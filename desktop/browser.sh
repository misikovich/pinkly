#!/usr/bin/env bash
exec /usr/bin/chromium --no-sandbox --disable-gpu --no-first-run "$@"
