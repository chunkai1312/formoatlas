## Context

The API connects to MongoDB directly with:

```ts
MongooseModule.forRoot(process.env.MONGODB_URI as string)
```

There is no existing migration framework, database abstraction layer, or script directory. The project README currently documents local MongoDB via:

```env
MONGODB_URI=mongodb://localhost:27017/formoatlas
```

The safest first version should therefore wrap MongoDB Database Tools (`mongodump` and `mongorestore`) instead of implementing backup logic through application code.

## Goals / Non-Goals

**Goals:**

- Provide one command to create a compressed backup archive from the configured MongoDB database.
- Provide one command to restore a compressed archive into the configured MongoDB database.
- Load `MONGODB_URI` from the existing `.env` file by default while allowing shell-provided environment variables to override it.
- Make destructive restore behavior explicit.
- Reduce the chance of restoring into a remote or production-like database by accident.
- Keep generated backup files out of git.

**Non-Goals:**

- Schedule automatic backups.
- Upload backups to cloud storage.
- Encrypt backup archives.
- Support partial collection restore in the first version.
- Add a new application-level admin UI or API endpoint.

## Decisions

### D1: Use MongoDB Database Tools

The scripts should call:

- `mongodump --uri "$MONGODB_URI" --gzip --archive "$backup_path"`
- `mongorestore --uri "$MONGODB_URI" --drop --gzip --archive "$backup_path"`

Rationale: these tools preserve MongoDB-native dump/restore semantics and avoid coupling operational data export to Mongoose model definitions.

### D2: Store local backups under `backups/mongo/`

Backup files should use a timestamped archive name:

```text
backups/mongo/formoatlas-YYYYMMDD-HHMMSS.archive.gz
```

Rationale: a stable directory makes cleanup and restore discovery simple, while timestamped filenames avoid overwriting previous backups.

### D3: Load `.env` but let exported env vars win

The scripts should support the common local workflow:

```sh
npm run db:backup
npm run db:restore -- backups/mongo/formoatlas-20260515-210000.archive.gz
```

If `MONGODB_URI` is already present in the shell environment, the scripts should use that value. Otherwise they should read `MONGODB_URI` from `.env`.

Rationale: this matches the current application configuration while preserving flexibility for one-off targets.

### D4: Restore requires explicit confirmation

Restore should be treated as destructive because it will use `--drop`. The restore script should print the target database URI in redacted form and require a confirmation phrase before running.

Example confirmation:

```text
RESTORE formoatlas
```

Rationale: accidental restore is the highest-risk operation in this feature.

### D5: Remote targets are blocked by default

The restore script should reject targets that do not look local, unless the caller passes an explicit override such as `--allow-remote`.

Local targets include:

- `localhost`
- `127.0.0.1`
- `::1`

Remote-looking targets include:

- `mongodb+srv://...`
- `mongodb://` hosts that are not local loopback names or addresses

Rationale: the default restore path is for local development and recovery testing. Production restore policies should be more deliberate than this project-local helper.

### D6: Redact credentials in script output

Scripts may print the target URI for operator clarity, but credentials must be redacted.

Example:

```text
mongodb://user:***@localhost:27017/formoatlas
```

Rationale: command output can end up in terminal scrollback, logs, or screenshots.

## Risks / Trade-offs

- [Tool availability] `mongodump` and `mongorestore` may not be installed on every developer machine. -> Detect missing commands early and document MongoDB Database Tools as a prerequisite.
- [Database name inference] MongoDB URIs can include query strings or omit an explicit database. -> Use the URI directly for dump/restore and use best-effort database name extraction only for prompts/messages.
- [Remote restores] There are legitimate remote restore cases. -> Allow an explicit override flag while keeping the default local-only.
- [Archive growth] Market data can make backups large over time. -> Keep the first version local and gitignored; retention automation is out of scope.

## Open Questions

- Should backup support an optional retention flag, such as keeping only the latest N archives?
- Should restore support a dry-run validation mode beyond checking that the archive exists and `mongorestore` is installed?
- Should production backup/export eventually be handled outside the repo through infrastructure instead of developer scripts?
