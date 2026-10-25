#!/usr/bin/env bash
set -euo pipefail

xfce4-session &
desktop_pid=$!
xdg-settings set default-web-browser pinkly-browser.desktop || true
mkdir -p "$HOME/.config/spotify"

# Spotify creates its own prefs before Spicetify can initialize its configuration.
if [[ ! -f "$HOME/.config/spotify/prefs" ]]; then
  spotify &
  spotify_pid=$!
  for attempt in {1..150}; do
    if [[ -f "$HOME/.config/spotify/prefs" ]]; then break; fi
    if ! kill -0 "$spotify_pid" 2>/dev/null; then break; fi
    sleep 0.2
  done
  pkill -x spotify || true
  wait "$spotify_pid" || true
fi

if [[ ! -f "$HOME/.config/spotify/prefs" ]]; then
  echo 'Spotify did not create prefs. Inspect the desktop logs, then restart the container.' >&2
  wait "$desktop_pid"
  exit 1
fi

spicetify config spotify_path /usr/share/spotify \
  prefs_path "$HOME/.config/spotify/prefs" \
  current_theme Pinkly color_scheme "${PINKLY_COLOR_SCHEME:-Pinkly}" inject_css 1 replace_colors 1 \
  spotify_launch_flags -- '--no-sandbox|--disable-gpu|--disable-gpu-sandbox|--in-process-gpu|--remote-debugging-port=9222|--remote-allow-origins=*'

# A named profile survives restarts; the client files themselves live in the image.
# Restore our backup before taking a fresh one when starting an existing container.
# Spicetify 2.x keeps the backup in its XDG state directory.
backup_dir="${XDG_STATE_HOME:-$HOME/.local/state}/spicetify/Backup"
if [[ -f "$backup_dir/xpui.spa" || -f "$HOME/.config/spicetify/Backup/xpui.spa" ]]; then
  spicetify restore -n
fi
spicetify backup apply -n
spotify --remote-debugging-port=9222 '--remote-allow-origins=*' &

for attempt in {1..100}; do
  if curl -fsS http://127.0.0.1:9222/json/version >/dev/null 2>&1; then break; fi
  sleep 0.2
done
curl -fsS http://127.0.0.1:9222/json/version >/dev/null

echo 'Pinkly applied. Watching the mounted checkout for changes.'
spicetify watch -s &
watcher_pid=$!
wait -n "$desktop_pid" "$watcher_pid"
