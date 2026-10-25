<img src="assets/icon.svg" width="64" height="64" alt="">

# Pinkly

A pastel-pink Spicetify theme with flowers, satin bows, fluttering butterflies,
glitter, sakura branches, a falling-petal "flower-fall", and shine 💅. The
decorations are inline SVGs in `user.css`, so no extra asset files or `theme.js`
are needed. Animations respect reduced-motion settings. To turn off the
flower-fall, set `--pinkly-flowerfall-opacity` to `0` in `user.css`.

![Pinkly light](assets/preview.png)

![Pinkly dark](assets/preview-dark.png)

## Install

**Spicetify Marketplace:** open Marketplace in Spotify, go to **Themes**, search for
**Pinkly**, and click **Install**. Choose `Pinkly` (light) or `Dark` as the color
scheme.

**Manually:** copy `user.css` and `color.ini` into a `Pinkly` folder inside
Spicetify's `Themes` directory (`spicetify path userdata` shows where it is), then
run:

```sh
spicetify config current_theme Pinkly color_scheme Pinkly   # or color_scheme Dark
spicetify apply
```

To stop using Pinkly, select another theme and run `spicetify apply`, or restore
the unmodified client with `spicetify restore`.

## Development

Edit `color.ini` for the palettes and `user.css` for styles. Spicetify reads these
files directly; there is no build step.

### Requirements

- Node.js 22 or newer (24 is pinned in `.nvmrc`) and npm.
- Spotify **Desktop**, installed and opened at least once.
- [Spicetify CLI](https://spicetify.app/docs/getting-started). The scripts find it
  on `PATH` or in the official installer's default location. Set `SPICETIFY_BIN`
  to use a custom executable.

### Live development with your Spotify installation

```sh
npm ci
npm run setup
npm run dev
```

`setup` links this repository as `Themes/Pinkly` beside your Spicetify config,
selects the `Pinkly` color scheme, enables CSS and color replacement, and runs
`spicetify backup apply enable-devtools`. This may restart Spotify. An existing
theme at that path is never overwritten. Rerun setup if you move the checkout.

`dev` runs `spicetify watch -s`, which reloads Spotify whenever theme files
change. Leave it running while editing and stop it with Ctrl+C.

| Command                       | Purpose                                                                     |
| ----------------------------- | --------------------------------------------------------------------------- |
| `npm run doctor`              | Check the CLI, Spotify installation, preferences, and active theme.         |
| `npm run theme:link`          | Link the checkout without changing the active theme. Works without Spotify. |
| `npm run setup`               | Link, select, back up, apply the theme, and enable DevTools.                |
| `npm run dev`                 | Watch the active Pinkly theme and reload Spotify.                           |
| `npm run apply`               | Reapply Pinkly after configuration changes.                                 |
| `npm run check`               | Check formatting and script syntax; works without Spotify.                  |
| `npm run format`              | Format CSS, JavaScript, JSON, and Markdown.                                 |
| `npm run spicetify -- <args>` | Run any Spicetify CLI command.                                              |

### Optional Docker desktop

For machines without Spotify (for example a headless Linux server), `desktop/`
contains a Docker image with an XFCE desktop, Spotify, Spicetify, and a browser,
reachable through noVNC. It requires Docker with Compose and currently targets
Linux amd64.

```sh
npm run desktop:up     # Build if needed and start in the background
npm run desktop:status # Container health
npm run desktop:logs   # Desktop, Spotify, and watcher output
npm run desktop:shell  # Terminal inside the container
npm run desktop:down   # Stop the desktop
```

Open [the desktop](http://localhost:6080/vnc.html?autoconnect=1&resize=remote)
and sign in to Spotify inside it. The checkout is mounted read-only and watched,
so edits reload Spotify automatically. After signing in, run
`spicetify enable-devtools` from `npm run desktop:shell` to enable the
Ctrl+Shift+I inspector.

The noVNC port is bound to `127.0.0.1` and has no password. On a remote machine,
forward it over SSH instead of exposing it:

```sh
ssh -N -L 6080:127.0.0.1:6080 your-user@your-host
```

Set `PINKLY_DESKTOP_PORT` to use another port. If your user cannot access Docker
directly, the scripts fall back to passwordless `sudo -n docker`. The Docker volume
`pinkly-desktop_profile` keeps the Spotify login and desktop settings between
runs; removing it deletes that profile.

### Color schemes

`color.ini` contains two palettes: the light `[Pinkly]` default and `[Dark]`. Set
`PINKLY_COLOR_SCHEME=Dark` to develop with the dark one:

```sh
PINKLY_COLOR_SCHEME=Dark npm run setup        # Your Spotify installation
PINKLY_COLOR_SCHEME=Dark npm run desktop:up   # Docker desktop
```

Each palette key becomes a CSS variable: `button` becomes `var(--spice-button)`,
and its RGB components become `var(--spice-rgb-button)` for translucent colors
such as `rgba(var(--spice-rgb-button), 0.2)`. Both palettes must also define the
extra `backdrop-*`, `main-top`, `main-bottom`, `card-top`, and `shine` keys used
by the gradients in `user.css`.

### Tips

Open Spotify DevTools with Ctrl+Shift+I (Cmd+Option+I on macOS) to inspect
elements and try styles, then copy working changes into `user.css`. Spotify's
class names can change between client updates, so check selectors against the
real DOM.

### Troubleshooting

If Spotify or its `prefs` file cannot be found, open Spotify once, then set the
paths explicitly:

```sh
npm run spicetify -- config spotify_path "/absolute/path/to/spotify"
npm run spicetify -- config prefs_path "/absolute/path/to/spotify/prefs"
npm run setup
```

See the [installation guide](https://spicetify.app/docs/getting-started) for
platform-specific paths. After a Spotify update, run
`npm run spicetify -- backup apply` before watching again.

References: [theme development](https://spicetify.app/docs/development/themes),
[CLI commands and flags](https://github.com/spicetify/cli/blob/v2.46.3/spicetify.go).
