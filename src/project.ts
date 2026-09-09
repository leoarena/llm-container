import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export const CONTAINER_PREFIX = "llm-container";

export interface ProjectTarget {
  projectPath: string;
  projectName: string;
  containerName: string;
  containerPath: string;
}

export function sanitizeProjectName(name: string): string {
  const sanitized = name
    .replace(/[^a-zA-Z0-9_.-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return sanitized || "project";
}

export function resolveProjectTarget(input: string | undefined, cwd = process.cwd()): ProjectTarget {
  const projectPath = path.resolve(cwd, input ?? ".");
  if (!fs.existsSync(projectPath) || !fs.statSync(projectPath).isDirectory()) {
    throw new Error(`Project directory does not exist: ${projectPath}`);
  }
  const projectName = path.basename(projectPath);
  const containerProjectName = sanitizeProjectName(projectName);
  const canonicalPath = projectPath.replace(/[\\/]+$/, "");
  const pathHash = crypto.createHash("sha1").update(canonicalPath).digest("hex").slice(0, 8);
  return {
    projectPath,
    projectName,
    containerName: `${CONTAINER_PREFIX}-${containerProjectName}-${pathHash}`,
    containerPath: `/home/node/${projectName}`,
  };
}

export function bindMount(source: string, target: string): string {
  return `type=bind,source=${source},target=${target}`;
}
