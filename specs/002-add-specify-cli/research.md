# Research: Add Spec Kit CLI to Image

## Decision 1: Install from the exact upstream Git source

**Decision**: Use `uv tool install specify-cli --from
git+https://github.com/github/spec-kit.git` in the image build.

**Rationale**: This is the installation source and command explicitly requested
by the feature. It keeps the image aligned with the upstream Spec Kit project
and makes a failed source resolution fail the build instead of silently
omitting the tool.

**Alternatives considered**:

- Installing a published package from a package index was rejected because it
  would not satisfy the requested Git repository source.
- Installing at workspace startup was rejected because every workspace should
  have the command immediately and runtime installation would add network and
  permission requirements.

## Decision 2: Install after switching to the existing `node` user

**Decision**: Keep the installation after `USER node`, using the existing
`/home/node/.local/bin` entry in `PATH`.

**Rationale**: uv installs the tool into the invoking user's tool environment.
Installing as `node` makes `specify` available to the same non-root user that
operates the workspace and preserves the configurable UID/GID model. A build
of the current Dockerfile resolved and installed `specify-cli` and reported
`Installed 1 executable: specify`.

**Alternatives considered**:

- Installing as root into a system directory was rejected because it weakens
  the image's user-local and non-root design.
- Adding a separate system-wide PATH or wrapper was rejected because the
  existing user-local PATH already covers uv tools.

## Decision 3: Verify the runtime command in the image smoke test

**Decision**: Add an image test that runs `id -u; specify --help` and checks
that the default user remains UID 1000 and help output is returned.

**Rationale**: The feature's contract is an image/runtime contract, not a new
TypeScript API. A runtime check catches missing PATH entries, wrong ownership,
and package installations that do not expose the expected executable.

**Alternatives considered**:

- Checking only the Dockerfile text was rejected because it cannot prove the
  executable is installed or runnable.
- Adding a new application wrapper was rejected because it would duplicate the
  upstream CLI and expand the public surface unnecessarily.

## Decision 4: Preserve the existing version-refresh behavior

**Decision**: Do not pin a commit, package version, or separate update command.
Rebuilding the image resolves the current state of the upstream Git repository.

**Rationale**: The user requested installation from the repository URL itself,
and the existing image already refreshes other upstream tools during rebuilds.
The build remains reproducible for a given upstream resolution while allowing
the image to receive future Spec Kit updates on rebuild.

**Alternatives considered**:

- Pinning a commit was rejected because no pin was requested and it would make
  refreshes require source edits.

## Decision 5: Mount only OpenCode state below `.local`

**Decision**: Change the persistent host mapping from the entire
`~/llm_container_volume/.local` directory to
`~/llm_container_volume/.local/state/opencode`, mounted at
`/home/node/.local/state/opencode`.

**Rationale**: Docker bind mounts hide the image contents at their destination.
Mounting the entire `/home/node/.local` directory masks the user-local
`/home/node/.local/bin/specify` installed by uv. Mounting only the OpenCode
state subdirectory preserves the image's `.local/bin` while retaining the
state that OpenCode needs across workspaces.

**Alternatives considered**:

- Installing Spec Kit outside `.local` was rejected for this plan because the
  requested behavior is to keep uv's standard user-local installation path.
- Keeping the broad `.local` bind mount was rejected because it makes the
  image-provided CLI unavailable unless the host directory is manually
  pre-populated.
- Replacing the bind mount with a Docker-managed volume was rejected because
  the project currently documents host-persistent configuration paths and the
  requested mapping is explicit and inspectable.

**Migration note**: Existing data under `~/llm_container_volume/.local` should
be moved to `~/llm_container_volume/.local/state/opencode` before using the
narrowed mount if it represents OpenCode state. Other files previously stored
under the broad `.local` mount will no longer be mounted automatically.
