#!/usr/bin/env bash
set -euo pipefail

mkdir -p "$XDG_RUNTIME_DIR" "$HOME/.config/spicetify/Themes" "$HOME/.config/xfce4"
chmod 700 "$XDG_RUNTIME_DIR"
ln -sfn /workspace/pinkly "$HOME/.config/spicetify/Themes/Pinkly"
# Keep a previously saved XFCE session from reopening duplicate applications.
rm -rf "$HOME/.cache/sessions"
# Chromium's saved hostname/PID locks become stale when a container is recreated.
rm -f "$HOME/.cache/spotify/SingletonLock" \
  "$HOME/.cache/spotify/SingletonCookie" "$HOME/.cache/spotify/SingletonSocket" \
  "$HOME/.config/chromium/SingletonLock" "$HOME/.config/chromium/SingletonCookie" \
  "$HOME/.config/chromium/SingletonSocket"

pids=()
cleanup() {
  trap - EXIT TERM INT
  if ((${#pids[@]})); then kill "${pids[@]}" 2>/dev/null || true; fi
  wait || true
}
trap cleanup EXIT TERM INT

Xtigervnc :1 -geometry 1440x900 -depth 24 -rfbport 5901 \
  -localhost yes -SecurityTypes None -AlwaysShared -nolisten tcp &
pids+=("$!")
for attempt in {1..100}; do
  if xdpyinfo >/dev/null 2>&1; then break; fi
  if ! kill -0 "${pids[0]}" 2>/dev/null; then exit 1; fi
  sleep 0.1
done
xdpyinfo >/dev/null

dbus-run-session -- /usr/local/bin/pinkly-session &
pids+=("$!")
websockify --web /usr/share/novnc 0.0.0.0:6080 127.0.0.1:5901 &
pids+=("$!")

echo 'Pinkly desktop: http://localhost:6080/vnc.html?autoconnect=1&resize=remote'
wait -n "${pids[@]}"
