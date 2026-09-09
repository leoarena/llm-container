#!/usr/bin/env node

import process from "node:process";
import readline from "node:readline/promises";
import { DockerClient, IMAGE_NAME } from "./docker.js";
import { resolveProjectTarget, type ProjectTarget } from "./project.js";
import { SessionRegistry } from "./sessions.js";

const VERSION = "1.0.0";

function usage(): void {
  console.log(`Usage:
  llm-container                         Open Bash in the current project
  llm-container <command> [args...]     Run a command in the current project
  llm-container build
  llm-container run [path] [-- command]
  llm-container stop [path]
  llm-container remove [path] [--force]
  llm-container list
  llm-container --help | --version`);
}

export function splitRunArgs(args: string[]): { path?: string; command: string[] } {
  const separator = args.indexOf("--");
  if (separator === -1) return { path: args[0], command: [] };
  return { path: separator === 0 ? undefined : args[0], command: args.slice(separator + 1) };
}

async function confirmRemoval(name: string): Promise<boolean> {
  if (!process.stdin.isTTY) return false;
  const terminal = readline.createInterface({ input: process.stdin, output: process.stdout });
  try { return (await terminal.question(`Remove ${name}? [y/N] `)).trim().toLowerCase() === "y"; }
  finally { terminal.close(); }
}

function requireContainer(client: DockerClient, target: ProjectTarget): void {
  if (!client.containerExists(target.containerName)) throw new Error(`Container does not exist: ${target.containerName}`);
}

function openSession(client: DockerClient, sessions: SessionRegistry, target: ProjectTarget, command: string[]): number {
  client.ensureImageIsNonRoot();
  sessions.register(target.containerName, () => {
    if (!client.containerExists(target.containerName)) client.create(target);
    else {
      client.ensureContainerIsNonRoot(target.containerName);
      if (!client.containerRunning(target.containerName)) client.start(target.containerName);
    }
  });
  let cleaned = false;
  const cleanup = (): void => {
    if (cleaned) return;
    cleaned = true;
    sessions.unregister(target.containerName, () => client.stop(target.containerName));
  };
  const signalHandlers = new Map<NodeJS.Signals, () => void>();
  for (const signal of ["SIGINT", "SIGHUP", "SIGTERM"] as const) {
    const handler = (): void => { cleanup(); process.exit(signal === "SIGINT" ? 130 : 1); };
    signalHandlers.set(signal, handler);
    process.on(signal, handler);
  }
  try { return client.exec(target, command); }
  finally {
    for (const [signal, handler] of signalHandlers) process.off(signal, handler);
    cleanup();
  }
}

async function main(args = process.argv.slice(2)): Promise<number> {
  const client = new DockerClient();
  const sessions = new SessionRegistry();
  if (["--help", "-h", "help"].includes(args[0])) { usage(); return 0; }
  if (["--version", "-v"].includes(args[0])) { console.log(VERSION); return 0; }
  client.ensureAvailable();
  if (args[0] === "build") {
    client.build();
    console.log(`Image built successfully: ${IMAGE_NAME}`);
    const containers = client.managedContainerNames();
    if (containers.length > 0) {
      console.warn("Existing containers were not replaced and may still use the previous image:");
      for (const name of containers) console.warn(`  ${name}`);
      console.warn("Remove a project's container and open it again to use the rebuilt image.");
    }
    return 0;
  }
  if (args[0] === "list") return client.list();
  if (args[0] === "stop") {
    const target = resolveProjectTarget(args[1]);
    requireContainer(client, target);
    client.stop(target.containerName);
    sessions.clear(target.containerName);
    return 0;
  }
  if (args[0] === "remove") {
    const force = args.includes("--force");
    const projectArg = args.slice(1).find(arg => arg !== "--force");
    const target = resolveProjectTarget(projectArg);
    requireContainer(client, target);
    if (!force && !(await confirmRemoval(target.containerName))) {
      console.error("Removal cancelled. Use --force for non-interactive removal.");
      return 1;
    }
    client.stop(target.containerName);
    client.remove(target.containerName);
    sessions.clear(target.containerName);
    return 0;
  }
  if (args[0] === "run") {
    const parsed = splitRunArgs(args.slice(1));
    return openSession(client, sessions, resolveProjectTarget(parsed.path), parsed.command);
  }
  return openSession(client, sessions, resolveProjectTarget(undefined), args);
}

main().then(status => { process.exitCode = status; }, error => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
