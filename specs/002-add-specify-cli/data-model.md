# Data Model: Add Spec Kit CLI to Image

This feature does not introduce application records or a persistent data
schema. Its relevant entities are image and runtime artifacts.

## Workspace Image

The Docker image used to start each managed project workspace.

Attributes:

- Existing Node 24 slim base and `/home/node` work directory.
- Existing non-root `node` user with configurable positive UID/GID.
- Existing `/home/node/.local/bin` command path.
- A user-local Spec Kit tool installation obtained from the upstream Git source.
- A scoped OpenCode state mount at `/home/node/.local/state/opencode`.

Validation rules:

- The image build fails if the upstream source cannot be resolved or installed.
- The image retains the existing non-root runtime user and UID/GID behavior.
- The OpenCode mount MUST NOT replace `/home/node/.local` or
  `/home/node/.local/bin`.

## Spec Kit CLI Installation

The uv-managed tool installation that exposes the `specify` executable.

Attributes:

- Package name: `specify-cli`.
- Source: `https://github.com/github/spec-kit.git`.
- Installation owner: the image's normal `node` user.
- Executable: `specify`.
- Lifecycle: installed at image build time and refreshed by rebuilding the
  image; no runtime self-update is defined.

Relationships:

- The Workspace Image contains one Spec Kit CLI Installation.
- Each workspace created from the image consumes the same image-provided
  executable without installing a separate copy at startup.

## Runtime Command Contract

The user-visible command contract for this feature is:

| Command | Preconditions | Expected result |
|---|---|---|
| `specify --help` | Workspace started from the built image | Exits successfully and displays Spec Kit help |

The command must be discoverable through the normal user's `PATH` and runnable
without elevated privileges.

## Persistent OpenCode State

| Host path | Container path | Purpose |
|---|---|---|
| `~/llm_container_volume/.local/state/opencode` | `/home/node/.local/state/opencode` | Persist OpenCode state without masking image-provided user tools |

The parent `/home/node/.local` remains part of the image filesystem. In
particular, `/home/node/.local/bin/specify` remains visible when the scoped
state mount is present.
