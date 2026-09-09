import { describe, expect, it } from "vitest";
import { bindMount, resolveProjectTarget, sanitizeProjectName } from "../src/project.js";

describe("project targeting", () => {
  it("creates a stable project-specific name and dynamic destination", () => {
    const first = resolveProjectTarget(undefined, process.cwd());
    const second = resolveProjectTarget(".", process.cwd());
    expect(first).toEqual(second);
    expect(first.containerName).toMatch(/^llm-container-llm-container-[a-f0-9]{8}$/);
    expect(first.containerPath).toBe("/home/node/llm-container");
  });
  it("sanitizes names and builds bind mount syntax", () => {
    expect(sanitizeProjectName("My Project!")).toBe("My-Project");
    expect(bindMount("/tmp/My Project", "/home/node/My Project")).toBe("type=bind,source=/tmp/My Project,target=/home/node/My Project");
  });
  it("preserves directory case in the container mount point", () => {
    const target = resolveProjectTarget("..", process.cwd());
    expect(target.projectName).toBe("Projetos_Sandbox");
    expect(target.containerPath).toBe("/home/node/Projetos_Sandbox");
    expect(target.containerName).toMatch(/^llm-container-Projetos_Sandbox-[a-f0-9]{8}$/);
  });
});
