## 1. Backup Script

- [x] 1.1 Create `scripts/db/backup.sh`.
- [x] 1.2 Load `MONGODB_URI` from the shell environment or `.env`.
- [x] 1.3 Validate that `MONGODB_URI` is present.
- [x] 1.4 Validate that `mongodump` is installed.
- [x] 1.5 Write compressed timestamped archives to `backups/mongo/`.
- [x] 1.6 Print the created archive path and file size.

## 2. Restore Script

- [x] 2.1 Create `scripts/db/restore.sh`.
- [x] 2.2 Accept a backup archive path as the required argument.
- [x] 2.3 Load and validate `MONGODB_URI`.
- [x] 2.4 Validate that `mongorestore` is installed.
- [x] 2.5 Reject missing backup archive paths.
- [x] 2.6 Block remote-looking MongoDB URIs unless `--allow-remote` is provided.
- [x] 2.7 Print the target URI with credentials redacted.
- [x] 2.8 Require an explicit confirmation phrase before running `mongorestore --drop`.
- [x] 2.9 Restore from the compressed archive and report completion.

## 3. Project Integration

- [x] 3.1 Add `db:backup` and `db:restore` scripts to `package.json`.
- [x] 3.2 Add `backups/mongo/*.archive.gz` or equivalent backup archive ignore rules to `.gitignore`.
- [x] 3.3 Add README usage notes and MongoDB Database Tools prerequisite.

## 4. Verification

- [x] 4.1 Run a backup against a local MongoDB URI when available, or verify script help/error paths when local MongoDB is unavailable.
- [x] 4.2 Verify restore rejects missing archive input.
- [x] 4.3 Verify restore blocks a remote-looking URI without `--allow-remote`.
- [x] 4.4 Verify restore prints a redacted URI when credentials are present.
- [x] 4.5 Run `openspec validate add-database-backup-restore-scripts --strict`.
