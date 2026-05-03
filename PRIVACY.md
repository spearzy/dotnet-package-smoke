# Privacy

`dotnet-package-smoke` does not collect telemetry and does not send project data to the maintainer.

The action runs inside the user's GitHub Actions runner and uses the local repository checkout, the .NET SDK, and GitHub Actions APIs available to JavaScript actions.

## Data Processed By The Action

Depending on configuration, the action may read:

- configured project paths and globs
- `.csproj` files selected by the user
- produced `.nupkg` package files
- package metadata inside produced `.nupkg` files
- command output from `dotnet restore`, `dotnet build`, `dotnet pack`, `dotnet add package`, and `dotnet test`

The action writes GitHub Actions outputs and a GitHub job summary for the current workflow run.

## Data Not Collected

The action does not:

- collect telemetry
- call a maintainer-controlled service
- sell data
- intentionally collect personal data
- intentionally read repository secrets

## GitHub Actions Logs

Command output may appear in GitHub Actions logs or job summaries. Users should avoid placing secrets in project files, package metadata, build output, or test output.

## Third Parties

The action runs on GitHub Actions infrastructure and uses dependencies listed in `package.json`. GitHub's own privacy terms apply to GitHub Actions and GitHub Marketplace.
