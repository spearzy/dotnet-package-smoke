import * as fs from "node:fs/promises";
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

const packageFamily: PackageFile[] = [
    packages[0],
    {
        name: "MyLibrary.Extensions.1.0.0.nupkg",
        path: "/tmp/artifacts/MyLibrary.Extensions.1.0.0.nupkg",
        id: "MyLibrary.Extensions",
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
            "combined",
            "Release",
            "/tmp/feed",
            packages,
            false,
            { info: () => undefined },
        );

        expect(results).toHaveLength(1);
        expect(results[0]).toMatchObject({
            targetFramework: "net8.0",
            projectType: "classlib",
            consumerMode: "combined",
            packagesInstalled: packages,
            installSucceeded: true,
            restoreSucceeded: true,
            buildSucceeded: true,
            failureStage: null,
            failureOutput: "",
        });
    });

    it("returns a failed install result without running restore or build", async () => {
        // The calls are consumed in order:
        // 1. dotnet new succeeds
        // 2. dotnet add package fails
        //
        // Restore and build should never run after package installation fails.
        mockedRunDotnet
            .mockResolvedValueOnce({ exitCode: 0, stdout: "", stderr: "" })
            .mockResolvedValueOnce({
                exitCode: 1,
                stdout: "install failed",
                stderr: "NU1102",
            });

        const results = await runGeneratedConsumers(
            ["net8.0"],
            "classlib",
            "combined",
            "Release",
            "/tmp/feed",
            packages,
            false,
            { info: () => undefined },
        );

        expect(results[0]).toMatchObject({
            installSucceeded: false,
            restoreSucceeded: false,
            buildSucceeded: false,
            failureStage: "install",
            failureOutput: "install failed\nNU1102",
        });
        // If this is 3 or more, the code carried on after add package failed.
        expect(mockedRunDotnet).toHaveBeenCalledTimes(2);
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
            "combined",
            "Release",
            "/tmp/feed",
            packages,
            false,
            { info: () => undefined },
        );

        expect(results[0]).toMatchObject({
            installSucceeded: true,
            restoreSucceeded: false,
            buildSucceeded: false,
            failureStage: "restore",
            failureOutput: "restore failed\nNU1101",
        });
        // If this is 4, the code tried to build even though restore failed.
        expect(mockedRunDotnet).toHaveBeenCalledTimes(3);
    });

    it("returns a failed build result after successful restore", async () => {
        // The calls are consumed in order:
        // 1. dotnet new succeeds
        // 2. dotnet add package succeeds
        // 3. dotnet restore succeeds
        // 4. dotnet build fails
        mockedRunDotnet
            .mockResolvedValueOnce({ exitCode: 0, stdout: "", stderr: "" })
            .mockResolvedValueOnce({ exitCode: 0, stdout: "", stderr: "" })
            .mockResolvedValueOnce({ exitCode: 0, stdout: "", stderr: "" })
            .mockResolvedValueOnce({
                exitCode: 1,
                stdout: "build failed",
                stderr: "CS0246",
            });

        const results = await runGeneratedConsumers(
            ["net8.0"],
            "classlib",
            "combined",
            "Release",
            "/tmp/feed",
            packages,
            false,
            { info: () => undefined },
        );

        expect(results[0]).toMatchObject({
            installSucceeded: true,
            restoreSucceeded: true,
            buildSucceeded: false,
            failureStage: "build",
            failureOutput: "build failed\nCS0246",
        });
        expect(mockedRunDotnet).toHaveBeenCalledTimes(4);
    });

    it("retains the generated consumer workspace when requested and a check fails", async () => {
        mockedRunDotnet
            .mockResolvedValueOnce({ exitCode: 0, stdout: "", stderr: "" })
            .mockResolvedValueOnce({
                exitCode: 1,
                stdout: "install failed",
                stderr: "NU1102",
            });

        const results = await runGeneratedConsumers(
            ["net8.0"],
            "classlib",
            "combined",
            "Release",
            "/tmp/feed",
            packages,
            true,
            { info: () => undefined },
        );

        const retainedWorkspace = results[0].retainedWorkspace;

        expect(retainedWorkspace).not.toBeNull();
        await expect(fs.stat(retainedWorkspace as string)).resolves.toBeDefined();

        await fs.rm(retainedWorkspace as string, { recursive: true, force: true });
    });

    it("installs all packages into one consumer in combined mode", async () => {
        mockedRunDotnet.mockResolvedValue({
            exitCode: 0,
            stdout: "",
            stderr: "",
        });

        const results = await runGeneratedConsumers(
            ["net8.0"],
            "classlib",
            "combined",
            "Release",
            "/tmp/feed",
            packageFamily,
            false,
            { info: () => undefined },
        );

        expect(results).toHaveLength(1);
        expect(results[0].packagesInstalled).toEqual(packageFamily);
        expect(mockedRunDotnet).toHaveBeenCalledTimes(5);
    });

    it("creates one consumer per package and target framework in per-package mode", async () => {
        mockedRunDotnet.mockResolvedValue({
            exitCode: 0,
            stdout: "",
            stderr: "",
        });

        const results = await runGeneratedConsumers(
            ["net8.0", "net9.0"],
            "classlib",
            "per-package",
            "Release",
            "/tmp/feed",
            packageFamily,
            false,
            { info: () => undefined },
        );

        expect(results).toHaveLength(4);
        expect(
            results.map((result) =>
                result.packagesInstalled.map((packageFile) => packageFile.id),
            ),
        ).toEqual([
            ["MyLibrary"],
            ["MyLibrary.Extensions"],
            ["MyLibrary"],
            ["MyLibrary.Extensions"],
        ]);
        expect(results.every((result) => result.consumerMode === "per-package")).toBe(true);
        expect(mockedRunDotnet).toHaveBeenCalledTimes(16);
    });
});
