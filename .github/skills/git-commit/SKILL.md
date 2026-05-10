````skill
---
name: git-commit
description: Plan and create git commits following the project's conventional commit style. Use when the user wants to commit staged or unstaged changes with the correct format.
license: MIT
metadata:
  author: local
  version: "1.0"
---

Plan and create git commits following the project's conventional commit conventions.

**Steps**

1. **Inspect current state**

   ```bash
   git status --short
   git diff --cached --name-only   # staged files
   git diff --name-only            # unstaged files
   ```

   If nothing is staged, check whether to stage everything or only specific files — ask the user if ambiguous.

2. **Analyse changes and plan commits**

   Group the changed files into logical units. Each group becomes one commit.
   Common groupings:
   - Source code changes (feat/fix/refactor/test) by project/scope
   - OpenSpec archive or sync separately from code changes
   - Documentation changes separately if large

   For each group, determine:
   - **type**: see type table below
   - **scope**: see scope table below
   - **subject**: short imperative phrase, lowercase, no trailing period
   - **body**: bullet list (`-`) for multiple items; prose sentence for single-reason changes; include metrics when relevant (e.g., "435 tests passing across 94 suites (up from 385)")

   Show the plan to the user before executing.

3. **Execute commits in order**

   For each planned commit:
   ```bash
   git add <files>
   git commit -m "<type>(<scope>): <subject>\n\n<body>"
   ```

   Verify each commit with `git log --oneline -1` after creation.

4. **Show final log**

   ```bash
   git log --oneline -<n>   # n = number of commits made
   ```

---

## Commit Format

```
<type>(<scope>): <subject>

<body>
```

- **Subject line**: `type(scope): subject` — all lowercase, imperative mood, ≤ 72 chars, no trailing period
- **Blank line** between subject and body (when body is present)
- **Body**: explain *what* and *why*, not *how*; use `-` bullet list for multiple items; plain prose for single-reason changes
- **No** `Co-authored-by` or other trailers

---

## Type Table

| Type       | When to use |
|------------|-------------|
| `feat`     | New user-facing feature |
| `fix`      | Bug fix |
| `refactor` | Code restructure with no behaviour change |
| `test`     | Adding or updating tests |
| `chore`    | Tooling, config, build, archive, dependency updates |
| `docs`     | Documentation only |
| `perf`     | Performance improvement |
| `style`    | Formatting only (no logic change) |

---

## Scope Table

| Scope   | When to use |
|---------|-------------|
| `web`   | Angular frontend (`apps/web`) |
| `api`   | NestJS backend (`apps/api`) |
| `agent` | LangGraph agent service (`apps/agent`) |
| *(none)*| Cross-cutting or repo-level changes (e.g., `chore: archive …`) |

---

## Body Style Examples

**Bullet list** (multiple related changes):
```
test(web): add services, guards, and component specs

- ThemeService: signal-based theme switching, body class toggle, localStorage persistence
- WorkspaceAdminGuard: role-based redirect logic
- AssistantCardComponent: subscription toggle and instructions dialog

435 tests passing across 94 suites (up from 385)
```

**Prose** (single focused change):
```
fix(web): import AuthUiConfig in app.config.ts

AuthUiConfig was re-exported but not imported, causing TS2304 errors
at lines 143 and 188.
```

**Chore archive** (no body needed):
```
chore: archive improve-pipes-guards-ui-test-coverage
```

**Chore sync + archive**:
```
chore: sync specs and archive improve-services-guards-components-test-coverage

- promoted 10 new delta specs to openspec/specs/
- archived change to openspec/changes/archive/2026-05-02-…/
```

---

## Guardrails

- Never include `Co-authored-by` trailers
- Never use past tense in the subject (use "add" not "added")
- Never capitalise the first letter of the subject
- Keep subject ≤ 72 chars; wrap body at 80 chars
- One logical concern per commit — split if two unrelated things changed
- `chore` for OpenSpec archive/sync commits (no scope needed)
- When test counts change, include a metrics line at the end of the body
````
