# Changelog

All notable changes to this project will be documented in this file.

## [0.0.1] - 2025-11-22
## [0.0.2] - 2025-11-22

- Initial release.

## [0.0.3] - 2026-03-26

### Added

- `filterTitle` method to customize directory or reference title.

### Changed

- Update dependencies to latest versions.
- Rename `index` prop in `DocsArgs` to `root`.
- Rename tag `@index` to `@reference`.

### Fixed

- `@example` title fallback and heading level.

## [0.0.4] - 2026-08-08

### Changed

- Update dependencies to latest versions.

### Fixed

- Default export class names (file basename instead of exports).
- Unescape closing comment slash in rendered `@example` output.
- Reference section title (group directory title instead of current directory title when `filterTitle` not set).
