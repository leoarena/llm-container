import { describe, expect, it } from "vitest";
import {
  buildCreateArgs,
  DockerClient,
  formatContainerList,
  formatCreatedAt,
} from "../src/docker.js";
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
    expect(args).toContain("type=bind,source=/home/dev/llm_container_volume/.local/state/opencode,target=/home/node/.local/state/opencode");
    expect(args).not.toContain("type=bind,source=/home/dev/llm_container_volume/.local,target=/home/node/.local");
    expect(args.slice(-3)).toEqual(["test-image", "sleep", "infinity"]);
  });
  it("builds the image from the supplied Dockerfile and context", () => {
    const calls: Array<{ command: string; args: string[] }> = [];
    const client = new DockerClient((command, args) => {
      calls.push({ command, args });
      return { status: 0, stdout: "", stderr: "" };
    });
    client.build("test-image", "/project/Dockerfile");
    expect(calls).toEqual([{
      command: "docker",
      args: ["build", "--no-cache", "-t", "test-image", "-f", "/project/Dockerfile", "/project"],
    }]);
  });
  it("lists managed container names", () => {
    const client = new DockerClient(() => ({
      status: 0,
      stdout: "llm-container-one-12345678\nllm-container-two-87654321\n",
      stderr: "",
    }));
    expect(client.managedContainerNames()).toEqual([
      "llm-container-one-12345678",
      "llm-container-two-87654321",
    ]);
  });
  it("formats Docker creation timestamps with one UTC offset", () => {
    expect(formatCreatedAt("2026-09-09 14:57:08 -0300 -03"))
      .toBe("2026-09-09 14:57:08 -03");
    expect(formatCreatedAt("2026-09-09 14:57:08 +0530 IST"))
      .toBe("2026-09-09 14:57:08 +05:30");
  });
  it("renders the container list with a CREATED AT column", () => {
    const output = [
      "llm-container-api-12345678\tExited (137) 2 hours ago\t2026-09-09 14:57:08 -0300 -03\t/home/user/api",
      "llm-container-web-87654321\tExited (0) 1 hour ago\t2026-09-09 15:57:08 -0300 -03\t/home/user/web",
    ].join("\n");
    const table = formatContainerList(output);
    expect(table).toContain("NAMES");
    expect(table).toContain("CREATED AT");
    expect(table).toContain("2026-09-09 14:57:08 -03");
    expect(table).not.toContain("-0300 -03");
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
