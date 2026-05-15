## Why

FormoAtlas stores market data, AI analysis cache, user records, watchlists, and agent conversations in MongoDB through a single `MONGODB_URI`. The project currently documents MongoDB as a runtime dependency but does not provide a repeatable way to create restorable database snapshots or safely restore a snapshot into a local environment.

This makes local development, destructive testing, refetch/backfill work, and recovery from bad data updates riskier than necessary.

## What Changes

- Add repository scripts for backing up and restoring the MongoDB database referenced by `MONGODB_URI`.
- Add npm script aliases so developers can run the operations through the existing project command surface.
- Store generated backup archives under a predictable local backup directory that is ignored by git.
- Add restore safeguards so accidental destructive restores require explicit confirmation and remote/prod-like targets are blocked unless intentionally overridden.
- Document the expected MongoDB Database Tools dependency and basic usage.

## Capabilities

### New Capabilities

- `database-maintenance`: Developers SHALL be able to create compressed MongoDB backups and restore them safely from the project workspace.

### Modified Capabilities

None.

## Impact

- Scripts: add `scripts/db/backup.sh` and `scripts/db/restore.sh`.
- Project commands: update `package.json` with `db:backup` and `db:restore`.
- Git hygiene: ignore generated backup archives under `backups/mongo/`.
- Documentation: update README or an equivalent docs section with backup/restore usage and prerequisites.
