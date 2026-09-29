# Implementation Plan: Add Spec Kit CLI to Image

**Branch**: `002-add-specify-cli` | **Date**: 2026-09-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-add-specify-cli/spec.md`

## Summary

Add the Spec Kit `specify` CLI to the shared workspace image so every normal
workspace user can invoke it without a runtime installation step. The image
will install the CLI with the exact requested uv Git-source command after the
image switches to the existing `node` user. The persistent OpenCode mount will
target only `/home/node/.local/state/opencode`, leaving the image-provided
`/home/node/.local/bin/specify` visible at runtime.

## Technical Context

**Language/Version**: Dockerfile shell instructions; Node.js 24 base image;
Spec Kit package and dependencies resolved by uv from GitHub at build time

**Primary Dependencies**: `uv` copied from `ghcr.io/astral-sh/uv:latest`;
`github/spec-kit` Git repository; existing Docker and Vitest tooling

**Storage**: uv's existing user-local tool environment under `/home/node`;
the host path `~/llm-container_volume/.local/state/opencode` is mounted only at
`/home/node/.local/state/opencode`; no new database or project data model

**Testing**: Vitest Docker image smoke test for `specify --help`, plus existing
TypeScript unit tests, typecheck, and build gates

**Target Platform**: Linux Docker container based on `node:24-slim`, with the
existing configurable positive UID/GID build arguments

**Project Type**: Docker workspace image with a TypeScript CLI

**Performance Goals**: `specify --help` available within 30 seconds after
workspace startup; build time is secondary to successful upstream resolution

**Constraints**: Install from the exact Git source requested by the user; fail
the image build visibly if the upstream source or package cannot be installed;
preserve non-root execution, `/home/node`, and `/home/node/.local/bin` on PATH;
do not mount over the image's `.local` root or `bin` directory

**Scale/Scope**: One shared base image used by all managed workspaces; one new
user-facing command; no runtime updater, project initialization workflow, or
changes to container lifecycle behavior

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The plan passes all constitutional gates:

- **Isolated, Persistent Workspaces**: The existing project and configuration
  mounts remain intact; OpenCode state is narrowed to a dedicated subdirectory
  so image-provided tools are not hidden by a broad `.local` mount.
- **Safe Container Lifecycle**: No lifecycle command, naming rule, or removal
  behavior changes.
- **Non-Root Execution**: Installation runs after `USER node`, uses the existing
  user-local tool location, and runtime verification checks the non-root user.
- **Testable TypeScript Interfaces**: The changed image contract receives a
  focused Docker smoke assertion; existing TypeScript checks remain required.
- **Explicit Compatibility and Attribution**: README documents the command,
  upstream GitHub source, and the revised OpenCode persistence path; supported
  Node, Docker, Vitest, and license behavior remain unchanged.
- **Project Constraints**: The plan preserves Node 24, `/home/node`, positive
  UID/GID remapping, Docker, npm, and Vitest.
- **Development Workflow**: Dockerfile, README, and image tests change together
  and the normal typecheck, test, and build gates remain applicable.

## Project Structure

### Documentation (this feature)

```text
specs/002-add-specify-cli/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── checklists/requirements.md
└── tasks.md             # Generated later by $speckit-tasks
```

No `contracts/` directory is needed: this feature changes the image contents
and adds no application API or service endpoint.

### Source Code (repository root)

```text
Dockerfile
README.md
src/
├── docker.ts
├── main.ts
├── project.ts
└── sessions.ts

tests/
├── docker.test.ts
├── image.test.ts
└── project.test.ts
```

**Structure Decision**: Keep the implementation in the existing root
`Dockerfile`, `README.md`, and `src/docker.ts`. Extend `tests/image.test.ts` and
the Docker argument tests for runtime verification; no application modules or
persistent data models are needed.

## Complexity Tracking

No constitutional violations. The feature adds one upstream Git installation,
narrower OpenCode persistence, and image smoke coverage because the broad
`.local` mount otherwise hides the installed CLI.
