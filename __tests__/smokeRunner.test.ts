import { afterEach, describe, expect, it, vi } from "vitest";
import { runSmokeProjects } from "../src/smokeRunner";

// Smoke project tests should not run the real dotnet CLI. These tests care
// about command flow: restore first, test only after restore succeeds.
vi.mock("../src/dotnet", async (importOriginal) => {
    const actual = await importOriginal<typeof import("../src/dotnet")>();

    return {
        ...actual,
        runDotnet: vi.fn(),
    };
});

const { runDotnet } = await import("../src/dotnet");
const mockedRunDotnet = vi.mocked(runDotnet);

describe("runSmokeProjects", () => {
    afterEach(() => {
        vi.resetAllMocks();
    });

    it("returns a successful result when restore and test pass", async () => {
        mockedRunDotnet.mockResolvedValue({
            exitCode: 0,
            stdout: "",
            stderr: "",
        });

        const results = await runSmokeProjects(
            ["/repo/smoke/MyLibrary.Tests/MyLibrary.Tests.csproj"],
            "/repo",
            "Release",
            "/tmp/feed",
            { info: () => undefined },
        );

        expect(results).toHaveLength(1);
        expect(results[0]).toMatchObject({
            projectPath: "/repo/smoke/MyLibrary.Tests/MyLibrary.Tests.csproj",
            restoreSucceeded: true,
            testSucceeded: true,
            failureStage: null,
            failureOutput: "",
        });
        expect(mockedRunDotnet).toHaveBeenCalledTimes(2);
    });

    it("returns a failed restore result without running test", async () => {
        mockedRunDotnet.mockResolvedValueOnce({
            exitCode: 1,
            stdout: "restore failed",
            stderr: "NU1101",
        });

        const results = await runSmokeProjects(
            ["/repo/smoke/MyLibrary.Tests/MyLibrary.Tests.csproj"],
            "/repo",
            "Release",
            "/tmp/feed",
            { info: () => undefined },
        );

        expect(results[0]).toMatchObject({
            restoreSucceeded: false,
            testSucceeded: false,
            failureStage: "restore",
            failureOutput: "restore failed\nNU1101",
        });
        expect(mockedRunDotnet).toHaveBeenCalledTimes(1);
    });

    it("returns a failed test result after successful restore", async () => {
        mockedRunDotnet
            .mockResolvedValueOnce({ exitCode: 0, stdout: "", stderr: "" })
            .mockResolvedValueOnce({
                exitCode: 1,
                stdout: "test failed",
                stderr: "Expected true but got false",
            });

        const results = await runSmokeProjects(
            ["/repo/smoke/MyLibrary.Tests/MyLibrary.Tests.csproj"],
            "/repo",
            "Release",
            "/tmp/feed",
            { info: () => undefined },
        );

        expect(results[0]).toMatchObject({
            restoreSucceeded: true,
            testSucceeded: false,
            failureStage: "test",
            failureOutput: "test failed\nExpected true but got false",
        });
        expect(mockedRunDotnet).toHaveBeenCalledTimes(2);
    });

    it("redirects build output away from the repository", async () => {
        mockedRunDotnet.mockResolvedValue({
            exitCode: 0,
            stdout: "",
            stderr: "",
        });

        await runSmokeProjects(
            ["/repo/smoke/MyLibrary.Tests/MyLibrary.Tests.csproj"],
            "/repo",
            "Release",
            "/tmp/feed",
            { info: () => undefined },
        );

        const firstCallArgs = mockedRunDotnet.mock.calls[0][0];

        expect(firstCallArgs).toContainEqual(expect.stringContaining("-p:BaseOutputPath="));
        expect(firstCallArgs).toContainEqual(expect.stringContaining("-p:BaseIntermediateOutputPath="));
    });
});
