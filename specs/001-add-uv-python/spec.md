# Feature Specification: Add uv and Managed Python to Image

**Feature Branch**: `001-add-uv-python`

**Created**: 2026-09-28

**Status**: Draft

**Input**: User description: "adicionar o uv astral na imagem docker, usando a imagem oficial, instalar o Python padrão mais recente durante o build, permitir uso de uv/uvx e criação explícita de ambientes com uv venv"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Use uv and uvx in a workspace (Priority: P1)

As a coding-agent user, I want `uv` and `uvx` available in every workspace so
that I can run Python tooling and scripts without installing those tools during
each session.

**Why this priority**: Making the requested tools available is the core value of
the feature.

**Independent Test**: Build the image, start a workspace as the normal `node`
user, and run both commands successfully to display their versions or help.

**Acceptance Scenarios**:

1. **Given** a successfully built image, **When** a workspace starts as the
   normal non-root user, **Then** `uv --version` completes successfully.
2. **Given** a successfully built image, **When** a workspace starts as the
   normal non-root user, **Then** `uvx --version` completes successfully.

---

### User Story 2 - Use the managed default Python (Priority: P1)

As a coding-agent user, I want the image to include the latest stable/default
Python selected by uv at build time so that Python commands are immediately
available without an additional installation step.

**Why this priority**: Python availability is the main reason to extend the
image beyond the uv and uvx binaries.

**Independent Test**: Build the image and, as the normal `node` user, verify
that `python --version` and `python3 --version` complete successfully and refer
to the Python installation managed by uv.

**Acceptance Scenarios**:

1. **Given** a successful image build, **When** the normal user runs
   `python --version`, **Then** the command succeeds without a package-manager
   installation step.
2. **Given** a successful image build, **When** the normal user runs
   `python3 --version`, **Then** the command succeeds and resolves to the
   default Python installed by uv.
3. **Given** a newer stable/default Python is available to the selected uv
   release, **When** the image is rebuilt, **Then** the build requests the
   default/latest version rather than a hard-coded Python version.

---

### User Story 3 - Create project environments explicitly (Priority: P2)

As a coding-agent user, I want to create a virtual environment when a project
needs one, while keeping the base image free of an automatically activated
project environment.

**Why this priority**: Different mounted projects may require different Python
versions and dependencies, so environment creation must remain an explicit
project action.

**Independent Test**: In a workspace directory, run `uv venv` as the normal
user and verify that an environment is created without changing the base image
or requiring root privileges.

**Acceptance Scenarios**:

1. **Given** a writable project directory, **When** the user runs `uv venv`,
   **Then** uv creates the requested environment successfully.
2. **Given** the base image has started, **When** the user runs a Python command
   before creating an environment, **Then** no project virtual environment is
   automatically created or activated.

### Edge Cases

- If the official uv image tagged `latest` cannot be retrieved, the image build
  MUST fail clearly rather than silently installing another uv version.
- If uv cannot download its default Python during the image build, the build
  MUST fail clearly and MUST NOT leave a partially configured Python command
  that appears usable.
- The uv and Python executables MUST remain usable by the configured non-root
  user after the image changes its UID and GID through build arguments.
- Rebuilding the image MUST be allowed to obtain newer uv and Python releases;
  reproducibility through pinned version tags is intentionally out of scope.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The image MUST include `uv` and `uvx` from the official Astral uv
  image using the `latest` tag.
- **FR-002**: The image MUST expose both `uv` and `uvx` on the normal user's
  command path.
- **FR-003**: The image build MUST install the latest stable/default Python
  selected by uv without specifying a Python version or package version tag.
- **FR-004**: The image MUST expose the uv-managed default Python through both
  `python` and `python3` commands for the normal user.
- **FR-005**: The image MUST permit the normal user to create a virtual
  environment explicitly with `uv venv` in a writable project directory.
- **FR-006**: The image MUST NOT create, activate, or pre-populate a project
  virtual environment automatically.
- **FR-007**: The image MUST NOT add custom uv cache configuration; uv's default
  cache behavior MUST remain in effect.
- **FR-008**: The existing non-root execution model and configurable positive
  UID/GID behavior MUST continue to work for uv, uvx, and the managed Python.
- **FR-009**: Repository documentation MUST explain that uv and uvx are
  available, Python is selected at build time by uv, virtual environments are
  explicit, and version tags are intentionally not pinned.
- **FR-010**: Automated image verification MUST cover the availability of uv,
  uvx, python, python3, and explicit `uv venv` creation as the normal user.

### Key Entities

- **Container image**: The built workspace image containing uv, uvx, and the
  uv-managed default Python.
- **Managed Python installation**: The Python distribution downloaded and
  maintained by uv during the image build.
- **Project virtual environment**: A project-local environment created only
  when a user explicitly runs `uv venv`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of clean image builds either provide working `uv`, `uvx`,
  `python`, and `python3` commands or fail with a visible build error.
- **SC-002**: A normal user can verify all four commands within 30 seconds after
  a workspace starts, excluding image build and network download time.
- **SC-003**: A normal user can create a project virtual environment with one
  explicit `uv venv` command and no elevated privileges.
- **SC-004**: Rebuilding the image without source changes checks for newer
  available uv and default Python releases instead of being constrained by
  project-maintained version tags.
- **SC-005**: Existing workspace startup and non-root behavior continue to pass
  the repository's automated tests without requiring a Python project in the
  mounted directory.

## Assumptions

- The official Astral uv image remains the source for the uv and uvx binaries;
  the selected source tag is explicitly `latest`.
- “Python padrão/LTS” means the latest stable/default Python selected by the
  installed uv release when no Python version is supplied. No Python version
  is pinned by this feature.
- The existing `node` user remains the only default runtime user.
- Users create and activate project environments according to their project's
  needs; this feature does not define a project dependency workflow.
- The default uv cache behavior is accepted, including its normal location and
  lifecycle.
- Reference: [Using uv in Docker](https://docs.astral.sh/uv/guides/integration/docker/)
  and [Python versions](https://docs.astral.sh/uv/concepts/python-versions/).
