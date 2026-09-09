import { spawnSync, type SpawnSyncOptions } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bindMount, type ProjectTarget } from "./project.js";

export const IMAGE_NAME = process.env.LLM_CONTAINER_IMAGE ?? "llm-container-image";
export const MANAGED_LABEL = "io.llm-container.managed=true";
export const DOCKERFILE_PATH = fileURLToPath(new URL("../Dockerfile", import.meta.url));

export interface CommandResult { status: number | null; stdout: string; stderr: string }
export type Runner = (command: string, args: string[], options?: SpawnSyncOptions) => CommandResult;

export const defaultRunner: Runner = (command, args, options = {}) => {
  const result = spawnSync(command, args, { encoding: "utf8", ...options });
  return {
    status: result.status,
    stdout: typeof result.stdout === "string" ? result.stdout : "",
    stderr: typeof result.stderr === "string" ? result.stderr : "",
  };
};

function requireSuccess(result: CommandResult, action: string): void {
  if (result.status === 0) return;
  const detail = result.stderr.trim();
  throw new Error(detail ? `${action}: ${detail}` : `${action} failed`);
}

export class DockerClient {
  constructor(private readonly runCommand: Runner = defaultRunner) {}

  ensureAvailable(): void {
    requireSuccess(this.runCommand("docker", ["info"], { stdio: "pipe" }), "Docker is not available");
  }

  build(image = IMAGE_NAME, dockerfile = DOCKERFILE_PATH): void {
    requireSuccess(this.runCommand("docker", [
      "build", "--no-cache", "-t", image, "-f", dockerfile, path.dirname(dockerfile),
    ], { stdio: "inherit" }), `Could not build ${image}`);
  }

  managedContainerNames(): string[] {
    const result = this.runCommand("docker", [
      "ps", "-a", "--filter", `label=${MANAGED_LABEL}`, "--format", "{{.Names}}",
    ], { stdio: "pipe" });
    requireSuccess(result, "Could not list managed containers");
    return result.stdout.split("\n").map(name => name.trim()).filter(Boolean);
  }

  ensureImageIsNonRoot(image = IMAGE_NAME): void {
    const result = this.runCommand("docker", ["image", "inspect", "--format", "{{.Config.User}}", image], { stdio: "pipe" });
    requireSuccess(result, `Docker image not found (${image})`);
    const user = result.stdout.trim().toLowerCase();
    if (!user || user === "root" || user === "0" || user.startsWith("0:")) {
      throw new Error(`Refusing to run image ${image} as root`);
    }
  }

  ensureContainerIsNonRoot(name: string): void {
    const result = this.runCommand("docker", ["container", "inspect", "--format", "{{.Config.User}}", name], { stdio: "pipe" });
    requireSuccess(result, `Could not inspect ${name}`);
    const user = result.stdout.trim().toLowerCase();
    if (!user || user === "root" || user === "0" || user.startsWith("0:")) {
      throw new Error(`Refusing to reuse container ${name} as root`);
    }
  }

  containerExists(name: string): boolean {
    return this.runCommand("docker", ["container", "inspect", name], { stdio: "pipe" }).status === 0;
  }

  containerRunning(name: string): boolean {
    const result = this.runCommand("docker", ["container", "inspect", "--format", "{{.State.Running}}", name], { stdio: "pipe" });
    return result.status === 0 && result.stdout.trim() === "true";
  }

  create(target: ProjectTarget): void {
    for (const directory of persistentDirectories()) fs.mkdirSync(directory, { recursive: true });
    requireSuccess(this.runCommand("docker", buildCreateArgs(target), { stdio: "inherit" }), `Could not create ${target.containerName}`);
  }

  start(name: string): void {
    requireSuccess(this.runCommand("docker", ["start", name], { stdio: "inherit" }), `Could not start ${name}`);
  }

  stop(name: string): void {
    if (!this.containerRunning(name)) return;
    requireSuccess(this.runCommand("docker", ["stop", "--timeout", "3", name], { stdio: "inherit" }), `Could not stop ${name}`);
  }

  remove(name: string): void {
    requireSuccess(this.runCommand("docker", ["rm", name], { stdio: "inherit" }), `Could not remove ${name}`);
  }

  exec(target: ProjectTarget, command: string[]): number {
    const executable = command.length === 0 ? ["bash"] : command;
    const result = this.runCommand("docker", [
      "exec", "-it", "-e", "TERM=xterm-256color", "-e", "COLORTERM=truecolor",
      "--workdir", target.containerPath, target.containerName, ...executable,
    ], { stdio: "inherit" });
    return result.status ?? 1;
  }

  list(): number {
    const result = this.runCommand("docker", [
      "ps", "-a", "--filter", `label=${MANAGED_LABEL}`, "--format",
      "table {{.Names}}\t{{.Status}}\t{{.Label \"io.llm-container.project-path\"}}",
    ], { stdio: "inherit" });
    return result.status ?? 1;
  }
}

export function persistentDirectories(home = os.homedir()): string[] {
  const base = path.join(home, "llm_container_volume");
  return [path.join(base, ".codex"), path.join(base, ".config", "opencode"), path.join(base, ".local")];
}

export function buildCreateArgs(target: ProjectTarget, home = os.homedir(), image = IMAGE_NAME): string[] {
  const [codex, opencode, local] = persistentDirectories(home);
  return [
    "run", "-d", "--name", target.containerName,
    "--label", MANAGED_LABEL,
    "--label", `io.llm-container.project-path=${target.projectPath}`,
    "-e", "TERM=xterm-256color", "-e", "COLORTERM=truecolor",
    "--workdir", target.containerPath,
    "--mount", bindMount(codex, "/home/node/.codex"),
    "--mount", bindMount(opencode, "/home/node/.config/opencode"),
    "--mount", bindMount(local, "/home/node/.local"),
    "--mount", bindMount(target.projectPath, target.containerPath),
    image, "sleep", "infinity",
  ];
}
