# Feature Specification: Add Spec Kit CLI to Image

**Feature Branch**: `002-add-specify-cli`

**Created**: 2026-09-29

**Status**: Draft

**Input**: User description: "adicionar o spec kit à imagem do projeto; instalar do repo no github `uv tool install specify-cli --from git+https://github.com/github/spec-kit.git`"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Use Spec Kit in a workspace (Priority: P1)

As a coding-agent user, I want the Spec Kit command-line tool available in each
workspace so that I can create and manage feature specifications immediately
after starting the container.

**Why this priority**: Availability of the requested CLI is the complete value
of this feature and removes a repeated installation step from every workspace.

**Independent Test**: Build the project image, start it as the configured
normal user, and run `specify --help` successfully.

**Acceptance Scenarios**:

1. **Given** a successfully built project image, **When** the normal workspace
   user runs `specify --help`, **Then** the command exits successfully and
   displays Spec Kit help information.
2. **Given** a workspace started with the default image user, **When** the user
   invokes `specify`, **Then** the command is found without an additional
   installation or path configuration step.

### User Story 2 - Preserve the workspace user model (Priority: P1)

As a project owner, I want Spec Kit installed for the existing normal user so
that adding the tool does not weaken the image's non-root execution model.

**Why this priority**: The image must remain safe and compatible with existing
workspace permissions while adding the new tool.

**Independent Test**: Run the image with its default user and verify that the
Spec Kit command works while the process remains non-root.

**Acceptance Scenarios**:

1. **Given** the default image configuration, **When** the user runs `id -u`
   and `specify --help`, **Then** the user is non-root and the command works.
2. **Given** the image is rebuilt with a supported positive user ID, **When**
   the configured user invokes Spec Kit, **Then** the command remains
   available to that user.

### Edge Cases

- If the upstream GitHub repository cannot be reached during an image build,
  the build MUST fail visibly rather than produce an image without the
  requested CLI.
- If the CLI installation does not expose a `specify` command, the image
  verification MUST fail and identify the missing command.
- The installation MUST not require the workspace to run as root at runtime.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The project image MUST include the Spec Kit CLI command `specify`.
- **FR-002**: The image build MUST install the CLI from the GitHub repository
  `https://github.com/github/spec-kit.git` using the provided uv tool command.
- **FR-003**: The `specify` command MUST be available on the normal user's
  command path when a workspace starts.
- **FR-004**: The image MUST install the CLI for the existing non-root workspace
  user and MUST preserve the configured positive UID/GID behavior.
- **FR-005**: Automated image verification MUST confirm that the normal user
  can invoke `specify --help` successfully.
- **FR-006**: Project documentation MUST explain that the image includes Spec
  Kit and identify its upstream installation source.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of clean image builds either include a working `specify`
  command or fail with a visible installation error.
- **SC-002**: A normal user can invoke `specify --help` within 30 seconds after
  a workspace starts, excluding image build and network download time.
- **SC-003**: The Spec Kit command is available without a runtime installation
  step in every workspace created from the image.
- **SC-004**: Existing non-root workspace behavior remains successful after the
  CLI is added, including image verification for the configured default user.

## Assumptions

- The package installed by the supplied uv command exposes the executable name
  `specify`.
- The existing `/home/node/.local/bin` path remains the normal user's command
  path and is suitable for uv-managed tools.
- The upstream repository remains reachable during image builds and continues
  to support installation through uv's Git source syntax.
- Updating the image is the mechanism for refreshing the CLI; the feature does
  not add a runtime self-update workflow.
