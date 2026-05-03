# Design

`dotnet-package-smoke` checks NuGet packages as packages, not as source projects.

The action is intentionally practical and narrow. It should help package authors catch package-consumption failures before publishing, without trying to replace unit tests, integration tests, or NuGet's own validation.

## Product Goal

The default user experience should answer one question:

> Can a clean consumer project install, restore, and build against the packages this repository just produced?

Most users should only need:

```yaml
with:
  package-projects: |
    src/MyLibrary/MyLibrary.csproj
```

## Generated Consumers

Generated consumers are the default validation mode.

They prove that produced packages:

- can be installed through `PackageReference`
- can be restored from a local NuGet feed
- can be built by a clean consumer project
- do not only work through `ProjectReference`
- have enough package assets and dependencies for a basic consuming project

Generated consumers do not prove that the package API is useful or behaves correctly. They are a packaging and consumption check.

## Smoke Projects

Smoke projects are optional user-provided projects.

They prove deeper behaviour when the repository already contains real package usage tests. Smoke projects should already reference the package IDs they want to test.

The action restores and tests smoke projects against the temporary local feed. It does not edit smoke project files or add package references for the user.

## Local Feed

The action packs projects into an artifacts directory, reads package metadata from the produced `.nupkg` files, then copies those packages into a local NuGet feed.

Generated consumers and smoke projects restore from that local feed so they consume the produced package output, not project references from the repository.

## Temporary Workspaces

Generated consumer projects are created in temporary directories.

Smoke project restore and test commands redirect build output and intermediate output to temporary directories, so normal runs do not write `bin` or `obj` output into the user repository.

Temporary workspaces are deleted by default. If `retain-on-failure: true` is set, failed generated consumer or smoke project workspaces are kept and their paths are written to the logs and job summary.

## Failure Model

The action should make the broken step obvious.

Generated consumer failures record one of:

- `create`
- `install`
- `restore`
- `build`

Smoke project failures record one of:

- `restore`
- `test`

The GitHub job summary starts with a short result overview, then includes package, generated consumer, smoke project, path, retained workspace, and failure detail sections.

## Deliberately Out Of Scope For v1

These may be valuable later, but they are not part of the core v1 shape:

- installing .NET SDKs
- publishing packages
- signing validation
- SARIF output
- PR comments
- dashboards
- telemetry
- flaky test detection
- TRX parsing
- automatic generated source code that exercises package APIs