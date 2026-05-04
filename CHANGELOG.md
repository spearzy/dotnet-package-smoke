# Changelog

All notable changes to `dotnet-package-smoke` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project follows [Semantic Versioning](https://semver.org/).

## [1.0.1] - 2026-05-03

### Added
- No user-facing additions.

### Changed
- Switch the action bundle from `ncc` to `esbuild` so current ESM-only GitHub Action Toolkit packages can be bundled.
- Update runtime Action Toolkit dependencies and development test/build tooling.
- Keep Dependabot major updates enabled for supported packages while retaining Node 24 type safety.
- Stop generating and committing JavaScript source maps for the bundled action.

### Fixed
- Set the TypeScript root directory explicitly for newer TypeScript compatibility.
- Remove Dependabot label references that do not exist in the repository.

## [1.0.0] - 2026-05-03

### Added
- Pack one or more .NET package projects.
- Discover produced `.nupkg` files and extract package ID/version metadata.
- Copy produced packages into a local NuGet feed.
- Create generated consumer projects and install produced packages from the local feed.
- Restore and build generated consumers.
- Run optional user-provided smoke projects against the local feed.
- Support `pack-arguments`, including quoted values.
- Support `retain-on-failure` for failed generated consumer and smoke project workspaces.
- Write GitHub Actions outputs for package, generated consumer, and smoke project counts.
- Write a GitHub job summary with result overview, package details, check details, paths, retained workspaces, and failure output.
- Add workflow examples and release-readiness documentation.

### Changed
- 

### Fixed
- 
