import { execFileSync, spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const imageTag = `llm-container-image-test:${process.pid}-${randomUUID().slice(0, 8)}`;

function dockerIsReady(): boolean {
  return spawnSync("docker", ["info"], { stdio: "ignore", timeout: 2_000 }).status === 0;
}

function runDocker(args: string[]): string {
  return execFileSync("docker", args, {
    cwd: repositoryRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  });
}

function buildImage(): void {
  execFileSync("docker", ["build", "--no-cache", "-t", imageTag, repositoryRoot], {
    cwd: repositoryRoot,
    stdio: "inherit",
    timeout: 600_000,
  });
}

function runInImage(command: string): string {
  return runDocker(["run", "--rm", imageTag, "sh", "-lc", command]);
}

function runInImageWithOpenCodeStateMount(image: string, command: string): string {
  return runDocker([
    "run",
    "--rm",
    "--mount",
    "type=tmpfs,destination=/home/node/.local/state/opencode",
    image,
    "sh",
    "-lc",
    command,
  ]);
}

const dockerDescribe = dockerIsReady() ? describe : describe.skip;

dockerDescribe("workspace image runtime", () => {
  beforeAll(() => {
    buildImage();
  }, 600_000);

  afterAll(() => {
    spawnSync("docker", ["image", "rm", "--force", imageTag], {
      cwd: repositoryRoot,
      stdio: "ignore",
    });
  });

  it("provides uv and uvx to the normal user", () => {
    const output = runInImage("id -u; uv --version; uvx --version");

    expect(output).toMatch(/^1000\n/m);
    expect(output).toMatch(/uv \d+\.\d+\.\d+/);
    expect(output).toMatch(/uvx \d+\.\d+\.\d+/);
  }, 30_000);

  it("provides the Spec Kit CLI to the normal user", () => {
    const output = runInImageWithOpenCodeStateMount(
      imageTag,
      "id -u; command -v specify; specify --help",
    );

    expect(output).toMatch(/^1000\n/m);
    expect(output).toContain("/home/node/.local/bin/specify");
    expect(output).toMatch(/specify|Spec Kit/i);
  }, 30_000);

  it("provides uv-managed python and python3 to the normal user", () => {
    const output = runInImage("python --version; python3 --version");
    const versions = output.match(/Python \d+\.\d+\.\d+/g) ?? [];

    expect(versions).toHaveLength(2);
    expect(versions[0]).toBe(versions[1]);
  });

  it("does not create a project environment until requested", () => {
    const output = runInImage("test ! -e .venv && echo absent");

    expect(output.trim()).toBe("absent");
  });

  it("creates a project environment explicitly with uv venv", () => {
    const output = runInImage(
      "tmpdir=$(mktemp -d) && cd $tmpdir && uv venv && test -x .venv/bin/python && id -u",
    );

    expect(output.trim()).toBe("1000");
  });

  it("supports a remapped non-root UID and GID", () => {
    const customTag = `${imageTag}-custom`;

    try {
      execFileSync("docker", [
        "build",
        "--build-arg",
        "USER_ID=2000",
        "--build-arg",
        "GROUP_ID=2000",
        "-t",
        customTag,
        repositoryRoot,
      ], {
        cwd: repositoryRoot,
        stdio: "inherit",
        timeout: 600_000,
      });
      const output = runInImageWithOpenCodeStateMount(
        customTag,
        "test $(id -u) = 2000 && uv --version && python --version && command -v specify && specify --help",
      );

      expect(output).toMatch(/uv \d+\.\d+\.\d+/);
      expect(output).toMatch(/Python \d+\.\d+\.\d+/);
      expect(output).toMatch(/specify|Spec Kit/i);
    } finally {
      spawnSync("docker", ["image", "rm", "--force", customTag], {
        cwd: repositoryRoot,
        stdio: "ignore",
      });
    }
  }, 600_000);
});
