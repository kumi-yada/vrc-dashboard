---
description: Bump the version tag on the current commit and push commits + tag to trigger a release build. Usage: [patch|minor|major|vX.Y.Z] (default: patch)
---

Cut a new release of vrc-dashboard. A release is triggered purely by pushing a
`v*` tag — `.github/workflows/release.yml` fires on tag push and `update-version.js`
rewrites `package.json`, `src-tauri/Cargo.toml` and `src-tauri/tauri.conf.json`
from `GITHUB_REF_NAME` inside CI. **Do not edit version files locally and do not
create a version-bump commit.**

Bump requested: `$1` (if empty, use `patch`).

## Steps

1. **Check state** — run these and read the output:
   - `git rev-parse --abbrev-ref HEAD` — must be `master`; if not, stop and report.
   - `git status --porcelain` — must be empty. If there are uncommitted changes,
     stop and tell the user to commit or stash them first (the tag must point at a
     committed state).
   - `git fetch --tags origin`
   - `git tag --points-at HEAD` — if HEAD already carries a `v*` tag, stop and
     report it; there is nothing to release.
   - `git log --oneline origin/master..HEAD` — the commits about to be published.

2. **Compute the next version** — take the highest existing tag from
   `git tag --sort=-v:refname | head -5` (expect `vMAJOR.MINOR.PATCH`) and apply:
   - `patch` → `v0.7.3` → `v0.7.4`
   - `minor` → `v0.7.3` → `v0.8.0`
   - `major` → `v0.7.3` → `v1.0.0`
   - an explicit `vX.Y.Z` argument → use it verbatim (verify it is not already a tag
     and that it sorts above the current latest).

3. **Confirm** — show the user: current latest tag → new tag, the HEAD commit
   subject, and the list of commits being pushed. Ask for a yes before touching the
   remote. This is an outward-facing, hard-to-undo action.

4. **Tag and push** — only after confirmation:
   ```
   git tag -a <new-tag> -m "<new-tag>" HEAD
   git push origin master
   git push origin <new-tag>
   ```
   Push the branch before the tag so CI builds a commit that exists on the remote.
   If `git push origin master` is rejected (non-fast-forward), delete the local tag
   (`git tag -d <new-tag>`), stop, and report — do not force-push or auto-rebase.

5. **Report** — state the tag that was pushed and link the run:
   `https://github.com/kumi-yada/vrc-dashboard/actions`
