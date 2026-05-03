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
        artifactsDirectory: "/tmp/artifacts",
        localFeedDirectory: "/tmp/feed",
        ...overrides,
    };
}

describe("createMarkdownSummary", () => {
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
                        failureOutput: "",
                    },
                ],
            }),
        );

        expect(summary).toContain("| net8.0 | classlib | ✅ | ✅ | ✅ |");
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
                        failureOutput: "NU1101: Unable to find package MyLibrary",
                    },
                ],
            }),
        );

        expect(summary).toContain("| net8.0 | console | ✅ | ❌ | ❌ |");
        expect(summary).toContain("## Failure Details");
        expect(summary).toContain("NU1101: Unable to find package MyLibrary");
    });
});
