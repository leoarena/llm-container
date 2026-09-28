# Research: Add uv and Managed Python to Image

## Decision 1: Copy uv binaries from the official `latest` image

**Decision**: Copy `/uv` and `/uvx` from
`ghcr.io/astral-sh/uv:latest` into the workspace image.

**Rationale**: This preserves the existing `node:24-slim` base and non-root
runtime while using the official distribution mechanism requested by the user.
The Docker integration guide documents copying these binaries from the official
uv image. The `latest` tag is intentional and allows rebuilds to receive newer
uv releases.

**Alternatives considered**:

- Using a uv-derived base image was rejected because it would replace the
  existing Node-based workspace foundation.
- Running the installer was rejected because the requested source is the
  official image and the installer adds an additional download/install path.
- Pinning a version or digest was rejected by explicit product decision.

## Decision 2: Install Python with `uv python install --default`

**Decision**: Remove the OS `python3` package from the apt package list and run
uv's default Python installation with the `--default` option after the image's
UID/GID adjustment, in the `node` user context.

**Rationale**: uv documents that `uv python install` without a target installs
the latest available managed Python for that uv release. The `--default`
option additionally exposes `python` and `python3`. Installing after the
UID/GID change and in the runtime user's context ensures the managed data and
executables belong to `node`, rather than being placed under `/root`.

**Alternatives considered**:

- Keeping apt's `python3` was rejected because it conflicts with the requested
  uv-managed default and can cause uv to discover a system interpreter first.
- Pinning a Python version was rejected because the user explicitly requires
  the latest/default version at each build.
- Creating a virtual environment during the build was rejected because users
  must create environments explicitly per project.

## Decision 3: Expose the user-local executable directory

**Decision**: Add the uv-managed executable directory under `/home/node` to
the image `PATH` for the normal user.

**Rationale**: uv installs default Python executables into a user-local bin
directory. An explicit `PATH` entry makes `python` and `python3` available in
non-interactive commands and in the workspace shell without requiring shell
activation.

**Alternatives considered**:

- Relying on shell startup files was rejected because the CLI and automated
  checks must work in non-interactive invocations too.
- Installing executables globally was rejected because it weakens ownership and
  conflicts with the non-root image model.

## Decision 4: Preserve uv's default cache behavior

**Decision**: Do not set `UV_CACHE_DIR`, add cache mounts, or introduce a new
persistent volume.

**Rationale**: The user explicitly selected uv's default cache behavior. The
feature is about runtime availability, not build-cache optimization.

**Alternatives considered**:

- A custom cache directory or Docker cache mount was deferred because it would
  change persistence and build behavior beyond the requested scope.

## Decision 5: Validate the image as the normal user

**Decision**: Add image-level checks for `uv`, `uvx`, `python`, `python3`, and
`uv venv`, while retaining existing unit tests for the TypeScript CLI.

**Rationale**: The requested behavior is primarily an image/runtime contract;
source-level tests cannot prove binary availability, ownership, or Python
installation placement. The smoke checks must use the image's configured
non-root user and a writable temporary project directory.

**Alternatives considered**:

- Only testing Dockerfile text was rejected because it cannot prove the image
  builds or commands execute.
- Requiring a Python project or lockfile was rejected because the base image is
  project-agnostic and the feature does not add dependency synchronization.

## Sources

- [Using uv in Docker](https://docs.astral.sh/uv/guides/integration/docker/)
- [Python versions](https://docs.astral.sh/uv/concepts/python-versions/)
- [uv storage](https://docs.astral.sh/uv/reference/storage/)
