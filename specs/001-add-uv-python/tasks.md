---

description: "Task list for adding uv and managed Python to the workspace image"
---

# Tasks: Add uv and Managed Python to Image

**Input**: Design documents from `/specs/001-add-uv-python/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Organization**: Tasks are grouped by user story. The image smoke test is
implemented incrementally so each story has an explicit validation step.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish the image-level validation entry point.

- [X] T001 [P] Create the Docker image smoke-test file with a temporary image tag, build cleanup, and normal-user command execution helpers in `tests/image.test.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Provide shared validation infrastructure before story-specific
image behavior is added.

**⚠️ CRITICAL**: User story tasks depend on this phase.

- [X] T002 Add image build failure reporting and cleanup handling for failed or completed Docker commands in `tests/image.test.ts`

**Checkpoint**: The image test harness can build the repository image, run
commands as its configured non-root user, and remove the temporary image.

---

## Phase 3: User Story 1 - Use uv and uvx in a workspace (Priority: P1) 🎯 MVP

**Goal**: Make the official `uv` and `uvx` commands available to every
workspace without changing the Node-based image foundation.

**Independent Test**: Build the image and run `uv --version` and
`uvx --version` as the normal non-root user; both commands must succeed.

### Tests for User Story 1

- [X] T003 [US1] Add image assertions for successful `uv --version` and `uvx --version` execution as the normal user in `tests/image.test.ts`

### Implementation for User Story 1

- [X] T004 [US1] Copy `/uv` and `/uvx` from `ghcr.io/astral-sh/uv:latest` into the image and preserve executable ownership in `Dockerfile`

**Checkpoint**: A freshly built image exposes working `uv` and `uvx` commands
without requiring installation during workspace startup.

---

## Phase 4: User Story 2 - Use the managed default Python (Priority: P1)

**Goal**: Replace the distribution Python package with uv's latest default
managed Python and expose it as `python` and `python3` to the normal user.

**Independent Test**: Build the image and run `python --version` and
`python3 --version` as the normal non-root user; both commands must succeed and
resolve to the uv-managed installation.

### Tests for User Story 2

- [X] T005 [US2] Add image assertions for successful `python --version` and `python3 --version` execution and non-root ownership in `tests/image.test.ts`

### Implementation for User Story 2

- [X] T006 [US2] Remove the OS `python3` package from the apt install list, add the uv-managed executable directory to `PATH`, and install the default Python with `uv python install --default` after UID/GID setup in `Dockerfile`
- [X] T007 [US2] Ensure the Python installation command runs in the `node` user context and fails the image build if the default Python download or installation fails in `Dockerfile`

**Checkpoint**: A freshly built image provides uv-managed `python` and
`python3`, remains non-root at runtime, and does not depend on a pinned Python
version.

---

## Phase 5: User Story 3 - Create project environments explicitly (Priority: P2)

**Goal**: Allow users to create project-local environments with `uv venv`
without creating or activating one automatically.

**Independent Test**: Start the image as the normal user, create a writable
temporary project directory, run `uv venv`, and verify `.venv/bin/python` is
executable.

### Tests for User Story 3

- [X] T008 [US3] Add image assertions that `uv venv` creates `.venv/bin/python` in a writable project directory without elevated privileges in `tests/image.test.ts`
- [X] T009 [US3] Add an assertion that starting the image does not create a project `.venv` before the explicit `uv venv` command in `tests/image.test.ts`

### Implementation for User Story 3

- [X] T010 [US3] Verify the Dockerfile does not create, activate, or pre-populate a project virtual environment and does not add custom uv cache configuration in `Dockerfile`

**Checkpoint**: Users can create environments explicitly while the base image
remains project-agnostic and uses uv's default cache behavior.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Document the runtime contract and validate compatibility with the
existing workspace behavior.

- [X] T011 [P] Update the Docker image and persistent configuration sections in `README.md` to document uv, uvx, uv-managed default Python, explicit `uv venv`, default cache behavior, and intentionally unpinned latest versions
- [X] T012 [P] Add a custom positive UID/GID image smoke scenario covering `uv --version` and `python --version` as the remapped non-root user in `tests/image.test.ts`
- [X] T013 Run the scenarios in `specs/001-add-uv-python/quickstart.md` and record any required test-harness adjustments in `tests/image.test.ts`
- [X] T014 Run `npm run typecheck`, `npm test`, and `npm run build` and resolve failures in the affected files before completion

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; creates the shared image-test entry point.
- **Foundational (Phase 2)**: Depends on T001 and blocks user-story validation.
- **User Story 1 (Phase 3)**: Depends on T002; establishes the uv binaries used by later stories.
- **User Story 2 (Phase 4)**: Depends on T004 because Python installation uses the copied uv binary; T005 may be written before T006 but is expected to fail until T006/T007.
- **User Story 3 (Phase 5)**: Depends on T007 because `uv venv` requires both uv and the managed Python; T008/T009 may be written before T010 but are expected to fail until the image is complete.
- **Polish (Phase 6)**: Depends on the desired stories being implemented; T011 and T012 can proceed in parallel with each other after the image contract is stable.

### User Story Dependencies

- **US1 (P1)**: Starts after the foundational test harness; no dependency on another story.
- **US2 (P1)**: Depends on US1's uv binary installation.
- **US3 (P2)**: Depends on US1 and US2 because `uv venv` uses the available uv command and managed Python.

### Parallel Opportunities

- T001 can be developed independently of documentation work.
- T011 and T012 can run in parallel after T010 because they touch different concerns, although T012 extends the shared image test file and should be coordinated with T003/T005/T008/T009.
- Once T014 passes, README review and quickstart reruns can be performed independently.

## Parallel Example: User Story 1

```text
Task: Add image assertions for uv and uvx in tests/image.test.ts
Task: Prepare the Dockerfile change to copy /uv and /uvx from the official latest image
```

These tasks can be prepared in parallel, but the story is complete only after
the Dockerfile change is applied and the image assertions pass together.

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 and Phase 2.
2. Complete User Story 1 by copying the official uv binaries.
3. Run the independent uv/uvx image smoke test.
4. Continue to User Story 2 because the requested feature is not complete until
   managed Python is available.

### Incremental Delivery

1. Establish the image test harness.
2. Add uv and uvx and verify them.
3. Add uv-managed default Python and verify `python`/`python3`.
4. Verify explicit `uv venv` behavior and absence of automatic environments.
5. Update documentation, test custom UID/GID behavior, and run all project gates.

## Notes

- Every task uses the required checklist format with a sequential ID and an
  exact repository path.
- `[P]` is used only where work can proceed without depending on incomplete
  changes in the same file or prerequisite phase.
- No `contracts/` tasks are included because this feature adds no API or CLI
  command contract; it changes the runtime contents of the Docker image.
