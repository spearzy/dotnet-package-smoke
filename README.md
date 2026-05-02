# dotnet-package-smoke

Test your NuGet packages the way consumers install them.

`dotnet-package-smoke` is an in-progress GitHub Action for .NET package authors. The goal is to pack one or more projects into a local NuGet feed, then verify the produced packages from generated temporary consumer projects.

This project is currently at the first learning milestone: a working TypeScript GitHub Action skeleton with input parsing, unit tests, bundling, and CI.

## Why this exists

Normal source-based tests are valuable, but they do not prove that a packed `.nupkg` works when installed through `PackageReference`.

This action is intended to catch package-consumption problems before release, including restore failures, missing dependencies, bad package layout, and packages that work through `ProjectReference` but fail for real consumers.

## Current status

Implemented:

- TypeScript action entry point
- `action.yml`
- `package-projects` input parsing
- `generated-consumers` boolean input parsing
- `packages-packed` output placeholder
- Vitest unit tests
- `@vercel/ncc` bundling to `dist/index.js`
- CI for build, test, package, bundle freshness, and production audit

Not implemented yet:

- resolving project globs
- running `dotnet restore`
- running `dotnet build`
- running `dotnet pack`
- finding `.nupkg` files
- extracting package ID/version
- creating generated consumer projects
- installing produced packages into generated consumers
- GitHub job summary output

## Usage

This action is not ready for real package validation yet. The current version only proves that the action can run and parse inputs.

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
| `package-projects` | Yes | | Project paths to pack. Currently parsed as multiline or comma-separated values. Glob resolution will be added later. |
| `generated-consumers` | No | `true` | Whether generated consumer checks should run. The input is parsed, but generated consumers are not implemented yet. |

## Outputs

| Output | Description |
| --- | --- |
| `packages-packed` | Placeholder output. Currently always `0`. |

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

## Roadmap

Next small milestones:

1. Resolve `package-projects` paths and globs.
2. Add a small wrapper for running `dotnet` commands safely.
3. Restore, build, and pack package projects.
4. Find produced `.nupkg` files.
5. Extract package ID and version from each package.
6. Create generated consumer projects in a temporary workspace.
7. Install, restore, and build generated consumers.
8. Write a useful GitHub job summary.

The first real MVP is complete when the action can be run with only `package-projects` and prove that the packed packages install, restore, and build in clean generated consumer projects.
