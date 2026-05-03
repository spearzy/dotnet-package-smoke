# Security Policy

## Supported Versions

Security updates are provided for the latest released major version.

| Version | Supported |
| --- | --- |
| `v1` | Yes |

## Reporting A Vulnerability

Please do not open a public issue for suspected security vulnerabilities.

Report vulnerabilities by emailing the repository maintainer or by using GitHub's private vulnerability reporting if it is enabled for the repository.

Include:

- a description of the issue
- steps to reproduce
- affected versions or commits
- any relevant workflow configuration
- whether secrets, tokens, or sensitive logs may be exposed

The maintainer will review reports on a best-effort basis and coordinate a fix where appropriate.

## Scope

Security reports may include issues such as:

- command argument handling that could lead to unintended execution
- accidental secret disclosure in logs or summaries
- unsafe handling of package metadata
- unsafe temporary workspace behaviour
- dependency vulnerabilities that affect runtime behaviour

General support questions and ordinary bugs should be reported through GitHub issues.
