import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const commands = {
  up: ["up", "-d", "--build"],
  down: ["down"],
  logs: ["logs", "-f"],
  status: ["ps"],
  shell: ["exec", "desktop", "bash"],
};

try {
  const command = commands[process.argv[2]];
  if (!command) throw new Error("Expected up, down, logs, status, or shell.");
  let executable = "docker";
  let prefix = [];
  if (spawnSync("docker", ["info"], { stdio: "ignore" }).status !== 0) {
    if (
      spawnSync("sudo", ["-n", "docker", "info"], { stdio: "ignore" })
        .status !== 0
    ) {
      throw new Error(
        "Docker is unavailable. Install/start Docker and ensure your user can access it.",
      );
    }
    console.log("Using passwordless sudo for Docker access.");
    executable = "sudo";
    // sudo drops the caller's environment; keep Compose's Pinkly settings.
    prefix = [
      "-n",
      "--preserve-env=PINKLY_COLOR_SCHEME,PINKLY_DESKTOP_PORT",
      "docker",
    ];
  }
  const result = spawnSync(
    executable,
    [...prefix, "compose", "-f", "desktop/compose.yaml", ...command],
    {
      cwd: root,
      stdio: "inherit",
    },
  );
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
