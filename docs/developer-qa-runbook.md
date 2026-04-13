# Developer QA Runbook

Use this before pushing from VS Code.

## Commands
```bash
npm run lint
npm run test
npm run debug
npm run qa
```

## What `npm run debug` checks
- required repo paths and core files
- git status visibility for local changes
- scheme registry JSON parse + validation
- scheme engine smoke execution against bundled registry

## Failure handling
1. Fix missing file/path failures first.
2. Fix schema mismatches in `packages/scheme-registry`.
3. Fix engine failures in `packages/scheme-engine` before API/mobile changes.
4. Re-run `npm run qa` and only then push.
