# dotnet-package-smoke

Test your NuGet packages the way consumers install them.

`dotnet-package-smoke` is an in-progress GitHub Action for .NET package authors. It packs one or more projects into a local NuGet feed, then checks that the produced packages can be installed, restored, and built by generated temporary consumer projects.

Optional smoke test projects can also be restored and tested against the same local feed for deeper API validation.

This action is intended to catch package-consumption problems before release, including restore failures, missing dependencies, bad package layout, and packages that work through `ProjectReference` but fail for real consumers.

## Usage

Start with only `package-projects`. Generated consumer checks are enabled by default.

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
        uses: spearzy/dotnet-package-smoke@v1
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

To keep temporary workspaces for debugging failed checks:

```yaml
- uses: spearzy/dotnet-package-smoke@v1
  with:
    package-projects: |
      src/MyLibrary/MyLibrary.csproj
    retain-on-failure: true
```

When enabled, failed generated consumer or smoke project workspaces are kept and their paths are written to the logs and job summary. Successful workspaces are still cleaned up.

## Parameters

At least one validation mode must be enabled: either `generated-consumers: true` or a non-empty `smoke-projects` value.

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
| `retain-on-failure` | No | `false` | Keep failed generated consumer and smoke project temporary workspaces for debugging. |

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
- retained workspace paths when `retain-on-failure` is enabled and a check fails
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

## Current roadmap

Next milestones:

1. Expand README examples.
2. Prepare marketplace documentation.
