---

description: "Task list for adding Spec Kit without masking it with the OpenCode state mount"
---

# Tasks: Add Spec Kit CLI to Image

**Input**: Design documents from `/specs/002-add-specify-cli/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, and
`quickstart.md`

**Tests**: Required by the feature specification and expanded to reproduce the
real persistent OpenCode mount.

**Organization**: Tasks are grouped by user story so each story can be
implemented and validated independently.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the existing Docker image, mount, and test entry points.

- [X] T001 [P] Verify the current image installation and persistent mount targets in `Dockerfile`, `src/docker.ts`, `README.md`, `tests/image.test.ts`, and `tests/docker.test.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish the scoped persistence contract before story changes.

**⚠️ CRITICAL**: Complete this phase before user-story implementation.

- [X] T002 [P] Define the host-to-container OpenCode state mapping `~/llm_container_volume/.local/state/opencode` → `/home/node/.local/state/opencode` in `specs/002-add-specify-cli/data-model.md` and `specs/002-add-specify-cli/quickstart.md`
- [X] T003 [P] Verify the existing non-root UID/GID and persistent-directory creation behavior in `src/docker.ts` and `tests/docker.test.ts`

**Checkpoint**: The desired mount no longer targets `/home/node/.local` as a
whole, and the image's `/home/node/.local/bin` remains outside the mount.

---

## Phase 3: User Story 1 - Use Spec Kit in a workspace (Priority: P1) 🎯 MVP

**Goal**: Make `specify` available from the standard uv user-local path in a
workspace without a runtime installation step.

**Independent Test**: Build the image and run `specify --help` as the default
non-root user while mounting the scoped OpenCode state directory; verify that
`command -v specify` resolves to `/home/node/.local/bin/specify`.

### Tests for User Story 1

- [X] T004 [US1] Add an image smoke test that mounts a temporary or host-equivalent `/home/node/.local/state/opencode` directory and asserts `id -u`, `command -v specify`, and successful `specify --help` in `tests/image.test.ts`

### Implementation for User Story 1

- [X] T005 [US1] Install `specify-cli` with `uv tool install specify-cli --from git+https://github.com/github/spec-kit.git` after `USER node` in `Dockerfile`, keeping uv's standard `/home/node/.local/bin` destination
- [X] T006 [US1] Document the image-provided `specify` command and upstream source in `README.md`

**Checkpoint**: User Story 1 works with the same scoped mount used by managed
workspaces and the standard `.local/bin` path remains visible.

---

## Phase 4: User Story 2 - Preserve the workspace user model (Priority: P1)

**Goal**: Preserve non-root execution, OpenCode state persistence, and
UID/GID-remapped Spec Kit access without broad `.local` masking.

**Independent Test**: Build with `USER_ID=2000` and `GROUP_ID=2000`, mount the
scoped OpenCode state path, and verify UID 2000 can run `specify --help`.

### Tests for User Story 2

- [X] T007 [US2] Update Docker argument assertions for the scoped OpenCode mount and absence of a broad `/home/node/.local` mount in `tests/docker.test.ts`
- [X] T008 [US2] Extend the remapped UID/GID image test to mount `/home/node/.local/state/opencode` and run `specify --help` as UID 2000 in `tests/image.test.ts`

### Implementation for User Story 2

- [X] T009 [US2] Change `persistentDirectories()` and `buildCreateArgs()` to create and bind `~/llm_container_volume/.local/state/opencode` at `/home/node/.local/state/opencode` in `src/docker.ts`
- [X] T010 [US2] Update the persistent configuration instructions, isolation limits, and migration note for the scoped OpenCode state path in `README.md`

**Checkpoint**: Both P1 stories work independently; the OpenCode state is
persistent while `/home/node/.local/bin/specify` remains image-provided.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Validate all changed contracts and the migration guidance.

- [X] T011 [P] Run `npm run typecheck`, `npm test`, `npm run build`, and `git diff --check` for the Docker, TypeScript, and documentation changes
- [X] T012 [P] Run every scenario in `specs/002-add-specify-cli/quickstart.md`, including the scoped mount, default user, remapped UID/GID, and migration checks

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001 can start immediately.
- **Foundational (Phase 2)**: Depends on T001; T002 and T003 can run in parallel.
- **User Story 1 (Phase 3)**: Depends on the foundational phase. T004 is the test contract and should be added before validating T005; T005 and T006 touch different files and can then proceed in parallel.
- **User Story 2 (Phase 4)**: Depends on the image command from US1 and the scoped mount contract. T007 and T008 are tests; T009 updates the mount implementation; T010 updates user-facing migration guidance.
- **Polish (Phase 5)**: Depends on both user stories.

### User Story Dependencies

- **User Story 1 (P1)**: Depends only on the foundational phase and is the MVP.
- **User Story 2 (P1)**: Depends on US1's `specify` installation but validates the broader managed-workspace mount and UID/GID contract.

### Parallel Opportunities

- T002 and T003 can run in parallel after T001.
- After T004 is specified, T005 and T006 can run in parallel because they edit different files.
- T007 and T008 can be prepared in parallel, then T009 implements the mount behavior they verify.
- T011 and T012 can run in parallel after implementation, using separate validation tags if needed.

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Setup and Foundational phases.
2. Add the Spec Kit installation and scoped-mount smoke test.
3. Validate `specify --help` as the default user.
4. Stop for MVP review or continue to UID/GID and mount contract coverage.

### Incremental Delivery

1. Deliver US1 with the standard `.local/bin` installation path.
2. Deliver US2 by narrowing the OpenCode mount and preserving remapped-user behavior.
3. Run the full project gates and migration quickstart.

## Notes

- Every task follows `- [ ] T### [P?] [US?] description` and includes concrete file paths.
- No API contract tasks are included because the change affects Docker mounts and image runtime behavior only.
- Existing data under the old broad `~/llm_container_volume/.local` path may need migration into `.local/state/opencode`.
