# Changelog

All notable changes to `dotnet-package-smoke` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project follows [Semantic Versioning](https://semver.org/).

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
