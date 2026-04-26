## 1. Discovery and Classification

- [x] 1.1 Search current source, documentation, metadata, and configuration for `TaiBaro`, `taibaro`, and old project positioning text.
- [x] 1.2 Classify each old-brand reference as user-facing, current documentation, technical metadata, compatibility-sensitive configuration, or historical archive context.
- [x] 1.3 Decide whether logo/favicon visual assets need replacement now or only textual identity and alt text updates.

## 2. User-Facing Identity

- [x] 2.1 Update the TopBar product title to `FormoAtlas` and the logo alt text to `FormoAtlas logo`.
- [x] 2.2 Update browser/document metadata and any visible app title surfaces to use `FormoAtlas`.
- [x] 2.3 Update Footer copyright text to use `FormoAtlas` while preserving data source and investment warning text.
- [x] 2.4 Add the Chinese positioning line `以日期翻閱島嶼股海，讀懂每日留下的紅綠線索。` where the app or docs need a concise product description.

## 3. Documentation and Metadata

- [x] 3.1 Update README and current project documentation to describe FormoAtlas as a date-centered atlas for Taiwan equities.
- [x] 3.2 Update `openspec/project.md` with the FormoAtlas name, slug, and positioning line.
- [x] 3.3 Update safe package/workspace metadata to use `formoatlas` where it is metadata-only and does not break Nx project paths or commands.
- [x] 3.4 Preserve existing environment variable compatibility; add `FORMOATLAS_` aliases only if brand-specific old variables are found.

## 4. Verification

- [x] 4.1 Re-run old-brand searches and confirm remaining references are either historical archive context or intentionally compatibility-preserved.
- [x] 4.2 Run affected lint/test/build checks for web and metadata changes.
- [x] 4.3 Manually verify the rendered toolbar, footer, document title, and responsive layout still behave correctly after the rename.
