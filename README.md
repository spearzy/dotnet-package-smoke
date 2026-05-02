# dotnet-package-smoke

Test your NuGet packages the way consumers install them.

`dotnet-package-smoke` is an in-progress GitHub Action for .NET package authors. The goal is to pack one or more projects into a local NuGet feed, then verify the produced packages from generated temporary consumer projects.

This project is currently at the first learning milestone: a working TypeScript GitHub Action skeleton with input parsing, unit tests, bundling, and CI.

This action is intended to catch package-consumption problems before release, including restore failures, missing dependencies, bad package layout, and packages that work through `ProjectReference` but fail for real consumers.

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