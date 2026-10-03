# Bug Verification: npm global install fails with EACCES

- **Slug**: npm-global-eacces
- **Tested**: 2026-10-03T09:40:00-03:00
- **Assessment**: ./assessment.md
- **Fix**: ./fix.md
- **Result**: verified

## Summary

The static fix and local regression checks passed: npm is configured for the
user-writable `/home/node/.local` prefix and the image installs the tools after
switching to `node`. The user also confirmed that the manual
`npm install -g @openai/codex` execution succeeded after the fix.

## Checks Performed

| Check | Command / Action | Result | Notes |
|-------|------------------|--------|-------|
| Reproduction (post-fix) | Manual `npm install -g @openai/codex` as `node` | pass | User confirmed the update completed successfully without `EACCES`. |
| New / updated tests | `tests/image.test.ts` smoke test | skipped | The test is part of the Docker image suite and would trigger the same external image build. |
| Regression suite | `npx vitest run tests/docker.test.ts tests/project.test.ts` | pass | 2 files and 11 tests passed. |
| Lint / type-check | `npm run typecheck` | pass | TypeScript completed successfully. |
| Build | `npm run build` | pass | Compilation and executable permission step completed. |
| Diff integrity | `git diff --check` | pass | No whitespace errors. |
| Docker availability | `docker info` | pass | Docker Engine is available, but no image build was started. |

## Output Excerpts

- `Test Files 2 passed (2)`
- `Tests 11 passed (11)`
- `npm run typecheck` exited 0.
- `npm run build` exited 0.
- `docker info` reported Docker Engine 29.7.2.
- User confirmation: manual Codex global installation completed successfully.

## Residual Risks

- Existing containers created from the old image retain the old root-owned
  installation and must be recreated or updated from a rebuilt image.

## Recommendation

Close the bug — the local checks and the manual runtime update both passed
without reproducing `EACCES`.
