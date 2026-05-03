# Contributing

Thank you for considering a contribution to `dotnet-package-smoke`.

The project aims to stay practical, reliable, and focused on package-consumption validation for .NET packages.

## Development Setup

Install dependencies:

```bash
npm install
```

Run the full local check:

```bash
npm run all
```

This command type-checks TypeScript, runs tests, and rebuilds `dist/`.

## Pull Requests

Before opening a pull request:

- keep changes focused
- add or update tests for behaviour changes
- run `npm run all`
- commit the rebuilt `dist/` files when source changes affect the bundled action
- update `README.md`, `CHANGELOG.md`, or `docs/` when public behaviour changes

## Product Boundaries

Good contributions usually improve:

- package project resolution
- package metadata extraction
- generated consumer install, restore, or build checks
- optional smoke project checks
- failure output and job summaries
- documentation and examples

Features that are likely better for later discussion include:

- publishing packages
- installing .NET SDKs
- telemetry
- dashboards
- PR comments
- SARIF output
- package signing checks

## Changelog

Changelog entries should follow this format:

```markdown
## [X.X.X] - YYYY-MM-DD

### Added
- 

### Changed
- 

### Fixed
- 
```

## Conduct

By participating, you agree to follow the project's Code of Conduct.
