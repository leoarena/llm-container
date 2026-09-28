<!--
Sync Impact Report
- Version change: unversioned scaffold -> 1.0.0
- Modified principles: none; all five principle slots were populated.
- Added sections: Project Constraints; Development Workflow.
- Removed sections: none.
- Follow-up TODOs: confirm the original ratification date.
-->

# LLM Container Constitution

## Core Principles

### I. Isolated, Persistent Workspaces

The project MUST provide one reusable Docker workspace per host project. A
workspace MUST mount the project and documented persistent configuration paths,
and its managed name MUST prevent collisions between projects with the same
directory name. The container boundary MUST be documented as a workspace
boundary rather than a security sandbox because mounted data and network access
remain available to processes inside it. This preserves session continuity while
making the security trade-off explicit.

### II. Safe Container Lifecycle

Commands that build, start, stop, list, or remove workspaces MUST operate only
on deterministically identified managed containers and MUST avoid silently
replacing an existing container. Removal MUST require an explicit force option
when the operation could discard an active workspace, and failures MUST report
the affected project or container clearly. This prevents accidental loss of
state and makes lifecycle operations auditable.

### III. Non-Root Execution

The supplied image MUST run as a non-root user, defaulting to the documented
UID and GID, and the CLI MUST reject images whose configured user is empty,
root, UID `0`, or a value beginning with `0:`. Any custom-image limitation in
user resolution MUST be documented. This reduces the impact of processes that
modify mounted project or configuration data.

### IV. Testable TypeScript Interfaces

Application behavior MUST be implemented in TypeScript with strict compiler
validation and MUST remain covered by automated tests for project resolution,
Docker lifecycle behavior, and any changed public command contract. Changes
MUST pass the repository's typecheck and test commands before integration.
Tests MUST isolate external Docker effects behind testable boundaries where
practical, so deterministic logic can be verified without a running daemon.

### V. Explicit Compatibility and Attribution

The project MUST declare its supported Node.js versions, package license, CLI
usage, operational limitations, and upstream attributions in repository
documentation. A behavior change that affects command usage, container naming,
mounts, image requirements, or removal semantics MUST update the relevant
documentation and tests in the same change. This keeps operators informed and
protects the legal and operational expectations of users.

## Project Constraints

The implementation MUST remain compatible with the declared Node.js engine
range (`^20.19.0 || >=22.12.0`) and use the repository's TypeScript, npm,
Docker, and Vitest toolchain unless a constitution amendment approves a change.
The default image MUST use `/home/node` as its work directory and MUST preserve
the documented UID/GID behavior. Persistent host paths and their permissions
MUST be described before users are asked to run the CLI. The BSD 3-Clause
license and complete third-party notices MUST remain present.

## Development Workflow

Every feature or defect fix MUST identify its affected command, lifecycle state,
or public contract before implementation. The change MUST include or update
focused tests, documentation when user-visible behavior changes, and a review
of isolation and non-root implications. The quality gate is `npm run typecheck`
followed by `npm test`; `npm run build` MUST also pass for changes affecting
packaging, the executable entry point, or Docker usage. Reviewers MUST reject
changes that weaken these gates without a documented constitutional amendment.

## Governance

This constitution governs repository-level engineering decisions and supersedes
conflicting informal practices. Amendments MUST be made in a reviewed change
that states the reason, affected principles, compatibility impact, and any
required migration or documentation work. The amendment MUST update the sync
impact report and dates, and MUST pass the same applicable quality gates as
ordinary changes.

Versioning follows semantic versioning: MAJOR for backward-incompatible
governance changes or removals, MINOR for new or materially expanded principles
or sections, and PATCH for clarifications and non-semantic wording changes.
Every pull request or equivalent review MUST check compliance with this
constitution, especially isolation, lifecycle safety, non-root execution,
testing, and documentation. Unresolved violations MUST be recorded and
explicitly accepted by the project owner before integration.

**Version**: 1.0.0 | **Ratified**: TODO(RATIFICATION_DATE): confirm original adoption date | **Last Amended**: 2026-09-28
