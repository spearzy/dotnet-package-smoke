# dotnet-package-smoke

Test your NuGet packages the way consumers install them.

`dotnet-package-smoke` is an in-progress GitHub Action for .NET package authors. The goal is to pack one or more projects into a local NuGet feed, then verify the produced packages from generated temporary consumer projects. Optional smoke test projects can also be restored and tested against the local feed.

This project is early in development. It can currently resolve package projects, restore/build/pack them, find produced `.nupkg` files, extract package ID/version metadata, copy packages to a local feed, create generated consumer projects, install the produced packages from that local feed, restore the generated consumers, build them, run optional smoke test projects, and write a GitHub job summary.

This action is intended to catch package-consumption problems before release, including restore failures, missing dependencies, bad package layout, and packages that work through `ProjectReference` but fail for real consumers.

## Usage

This action is still early in development, but the core generated consumer flow is implemented. It packs projects, installs the produced packages into temporary consumer projects from a local NuGet feed, restores those consumers, builds them, optionally runs user-provided smoke projects, and reports the results in the GitHub job summary.

For now, use it as an additional package-consumption confidence check alongside your existing tests and release validation.
Example workflow:

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
        uses: ./
        with:
          package-projects: |
            src/MyLibrary/MyLibrary.csproj
```

Later, this will become:

```yaml
- uses: spearzy/dotnet-package-smoke@v1
  with:
    package-projects: |
      src/MyLibrary/MyLibrary.csproj
```

With optional smoke projects:

```yaml
- uses: spearzy/dotnet-package-smoke@v1
  with:
    package-projects: |
      src/MyLibrary/MyLibrary.csproj
    smoke-projects: |
      smoke/**/*.csproj
```

Smoke projects should already contain the `PackageReference` entries they need. The action restores and tests them against the temporary local feed; it does not edit those project files.

With extra `dotnet pack` arguments:

```yaml
- uses: spearzy/dotnet-package-smoke@v1
  with:
    package-projects: |
      src/MyLibrary/MyLibrary.csproj
    pack-arguments: >-
      --include-symbols
      -p:ContinuousIntegrationBuild=true
      -p:PackageReleaseNotes="Package smoke validation"
```

`pack-arguments` supports quoted values and is passed to `dotnet pack` as arguments, not through a shell.

## Inputs

| Input | Required | Default | Description |
| --- | --- | --- | --- |
| `package-projects` | Yes | | Project paths to pack. Supports multiline or comma-separated values and glob patterns. |
| `generated-consumers` | No | `true` | Create generated temporary consumer projects and add produced packages from the local feed. |
| `consumer-target-frameworks` | No | `net8.0` | Target frameworks used for generated consumer projects. Supports multiline or comma-separated values. |
| `consumer-project-type` | No | `classlib` | Generated consumer project type. Supported values: `classlib`, `console`. |
| `smoke-projects` | No | | Optional smoke test project paths. Supports multiline or comma-separated values and glob patterns. |
| `working-directory` | No | `.` | Directory used to resolve project paths, globs, and relative output directories. |
| `configuration` | No | `Release` | .NET build configuration used for build and pack commands. |
| `artifacts-directory` | No | `.dotnet-package-smoke/artifacts` | Directory where packed `.nupkg` files are written. |
| `local-feed-directory` | No | `.dotnet-package-smoke/feed` | Directory used as the temporary local NuGet feed. |
| `restore-before-pack` | No | `true` | Run `dotnet restore` before packing. |
| `build-before-pack` | No | `true` | Run `dotnet build` before packing. |
| `pack-arguments` | No | | Additional arguments passed to `dotnet pack`. Supports quoted values. |

## Outputs

| Output | Description |
| --- | --- |
| `packages-packed` | Number of `.nupkg` files found after packing. |
| `local-feed-directory` | Resolved path to the local NuGet feed. |
| `generated-consumers-tested` | Number of generated consumer projects tested. |
| `generated-consumers-passed` | Number of generated consumers that passed install, restore, and build. |
| `generated-consumers-failed` | Number of generated consumers that failed install, restore, or build. |
| `smoke-projects-tested` | Number of smoke projects tested. |
| `smoke-projects-passed` | Number of smoke projects that passed restore and test. |
| `smoke-projects-failed` | Number of smoke projects that failed restore or test. |

## Job summary

When the action runs, it writes a GitHub job summary with:

- packages found after packing
- generated consumer install, restore, and build status
- smoke project restore and test status
- local feed and artifacts paths
- failure details for generated consumer and smoke project failures

## Development

Install dependencies:

```bash
npm install
```

Run the full local check:

```bash
npm run all
```

Available scripts:

```bash
npm run build    # Type-check TypeScript
npm test         # Run unit tests
npm run package  # Bundle src/index.ts into dist/index.js
npm run all      # Build, test, and bundle
```

## Notes for JavaScript actions

GitHub Actions runs the JavaScript file referenced by `action.yml`:

```yaml
runs:
  using: node24
  main: dist/index.js
```

Because this project is written in TypeScript, `src/index.ts` must be bundled before the action can run. The bundled `dist/` files are committed intentionally.

The CI workflow checks that `dist/` is current after `npm run package`.

## Current roadmap

Next milestones:

1. Add cleanup and retain-on-failure behaviour.
2. Expand README examples.
3. Prepare marketplace documentation.
