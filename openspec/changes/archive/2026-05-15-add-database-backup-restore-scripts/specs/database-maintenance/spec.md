## ADDED Requirements

### Requirement: MongoDB backup script
The project SHALL provide a script that creates a compressed MongoDB backup archive for the database referenced by `MONGODB_URI`.

The script SHALL use MongoDB Database Tools rather than application model code.

The script SHALL write backup archives under a project-local backup directory that is ignored by git.

#### Scenario: Backup succeeds with configured MongoDB URI
- **WHEN** a developer runs the backup command with a valid `MONGODB_URI`
- **THEN** the script SHALL run `mongodump` against that URI
- **AND** create a compressed archive with a timestamped filename
- **AND** print the archive path and file size

#### Scenario: Backup without MongoDB URI
- **WHEN** a developer runs the backup command without `MONGODB_URI` in the environment or `.env`
- **THEN** the script SHALL fail before invoking `mongodump`
- **AND** explain that `MONGODB_URI` is required

#### Scenario: Backup without MongoDB Database Tools
- **WHEN** `mongodump` is not available on the system path
- **THEN** the script SHALL fail before attempting a backup
- **AND** explain that MongoDB Database Tools are required

### Requirement: MongoDB restore script
The project SHALL provide a script that restores a compressed MongoDB backup archive into the database referenced by `MONGODB_URI`.

Restore SHALL be destructive and SHALL use `mongorestore --drop`.

The script SHALL require an explicit archive path argument.

#### Scenario: Restore succeeds after explicit confirmation
- **WHEN** a developer runs the restore command with a valid archive path and local `MONGODB_URI`
- **AND** enters the required confirmation phrase
- **THEN** the script SHALL run `mongorestore --drop` against that URI
- **AND** restore from the compressed archive
- **AND** report completion

#### Scenario: Restore without archive path
- **WHEN** a developer runs the restore command without a backup archive path
- **THEN** the script SHALL fail before invoking `mongorestore`
- **AND** explain the expected archive path argument

#### Scenario: Restore rejects missing archive
- **WHEN** a developer runs the restore command with an archive path that does not exist
- **THEN** the script SHALL fail before invoking `mongorestore`
- **AND** identify the missing archive path

#### Scenario: Restore without MongoDB Database Tools
- **WHEN** `mongorestore` is not available on the system path
- **THEN** the script SHALL fail before attempting a restore
- **AND** explain that MongoDB Database Tools are required

### Requirement: Restore safety guards
The restore script SHALL reduce accidental destructive restores by requiring confirmation, redacting credentials in output, and blocking remote-looking MongoDB targets by default.

#### Scenario: Restore displays redacted target URI
- **WHEN** the restore command prints the target MongoDB URI
- **THEN** any password embedded in the URI SHALL be replaced with a redacted placeholder

#### Scenario: Restore canceled by mismatched confirmation
- **WHEN** a developer does not enter the exact required confirmation phrase
- **THEN** the script SHALL abort before invoking `mongorestore`

#### Scenario: Remote target blocked by default
- **WHEN** a developer runs restore with a `MONGODB_URI` that does not target localhost, `127.0.0.1`, or `::1`
- **THEN** the script SHALL fail before invoking `mongorestore`
- **AND** explain that remote restores require an explicit override

#### Scenario: Remote target allowed with explicit override
- **WHEN** a developer runs restore with a remote-looking `MONGODB_URI`
- **AND** provides the explicit remote override option
- **AND** enters the required confirmation phrase
- **THEN** the script SHALL allow `mongorestore --drop` to run against the target URI

### Requirement: Package command integration
The project SHALL expose database backup and restore commands through `package.json`.

#### Scenario: Developer runs backup through npm
- **WHEN** a developer runs `npm run db:backup`
- **THEN** npm SHALL invoke the MongoDB backup script

#### Scenario: Developer runs restore through npm
- **WHEN** a developer runs `npm run db:restore -- <archive-path>`
- **THEN** npm SHALL invoke the MongoDB restore script with the provided archive path
