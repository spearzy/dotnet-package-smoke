# Marketplace

This document keeps the GitHub Marketplace listing copy and release checklist in one place.

## Name

`.NET Package Smoke Tests`

## Tagline

Test your NuGet packages the way consumers install them.

## Short Description

Pack .NET projects, create a local NuGet feed, and verify the produced packages through generated consumer projects and optional smoke tests.

## Longer Description

`dotnet-package-smoke` helps .NET package authors catch packaging problems before publishing.

Normal source-based tests do not prove that the packed NuGet output works for consumers. This action packs one or more projects, copies the produced packages into a temporary local feed, then checks that clean generated consumer projects can install, restore, and build against those packages.

Optional smoke projects can also be restored and tested against the same local feed for deeper API usage checks.

## Primary Use Cases

- Check that package install, restore, and build work before release.
- Catch missing package dependencies.
- Catch bad package layout or missing assets.
- Catch packages that work through `ProjectReference` but fail through `PackageReference`.
- Run optional smoke projects against the produced package output.

## Recommended Workflow

```yaml
name: package smoke

on:
  pull_request:
  push:
    branches:
      - main

jobs:
  smoke:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v5

      - uses: actions/setup-dotnet@v5
        with:
          dotnet-version: 8.0.x

      - name: Run package smoke action
        uses: spearzy/dotnet-package-smoke@v1
        with:
          package-projects: |
            src/MyLibrary/MyLibrary.csproj
```

## Input Summary

Most users only need `package-projects`.

| Input | Use When |
| --- | --- |
| `package-projects` | You want to pack one or more projects and validate the produced packages. |
| `generated-consumers` | You want to disable generated consumers and only run smoke projects. |
| `consumer-target-frameworks` | You want generated consumers for more than one target framework. |
| `consumer-project-type` | You want generated consumers to use `console` instead of `classlib`. |
| `consumer-mode` | You want to choose whether generated consumers install produced packages together or one package at a time. |
| `smoke-projects` | You have real smoke test projects that already reference the package IDs under test. |
| `smoke-restore-arguments` | You need extra `dotnet restore` arguments for smoke projects. |
| `smoke-test-arguments` | You need extra `dotnet test` arguments for smoke projects. |
| `configuration` | You need a build configuration other than `Release`. |
| `working-directory` | Your project paths should resolve from a repository subdirectory. |
| `artifacts-directory` | You need packed `.nupkg` files written to a specific directory. |
| `local-feed-directory` | You need the temporary local NuGet feed created in a specific directory. |
| `restore-before-pack` | You want to skip the explicit restore step before packing. |
| `build-before-pack` | You want to skip the explicit build step before packing. |
| `pack-arguments` | You need extra `dotnet pack` properties or flags. |
| `retain-on-failure` | You need to inspect failed temporary workspaces. |

## Output Summary

| Output | Use When |
| --- | --- |
| `packages-packed` | You need the number of produced package files. |
| `packages-json` | You want package metadata for downstream workflow steps. |
| `local-feed-directory` | You need the resolved local feed path for later workflow steps. |
| `generated-consumers-tested` | You need the generated consumer check count. |
| `generated-consumers-passed` | You need the generated consumer pass count. |
| `generated-consumers-failed` | You need the generated consumer failure count. |
| `smoke-projects-tested` | You need the smoke project check count. |
| `smoke-projects-passed` | You need the smoke project pass count. |
| `smoke-projects-failed` | You need the smoke project failure count. |

## Release Checklist

Before publishing a marketplace release:

- `npm run all` passes locally.
- CI passes on the release branch.
- `dist/` is current and committed.
- `README.md` examples point at `spearzy/dotnet-package-smoke@v1`.
- `examples/` workflows are current.
- `action.yml` inputs and outputs match the README.
- `EULA.md`, `PRIVACY.md`, and `SECURITY.md` are current.
- The release tag is pushed.
- The GitHub Marketplace listing uses the current tagline and description.
- Release notes mention new inputs, changed defaults, and any breaking changes.

## Release Notes Template

```markdown
## dotnet-package-smoke vX.Y.Z

### Added

- TBD

### Changed

- TBD

### Fixed

- TBD

### Notes

- TBD
```
