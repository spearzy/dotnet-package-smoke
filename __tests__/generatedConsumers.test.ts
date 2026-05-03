import { afterEach, describe, expect, it, vi } from "vitest";
import { runGeneratedConsumers } from "../src/generatedConsumers";
import { PackageFile } from "../src/packages";

// These tests should not run the real dotnet CLI. The generated consumer
// workflow calls dotnet several times, so we keep the real argument builders
// but replace runDotnet with a controllable fake.
vi.mock("../src/dotnet", async (importOriginal) => {
    const actual = await importOriginal<typeof import("../src/dotnet")>();

    return {
        ...actual,
        runDotnet: vi.fn(),
    };
});

// Import after vi.mock so this is the mocked runDotnet, not the real one.
const { runDotnet } = await import("../src/dotnet");
const mockedRunDotnet = vi.mocked(runDotnet);

const packages: PackageFile[] = [
    {
        name: "MyLibrary.1.0.0.nupkg",
        path: "/tmp/artifacts/MyLibrary.1.0.0.nupkg",
        id: "MyLibrary",
        version: "1.0.0",
    },
];

describe("runGeneratedConsumers", () => {
    afterEach(() => {
        // Each test defines its own dotnet command results. Resetting here
        // prevents one test's queued command results leaking into the next.
        vi.resetAllMocks();
    });

    it("returns a successful result when create, install, restore, and build pass", async () => {
        // Every dotnet command in this test succeeds:
        // dotnet new, dotnet add package, dotnet restore, dotnet build.
        mockedRunDotnet.mockResolvedValue({
            exitCode: 0,
            stdout: "",
            stderr: "",
        });

        const results = await runGeneratedConsumers(
            ["net8.0"],
            "classlib",
            "Release",
            "/tmp/feed",
            packages,
            { info: () => undefined },
        );

        expect(results).toHaveLength(1);
        expect(results[0]).toMatchObject({
            targetFramework: "net8.0",
            projectType: "classlib",
            installSucceeded: true,
            restoreSucceeded: true,
            buildSucceeded: true,
            failureOutput: "",
        });
    });

    it("returns a failed restore result without running build", async () => {
        // The calls are consumed in order:
        // 1. dotnet new succeeds
        // 2. dotnet add package succeeds
        // 3. dotnet restore fails
        //
        // The build command should never run after a failed restore.
        mockedRunDotnet
            .mockResolvedValueOnce({ exitCode: 0, stdout: "", stderr: "" })
            .mockResolvedValueOnce({ exitCode: 0, stdout: "", stderr: "" })
            .mockResolvedValueOnce({
                exitCode: 1,
                stdout: "restore failed",
                stderr: "NU1101",
            });

        const results = await runGeneratedConsumers(
            ["net8.0"],
            "classlib",
            "Release",
            "/tmp/feed",
            packages,
            { info: () => undefined },
        );

        expect(results[0]).toMatchObject({
            installSucceeded: true,
            restoreSucceeded: false,
            buildSucceeded: false,
            failureOutput: "restore failed\nNU1101",
        });
        // If this is 4, the code tried to build even though restore failed.
        expect(mockedRunDotnet).toHaveBeenCalledTimes(3);
    });
});
