import { spawnSync } from "node:child_process";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  symlinkSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const theme = "Pinkly";
const windows = process.platform === "win32";
const executable = windows ? "spicetify.exe" : "spicetify";

function findCli() {
  const candidates = process.env.SPICETIFY_BIN
    ? [process.env.SPICETIFY_BIN]
    : [
        executable,
        join(homedir(), ".spicetify", executable),
        ...(process.env.LOCALAPPDATA
          ? [join(process.env.LOCALAPPDATA, "spicetify", executable)]
          : []),
      ];
  for (const candidate of candidates) {
    if (spawnSync(candidate, ["--version"], { encoding: "utf8" }).status === 0)
      return candidate;
  }
  throw new Error(
    "Spicetify CLI not found. Install it from https://spicetify.app/docs/getting-started or set SPICETIFY_BIN to its executable path.",
  );
}

function run(args, capture = false) {
  const result = spawnSync(cli, args, {
    cwd: root,
    stdio: capture ? "pipe" : "inherit",
    encoding: "utf8",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    if (capture)
      process.stderr.write((result.stdout || "") + (result.stderr || ""));
    const error = new Error(`Spicetify failed: ${args.join(" ")}`);
    error.exitCode = result.status || 1;
    throw error;
  }
  return ((result.stdout || "") + (result.stderr || "")).trim();
}

function linkTheme(configPath) {
  const destination = join(dirname(configPath), "Themes", theme);
  mkdirSync(dirname(destination), { recursive: true });
  let existing;
  try {
    existing = lstatSync(destination);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  if (existing) {
    if (
      !existsSync(destination) ||
      realpathSync(destination) !== realpathSync(root)
    ) {
      throw new Error(
        `Refusing to overwrite ${destination}. Move the existing theme aside, then retry.`,
      );
    }
  } else {
    symlinkSync(root, destination, windows ? "junction" : "dir");
  }
  console.log(`Theme linked: ${destination} -> ${root}`);
}

function setting(config, key) {
  return (
    config
      .match(new RegExp(`^[\\t ]*${key}[\\t ]*=[\\t ]*([^\\r\\n]*)`, "m"))?.[1]
      .trim() || ""
  );
}

function expandPath(value) {
  return value.replace(
    /\$(\w+)|\$\{(\w+)\}|%(\w+)%/g,
    (match, plain, braced, percent) =>
      process.env[plain || braced || percent] ?? match,
  );
}

function requireSpotify(configPath) {
  if (!existsSync(configPath)) {
    throw new Error(
      "Spicetify is not configured. Install and open Spotify Desktop, then run npm run setup.",
    );
  }
  const config = readFileSync(configPath, "utf8");
  const spotifyPath = expandPath(setting(config, "spotify_path"));
  const prefsPath = expandPath(setting(config, "prefs_path"));
  if (
    !spotifyPath ||
    !existsSync(join(spotifyPath, "Apps")) ||
    !prefsPath ||
    !existsSync(prefsPath)
  ) {
    throw new Error(
      "Spotify Desktop or its prefs file is missing. Install and open Spotify on this machine, then configure spotify_path and prefs_path (see README.md). Live development requires a desktop session.",
    );
  }
  return config;
}

let cli;
try {
  const [command = "doctor", ...args] = process.argv.slice(2);
  if (!["cli", "link", "setup", "apply", "dev", "doctor"].includes(command))
    throw new Error(`Unknown command: ${command}`);
  cli = findCli();
  if (command === "cli") {
    run(args);
  } else {
    const configPath = run(["-c"], true);
    if (command === "link") {
      linkTheme(configPath);
    } else {
      if (command === "setup" && !existsSync(configPath))
        run(["config", "current_theme"]);
      if (command === "doctor")
        console.log(
          `Node: ${process.version}\nSpicetify: ${run(["--version"], true)}\nConfig: ${configPath}`,
        );
      const config = requireSpotify(configPath);
      if (command === "setup") {
        linkTheme(configPath);
        run([
          "config",
          "current_theme",
          theme,
          "color_scheme",
          process.env.PINKLY_COLOR_SCHEME || "Pinkly",
          "inject_css",
          "1",
          "replace_colors",
          "1",
        ]);
        run(["backup", "apply", "enable-devtools"]);
        console.log("Ready. Run npm run dev to watch theme changes.");
      } else if (command === "doctor") {
        console.log(
          `Spotify: ${setting(config, "spotify_path")}\nActive theme: ${setting(config, "current_theme") || "(none)"}`,
        );
      } else {
        if (setting(config, "current_theme") !== theme)
          throw new Error(
            "Pinkly is not the active theme. Run npm run setup first.",
          );
        linkTheme(configPath);
        run(command === "dev" ? ["watch", "-s"] : ["apply"]);
      }
    }
  }
} catch (error) {
  console.error(`\n${error.message}`);
  process.exitCode = error.exitCode || 1;
}
