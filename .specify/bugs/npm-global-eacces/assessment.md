# Bug Assessment: npm global install fails with EACCES

- **Slug**: npm-global-eacces
- **Created**: 2026-10-03T00:00:00-03:00
- **Source**: pasted text
- **Verdict**: valid
- **Severity**: medium

## Report (verbatim or summarized)

Running `npm install -g @openai/codex` fails with `EACCES` while npm tries to
rename `/usr/local/lib/node_modules/@openai/codex` to a temporary sibling path.
The npm log is at `/home/node/.npm/_logs/2026-09-30T12_58_16_010Z-debug-0.log`.

## Symptom

The command cannot update an existing global `@openai/codex` installation. The
expected behavior is either a successful update by the supported runtime user,
or clear documentation that global package updates must happen during the image
build with elevated permissions.

## Reproduction

1. Build or start the repository's Docker image, which installs `@openai/codex`
   globally before switching to the `node` user.
2. In the running container, execute `npm install -g @openai/codex` as the
   default non-root user.
3. npm attempts to rename the existing package under
   `/usr/local/lib/node_modules/@openai/` and returns `EACCES`.

The exact container/image tag and the output of `id`, `npm config get prefix`,
and `ls -ld /usr/local/lib/node_modules/@openai /usr/local/lib/node_modules/@openai/codex`
are [NEEDS CLARIFICATION] for a direct reproduction of the reported environment.

## Suspected Code Paths

- `Dockerfile:17-18` — installs `opencode-ai` and `@openai/codex` globally while
  the Docker build is running as root, placing the package under the system npm
  prefix `/usr/local/lib/node_modules`.
- `Dockerfile:20-34` — remaps the `node` account and switches the image to
  `USER node`; this user does not own the previously installed system package or
  its parent directory.
- `README.md:129-139` — documents the non-root runtime and persistent user
  directories, but does not document a supported mechanism for updating the
  system-global npm tools.

No application TypeScript path handles npm installation or permissions; this
is an image/runtime configuration issue.

## Root Cause Hypothesis

High confidence: npm is using the system prefix `/usr/local`, and the existing
`@openai/codex` directory was created by the root-owned Dockerfile install.
Updating a package is not merely a file write: npm first renames the current
package to a temporary sibling (`.codex-vdnmINeK`), which requires write access
to `/usr/local/lib/node_modules/@openai`. The non-root `node` user cannot perform
that rename, producing `errno -13` (`EACCES`). This is expected Unix permission
behavior, exposed as a user-facing bug if runtime updates are expected.

## Proposed Remediation

**Preferred**: Treat the globally installed CLIs as image-managed dependencies.
Document that `@openai/codex` and `opencode-ai` are updated by rebuilding the
image, and add a documented rebuild/update workflow (for example, rebuild with
the relevant Docker target and pull the resulting image). If the desired
contract is that the normal user can update Codex at runtime, change the image
to install it into a user-writable prefix such as `/home/node/.local` after
`USER node`, add that directory's npm bin path to `PATH`, and avoid relying on
the root-owned `/usr/local` installation.

**Alternatives**:

- Run `npm install -g @openai/codex` as root inside the container. This resolves
  the immediate error but weakens the non-root workflow and is unsuitable as a
  normal runtime instruction.
- Configure a per-user npm prefix and install/update the package there. This
  supports runtime updates, but requires migration or cleanup of the existing
  system-global copy and explicit PATH precedence rules.

**Files likely to change**:

- `Dockerfile`
- `README.md`
- `tests/image.test.ts`
- `tests/docker.test.ts` (only if Docker command construction or runtime
  assumptions are changed)

**Tests to add or update**:

- Verify that the supported update/install workflow is executable by the
  configured non-root user.
- If user-local installation is selected, build the image and assert that npm's
  effective prefix and the Codex executable resolve under `/home/node`, while
  `id -u` remains non-root.
- If image-managed installation is selected, add a smoke/documentation check
  that the image contains the expected CLI and that runtime instructions do not
  attempt a system-global update as `node`.

## Risks & Considerations

- Installing into a user-local prefix can leave two Codex copies visible; PATH
  ordering must make the supported copy unambiguous.
- Rebuilding the image changes the update lifecycle and may require users to
  recreate containers to consume a newer CLI.
- Running package installation as root is an operational workaround, not a fix
  for non-root runtime compatibility.
- The exact ownership and npm prefix should be confirmed in the reported
  container before selecting between image-managed and user-local installation.

## Open Questions

- [NEEDS CLARIFICATION: Was the command run inside this repository's container,
  on the host, or in another image?]
- [NEEDS CLARIFICATION: Should Codex be updated only by rebuilding the image, or
  must the default non-root user be able to update it at runtime?]
- [NEEDS CLARIFICATION: What are the ownership and permissions of the reported
  `/usr/local/lib/node_modules/@openai` directory?]
