# Data Model: Add uv and Managed Python to Image

This feature does not introduce application records or a persistent service
schema. The relevant entities are image/runtime artifacts.

## Container Image

The Docker image used to start every managed project workspace.

Fields and invariants:

- Base environment: existing Node 24 slim image and `/home/node` workdir.
- Included tools: `uv` and `uvx` copied from the official `latest` image.
- Runtime user: configured non-root `node` user with positive build-time UID/GID.
- Python source: uv-managed default/latest stable Python selected during build.
- Commands: `uv`, `uvx`, `python`, and `python3` resolve on `PATH`.
- Cache: uv default behavior; no feature-specific cache path or volume.

## Managed Python Installation

The Python distribution selected and installed by uv during the image build.

Validation rules:

- No explicit Python version is supplied by the image build.
- The installation is owned and usable by the normal runtime user.
- `python` and `python3` point to the uv-managed default installation.
- A failed download fails the image build rather than producing a partial
  apparently usable installation.

## Project Virtual Environment

A project-local environment created by a workspace user with `uv venv`.

Validation rules:

- Creation is explicit and occurs in a writable project directory.
- Creation does not require root privileges.
- The base image does not create or activate one automatically.
- Its dependencies and selected Python version remain project concerns.

## Relationships

```text
Container Image
├── includes ──> uv / uvx binaries
├── includes ──> Managed Python Installation
└── enables ──> Project Virtual Environment (created explicitly by user)
```
