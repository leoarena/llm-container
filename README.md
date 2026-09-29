# LLM Container

Persistent, isolated Docker workspaces for LLM coding agents. Each project gets
its own container and reuses it between sessions.

## Requirements

- Docker Engine with a running daemon and the `docker` CLI available to the
  current user
- Node.js `^20.19.0` or `>=22.12.0`
- npm, used to install dependencies and link the local CLI

## How to use

### 1. Install the local CLI

The CLI is linked from this checkout and is not published to npm:

```bash
npm install
npm run install-local
```

### 2. Build the image

UID and GID 1000 are used by default:

```bash
llm-container build
```

The command builds the Dockerfile from this checkout without using the build
cache. To match a host user with a different UID or GID, build manually:

```bash
docker build --no-cache \
  --build-arg USER_ID="$(id -u)" \
  --build-arg GROUP_ID="$(id -g)" \
  -t llm-container-image .
```

The UID and GID are fixed in the image. Rebuild it when using the image for a
host user with different IDs.

### Python tooling

The image includes `uv` and `uvx` from the official Astral uv image. During
each image build, uv installs its latest stable/default managed Python and
exposes it as `python` and `python3`. The uv image and Python versions are
intentionally not pinned, so rebuilding can retrieve newer releases.

Project virtual environments are created explicitly inside a workspace:

```bash
uv venv
source .venv/bin/activate
```

The image does not create or activate a project virtual environment
automatically and does not configure a custom uv cache. Use uv's normal
commands such as `uv run`, `uv pip`, and `uvx` according to the mounted
project's needs. Python and project environments are available to the normal
non-root user.

The image also includes the Spec Kit `specify` CLI. It is installed for the
normal user from the upstream GitHub repository during the image build:

```bash
specify --help
```

Rebuild the image to refresh the CLI from the repository's current state.

### 3. Start a workspace

```bash
cd ~/projects/my-api
llm-container
```

The project is mounted at `/home/node/my-api`. Its container is named
`llm-container-my-api-<path-hash>`, avoiding collisions between projects with
the same directory name. It stops after the last session and is started and
reused the next time.

Run commands directly or target a different project:

```bash
llm-container opencode
llm-container codex
llm-container run /path/to/project
llm-container run /path/to/project -- codex
```

Manage workspaces:

```bash
llm-container list
llm-container stop /path/to/project
llm-container remove /path/to/project
llm-container remove /path/to/project --force
```

`stop` and `remove` derive the container name from an existing project path. If
that path has been moved or deleted, use `llm-container list` to find the
managed container name, then run `docker stop <container-name>` or
`docker rm <container-name>` directly as appropriate.

### Persistent configuration

The CLI creates these directories automatically when it creates a container.
Creating them in advance is optional, for example to inspect or set their
permissions before first use:

```bash
mkdir -p \
  ~/llm_container_volume/.codex \
  ~/llm_container_volume/.config/opencode \
  ~/llm_container_volume/.local/state/opencode
```

If these directories were previously used by the root-based image, migrate
their ownership once:

```bash
sudo chown -R "$(id -u):$(id -g)" ~/llm_container_volume
```

The supplied image runs as `node`, with UID and GID 1000 by default. Before
creating or reusing a workspace, the CLI reads Docker's `.Config.User` string
and rejects an empty value, `root`, `0`, or a value beginning with `0:`. It does
not resolve a named user to that user's effective UID inside a custom image.

### Isolation limits

The container is a workspace boundary, not a sandbox for untrusted code. The
project, `~/.codex`, `~/.config/opencode`, and
`~/.local/state/opencode` are bind-mounted read-write. The image's remaining
`/home/node/.local` content, including user-local tools such as `specify`, is
not replaced by the OpenCode state mount. Processes in the container can
modify or delete mounted contents and can access any credentials stored there.
Container networking is not disabled,
so those processes can also make network connections and potentially transmit
mounted data.

`llm-container build` does not replace existing containers and prints a
warning when managed containers exist. Remove a project's container before
reopening it to use the rebuilt image. Removing a container does not delete the
project or mounted configuration directories.

## Attribution

Portions of project-path resolution, deterministic container naming,
bind-mounts, and the Docker inspect/start/stop/exec lifecycle were adapted from
[aerovato/container](https://github.com/aerovato/container), Copyright (c)
2026, kevinMEH, under the BSD 3-Clause License. Session tracking by PID and
locks, non-root checks, project labels, and the surrounding CLI commands are
`llm-container` implementations. See
[`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) for the complete upstream
notice and license terms.

## License

This project is licensed under the BSD 3-Clause License. See
[`LICENSE.md`](LICENSE.md).
