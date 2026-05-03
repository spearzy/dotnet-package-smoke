# dotnet-package-smoke

Test your NuGet packages the way consumers install them.

`dotnet-package-smoke` is an in-progress GitHub Action for .NET package authors. The goal is to pack one or more projects into a local NuGet feed, then verify the produced packages from generated temporary consumer projects.

This project is early in development. It can currently resolve package projects, restore/build/pack them, find produced `.nupkg` files, extract package ID/version metadata, copy packages to a local feed, and create generated consumer projects that reference the produced packages from that local feed.

This action is intended to catch package-consumption problems before release, including restore failures, missing dependencies, bad package layout, and packages that work through `ProjectReference` but fail for real consumers.

## Usage

This action is not ready for production package validation yet. Generated consumers can be created and packages can be added from the local feed, but generated consumer restore/build validation is still in progress.

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
- uses: owner/dotnet-package-smoke@v1
  with:
    package-projects: |
      src/MyLibrary/MyLibrary.csproj
```

## Inputs

| Input | Required | Default | Description |
| --- | --- | --- | --- |
| `package-projects` | Yes | | Project paths to pack. Supports multiline or comma-separated values and glob patterns. |
| `generated-consumers` | No | `true` | Create generated temporary consumer projects and add produced packages from the local feed. |
| `consumer-target-frameworks` | No | `net8.0` | Target frameworks used for generated consumer projects. Supports multiline or comma-separated values. |
| `consumer-project-type` | No | `classlib` | Generated consumer project type. Supported values: `classlib`, `console`. |
| `working-directory` | No | `.` | Directory used to resolve project paths, globs, and relative output directories. |
| `configuration` | No | `Release` | .NET build configuration used for build and pack commands. |
| `artifacts-directory` | No | `.dotnet-package-smoke/artifacts` | Directory where packed `.nupkg` files are written. |
| `local-feed-directory` | No | `.dotnet-package-smoke/feed` | Directory used as the temporary local NuGet feed. |
| `restore-before-pack` | No | `true` | Run `dotnet restore` before packing. |
| `build-before-pack` | No | `true` | Run `dotnet build` before packing. |

## Outputs

| Output | Description |
| --- | --- |
| `packages-packed` | Number of `.nupkg` files found after packing. |
| `local-feed-directory` | Resolved path to the local NuGet feed. |
| `generated-consumers-tested` | Number of generated consumer projects created and package-installed. |

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

1. Restore generated consumers from the local feed.
2. Build generated consumers.
3. Fail clearly on generated consumer install, restore, or build failures.
4. Add a useful GitHub job summary.
5. Add optional user-provided smoke project support.
