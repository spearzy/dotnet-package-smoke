import { describe, expect, it } from "vitest";
import { PackageSmokeResult } from "../src/packageSmoke";

function createResult(
    overrides: Partial<PackageSmokeResult> = {},
): PackageSmokeResult {
    return {
        packages: [
            {
                name: "MyLibrary.1.0.0.nupkg",
                path: "/tmp/artifacts/MyLibrary.1.0.0.nupkg",
                id: "MyLibrary",
                version: "1.0.0",
            },
        ],
        packageProjects: ["/repo/src/MyLibrary/MyLibrary.csproj"],
        generatedConsumers: [],
        smokeProjects: [],
        artifactsDirectory: "/tmp/artifacts",
        localFeedDirectory: "/tmp/feed",
        ...overrides,
    };
}

describe("createMarkdownSummary", () => {
    it("summarises the overall result first", async () => {
        const { createMarkdownSummary } = await import("../src/summary");

        const summary = createMarkdownSummary(
            createResult({
                packages: [
                    {
                        name: "MyLibrary.1.0.0.nupkg",
                        path: "/tmp/artifacts/MyLibrary.1.0.0.nupkg",
                        id: "MyLibrary",
                        version: "1.0.0",
                    },
                    {
                        name: "MyLibrary.Extensions.1.0.0.nupkg",
                        path: "/tmp/artifacts/MyLibrary.Extensions.1.0.0.nupkg",
                        id: "MyLibrary.Extensions",
                        version: "1.0.0",
                    },
                ],
                generatedConsumers: [
                    {
                        targetFramework: "net8.0",
                        projectType: "classlib",
                        projectPath: "/tmp/consumer/Consumer.csproj",
                        packagesInstalled: [],
                        installSucceeded: true,
                        restoreSucceeded: true,
                        buildSucceeded: true,
                        failureStage: null,
                        failureOutput: "",
                        retainedWorkspace: null,
                    },
                ],
                smokeProjects: [
                    {
                        projectPath: "/repo/smoke/MyLibrary.Tests/MyLibrary.Tests.csproj",
                        restoreSucceeded: true,
                        testSucceeded: true,
                        failureStage: null,
                        failureOutput: "",
                        retainedWorkspace: null,
                    },
                ],
            }),
        );

        expect(summary).toContain("## Result");
        expect(summary).toContain("✅ 2 packages packed");
        expect(summary).toContain("✅ 1 generated consumer checks passed");
        expect(summary).toContain("✅ 1 smoke projects passed");
    });

    it("summarises packages and output paths", async () => {
        const { createMarkdownSummary } = await import("../src/summary");

        const summary = createMarkdownSummary(createResult());

        expect(summary).toContain("| MyLibrary | 1.0.0 | /tmp/artifacts/MyLibrary.1.0.0.nupkg |");
        expect(summary).toContain("- Local feed: /tmp/feed");
        expect(summary).toContain("- Artifacts: /tmp/artifacts");
    });

    it("summarises generated consumer success", async () => {
        const { createMarkdownSummary } = await import("../src/summary");

        const summary = createMarkdownSummary(
            createResult({
                generatedConsumers: [
                    {
                        targetFramework: "net8.0",
                        projectType: "classlib",
                        projectPath: "/tmp/consumer/Consumer.csproj",
                        packagesInstalled: [],
                        installSucceeded: true,
                        restoreSucceeded: true,
                        buildSucceeded: true,
                        failureStage: null,
                        failureOutput: "",
                        retainedWorkspace: null,
                    },
                ],
            }),
        );

        expect(summary).toContain("| net8.0 | classlib | ✅ | ✅ | ✅ |  |");
        expect(summary).not.toContain("## Failure Details");
    });

    it("includes failure output for failed generated consumers", async () => {
        const { createMarkdownSummary } = await import("../src/summary");

        const summary = createMarkdownSummary(
            createResult({
                generatedConsumers: [
                    {
                        targetFramework: "net8.0",
                        projectType: "console",
                        projectPath: "/tmp/consumer/Consumer.csproj",
                        packagesInstalled: [],
                        installSucceeded: true,
                        restoreSucceeded: false,
                        buildSucceeded: false,
                        failureStage: "restore",
                        failureOutput: "NU1101: Unable to find package MyLibrary",
                        retainedWorkspace: null,
                    },
                ],
            }),
        );

        expect(summary).toContain("| net8.0 | console | ✅ | ❌ | ❌ | restore |");
        expect(summary).toContain("Failed stage: restore");
        expect(summary).toContain("## Failure Details");
        expect(summary).toContain("NU1101: Unable to find package MyLibrary");
    });

    it("summarises smoke project failures", async () => {
        const { createMarkdownSummary } = await import("../src/summary");

        const summary = createMarkdownSummary(
            createResult({
                smokeProjects: [
                    {
                        projectPath: "/repo/smoke/MyLibrary.Tests/MyLibrary.Tests.csproj",
                        restoreSucceeded: true,
                        testSucceeded: false,
                        failureStage: "test",
                        failureOutput: "Expected true but got false",
                        retainedWorkspace: null,
                    },
                ],
            }),
        );

        expect(summary).toContain(
            "| /repo/smoke/MyLibrary.Tests/MyLibrary.Tests.csproj | ✅ | ❌ | test |",
        );
        expect(summary).toContain("### Smoke project /repo/smoke/MyLibrary.Tests/MyLibrary.Tests.csproj");
        expect(summary).toContain("Expected true but got false");
    });

    it("includes retained workspaces when failed checks are kept", async () => {
        const { createMarkdownSummary } = await import("../src/summary");

        const summary = createMarkdownSummary(
            createResult({
                generatedConsumers: [
                    {
                        targetFramework: "net8.0",
                        projectType: "classlib",
                        projectPath: "/tmp/consumer/Consumer.csproj",
                        packagesInstalled: [],
                        installSucceeded: false,
                        restoreSucceeded: false,
                        buildSucceeded: false,
                        failureStage: "install",
                        failureOutput: "install failed",
                        retainedWorkspace: "/tmp/dotnet-package-smoke-consumers-123",
                    },
                ],
            }),
        );

        expect(summary).toContain("## Retained Workspaces");
        expect(summary).toContain("- /tmp/dotnet-package-smoke-consumers-123");
        expect(summary).toContain("Retained workspace: /tmp/dotnet-package-smoke-consumers-123");
    });

    it("shows failed counts in the overall result", async () => {
        const { createMarkdownSummary } = await import("../src/summary");

        const summary = createMarkdownSummary(
            createResult({
                generatedConsumers: [
                    {
                        targetFramework: "net8.0",
                        projectType: "classlib",
                        projectPath: "/tmp/consumer/Consumer.csproj",
                        packagesInstalled: [],
                        installSucceeded: false,
                        restoreSucceeded: false,
                        buildSucceeded: false,
                        failureStage: "install",
                        failureOutput: "install failed",
                        retainedWorkspace: null,
                    },
                ],
            }),
        );

        expect(summary).toContain("❌ 0 generated consumer checks passed, 1 failed");
    });
});
