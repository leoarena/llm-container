# Implementation Plan: Add uv and Managed Python to Image

**Branch**: `001-add-uv-python` | **Date**: 2026-09-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-add-uv-python/spec.md`

## Summary

Extend the workspace image with the official Astral `uv` and `uvx` binaries,
install uv's latest default stable Python during the image build, and expose
`python` and `python3` to the normal `node` user. The implementation will copy
the binaries from `ghcr.io/astral-sh/uv:latest`, remove the distribution
Python package, install the managed Python after UID/GID setup in the `node`
user context, and add the uv executable directory to `PATH`. No project
virtual environment or custom cache configuration will be created.

## Technical Context

**Language/Version**: Dockerfile shell instructions; Node.js 24 base image;
Python version selected by uv at build time without a pinned version

**Primary Dependencies**: `ghcr.io/astral-sh/uv:latest` for `/uv` and `/uvx`;
uv-managed default Python; existing Debian packages and npm tools

**Storage**: uv's default user data and cache locations under `/home/node`;
no new persistent volume or custom cache configuration

**Testing**: Vitest unit tests plus Docker image smoke/integration checks for
`uv`, `uvx`, `python`, `python3`, non-root execution, and explicit `uv venv`

**Target Platform**: Linux Docker container based on `node:24-slim`, including
the repository's configurable positive UID/GID build arguments

**Project Type**: Docker workspace image with a TypeScript CLI

**Performance Goals**: Runtime command availability within 30 seconds of
workspace startup; build performance is secondary to successful latest-version
resolution

**Constraints**: Must run as non-root; must not install Python under `/root`;
must use the mutable `latest` uv tag and unpinned default Python by explicit
product decision; image builds require network access to retrieve uv and Python

**Scale/Scope**: One base image used by all managed project workspaces; no
project dependency synchronization, automatic venv activation, or Python app
runtime is introduced

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The plan passes all constitutional gates:

- **Isolated, Persistent Workspaces**: The feature changes only the shared base
  image and preserves existing project mounts and workspace reuse.
- **Safe Container Lifecycle**: No lifecycle command or container naming logic
  changes.
- **Non-Root Execution**: uv binaries are copied as root but Python is installed
  for the `node` user after UID/GID setup; runtime commands are verified as
  non-root.
- **Testable TypeScript Interfaces**: Existing Vitest tests remain required;
  image behavior gets focused smoke coverage without changing CLI contracts.
- **Explicit Compatibility and Attribution**: README documentation will state
  uv/Python behavior and the intentional lack of version pinning; upstream uv
  usage is linked.
- **Project Constraints**: Node 24, `/home/node`, configurable positive UID/GID,
  existing npm/Vitest tooling, and BSD licensing remain unchanged.
- **Development Workflow**: Dockerfile, documentation, and tests are updated
  together; `npm run typecheck`, `npm test`, and `npm run build` remain gates.

## Project Structure

### Documentation (this feature)

```text
specs/001-add-uv-python/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── checklists/requirements.md
```

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
├── project.test.ts
└── image.test.ts
```

**Structure Decision**: Keep the implementation in the existing root
`Dockerfile` and README. Add image-level verification beside the existing
Vitest tests; no new application modules, API contracts, or persistent data
models are needed.

## Complexity Tracking

No constitutional violations. The feature adds one external image source and
one image smoke-test path because both are required to verify the requested
runtime behavior; the existing CLI and lifecycle architecture remain unchanged.
