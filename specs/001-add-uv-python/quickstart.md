# Quickstart: Validate uv and Managed Python

This guide validates the feature end to end. It assumes Docker is installed,
the daemon is running, and commands are executed from the repository root.

## 1. Build the image

Use a temporary validation tag and pass the normal default UID/GID:

```bash
docker build --no-cache \
  --build-arg USER_ID="$(id -u)" \
  --build-arg GROUP_ID="$(id -g)" \
  -t llm-container-uv-validation .
```

Expected result: the build succeeds after retrieving `uv:latest` and uv's
default managed Python. A failure to retrieve either dependency must fail the
build.

## 2. Verify runtime commands as the image user

```bash
docker run --rm llm-container-uv-validation sh -lc \
  'id -u; id -un; uv --version; uvx --version; python --version; python3 --version'
```

Expected results:

- The user is non-root and is the configured `node` user.
- `uv` and `uvx` print versions successfully.
- `python` and `python3` print the same uv-managed default Python version.

## 3. Verify explicit virtual-environment creation

```bash
docker run --rm llm-container-uv-validation sh -lc \
  'tmpdir="$(mktemp -d)" && cd "$tmpdir" && uv venv && test -x .venv/bin/python'
```

Expected result: `uv venv` creates `.venv` as the normal user without elevated
privileges. The base image does not create a project environment before this
command.

## 4. Verify the existing project checks

```bash
npm run typecheck
npm test
npm run build
```

Expected result: all existing TypeScript checks pass. Image smoke checks may
require Docker and network access; they must use the same non-root runtime
conditions as the commands above.

## 5. Verify custom UID/GID compatibility

```bash
docker build --no-cache \
  --build-arg USER_ID=2000 \
  --build-arg GROUP_ID=2000 \
  -t llm-container-uv-validation-custom .
docker run --rm llm-container-uv-validation-custom sh -lc \
  'test "$(id -u)" = 2000 && uv --version && python --version'
```

Expected result: the configured non-root user can run uv and the managed
Python after the image adjusts the `node` UID/GID.
