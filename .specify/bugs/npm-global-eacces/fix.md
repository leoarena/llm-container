# Bug Fix: npm global install fails with EACCES

- **Slug**: npm-global-eacces
- **Fixed**: 2026-10-03T09:37:00-03:00
- **Assessment**: ./assessment.md
- **Status**: applied

## Summary

The image now installs `opencode-ai` and `@openai/codex` as the non-root
`node` user into `/home/node/.local`, which is writable at runtime. npm uses
that same prefix for later global updates, avoiding rename failures under the
root-owned `/usr/local/lib/node_modules` directory.

## Changes

| File | Change | Notes |
|------|--------|-------|
| `Dockerfile` | modified | Set `NPM_CONFIG_PREFIX=/home/node/.local` and moved the npm tool installation after `USER node`. |
| `README.md` | modified | Documented non-root update commands and the image/container update lifecycle. |
| `tests/image.test.ts` | modified | Added a smoke assertion for the user-writable npm prefix and `codex` executable. |

## Diff Highlights

The Docker image now has:

```dockerfile
ENV NPM_CONFIG_PREFIX=/home/node/.local
...
USER node
RUN npm i -g opencode-ai && npm i -g @openai/codex
```

## Tests Added or Updated

- `tests/image.test.ts::provides npm agent tools in a user-writable global prefix` — verifies the non-root UID, npm prefix, write access, and `/home/node/.local/bin/codex` path.

## Local Verification

- `npm run typecheck` → passed.
- `npx vitest run tests/docker.test.ts tests/project.test.ts` → passed, 2 files and 11 tests.
- `npm run build` → passed.
- `git diff --check` → passed.
- Docker image smoke tests were not run; they require a Docker build and external package/network access.

## Deviations from Assessment

The assessment listed image-managed installation as the preferred option, with
user-local installation when runtime updates are required. This fix selects the
user-local path because the reported failure is a runtime `npm install -g`
operation and the remediation preserves that workflow without requiring root.

## Follow-ups

- Run `npm test` or the image smoke test in an environment with Docker and
  network access to validate the complete image build.
- Rebuild existing images or recreate managed containers to consume the new
  user-local installation layout.
