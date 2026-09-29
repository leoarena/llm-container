# Quickstart: Validate Spec Kit CLI in the Image

This guide validates the feature end to end. Run it from the repository root
with Docker installed, a running daemon, and network access to GitHub.

## 1. Build the image

```bash
docker build --no-cache \
  --build-arg USER_ID="$(id -u)" \
  --build-arg GROUP_ID="$(id -g)" \
  -t llm-container-specify-validation .
```

Expected result: the build succeeds after resolving the upstream Git source and
reports an installed `specify` executable. If the source or package cannot be
installed, the build fails visibly.

## 2. Verify the CLI as the normal user

```bash
docker run --rm llm-container-specify-validation sh -lc \
  'id -u; id -un; command -v specify; specify --help'
```

Expected results:

- The process is the configured non-root user (`node`, UID 1000 by default).
- `command -v specify` resolves to `/home/node/.local/bin/specify`.
- `specify --help` exits successfully and prints Spec Kit help.

## 3. Verify the persistent OpenCode mount does not mask Spec Kit

```bash
mkdir -p ~/llm_container_volume/.local/state/opencode
docker run --rm \
  --mount "type=bind,src=$HOME/llm_container_volume/.local/state/opencode,dst=/home/node/.local/state/opencode" \
  llm-container-specify-validation sh -lc \
  'test -x /home/node/.local/bin/specify && command -v specify && specify --help >/dev/null'
```

Expected result: the OpenCode state is mounted and `specify` remains available
from the image's normal user-local bin directory.

## 4. Verify the existing project gates

```bash
npm run typecheck
npm test
npm run build
```

Expected result: type checking, tests, and the build pass. The image smoke
test requires Docker and network access and uses the same non-root runtime
conditions as the manual command above.

## 5. Verify a remapped non-root user

```bash
docker build --no-cache \
  --build-arg USER_ID=2000 \
  --build-arg GROUP_ID=2000 \
  -t llm-container-specify-validation-custom .
docker run --rm llm-container-specify-validation-custom sh -lc \
  'test "$(id -u)" = 2000 && specify --help'
```

Expected result: the remapped non-root user can invoke `specify` without a
runtime installation step.
