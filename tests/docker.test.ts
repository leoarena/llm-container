import { describe, expect, it } from "vitest";
import { buildCreateArgs, DockerClient } from "../src/docker.js";
import type { ProjectTarget } from "../src/project.js";

const target: ProjectTarget = {
  projectPath: "/projects/my-api", projectName: "my-api",
  containerName: "llm-container-my-api-12345678", containerPath: "/home/node/my-api",
};

describe("Docker integration arguments", () => {
  it("creates a persistent labeled container with dynamic mount", () => {
    const args = buildCreateArgs(target, "/home/dev", "test-image");
    expect(args).not.toContain("--rm");
    expect(args).toContain("io.llm-container.managed=true");
    expect(args).toContain("type=bind,source=/projects/my-api,target=/home/node/my-api");
    expect(args.slice(-3)).toEqual(["test-image", "sleep", "infinity"]);
  });
  it("rejects root images", () => {
    const client = new DockerClient(() => ({ status: 0, stdout: "root\n", stderr: "" }));
    expect(() => client.ensureImageIsNonRoot()).toThrow("as root");
  });
  it("accepts the node image user", () => {
    const client = new DockerClient(() => ({ status: 0, stdout: "node\n", stderr: "" }));
    expect(() => client.ensureImageIsNonRoot()).not.toThrow();
  });
  it("rejects an existing root container", () => {
    const client = new DockerClient(() => ({ status: 0, stdout: "0:0\n", stderr: "" }));
    expect(() => client.ensureContainerIsNonRoot(target.containerName)).toThrow("reuse");
  });
});
