import { describe, expect, it } from "vitest";
import {
    buildBuildArgs,
    buildPackArgs,
    buildRestoreArgs,
} from "../src/dotnet";

describe("dotnet argument builders", () => {
    it("builds restore args", () => {
        expect(buildRestoreArgs("src/MyLibrary/MyLibrary.csproj")).toEqual([
            "restore",
            "src/MyLibrary/MyLibrary.csproj",
        ]);
    });

    it("builds build args without no-restore", () => {
        expect(buildBuildArgs("src/MyLibrary/MyLibrary.csproj", "Release", false))
            .toEqual([
                "build",
                "src/MyLibrary/MyLibrary.csproj",
                "-c",
                "Release",
            ]);
    });

    it("builds build args with no-restore", () => {
        expect(buildBuildArgs("src/MyLibrary/MyLibrary.csproj", "Release", true))
            .toEqual([
                "build",
                "src/MyLibrary/MyLibrary.csproj",
                "-c",
                "Release",
                "--no-restore",
            ]);
    });

    it("builds pack args", () => {
        expect(
            buildPackArgs(
                "src/MyLibrary/MyLibrary.csproj",
                "Release",
                "/tmp/artifacts",
            ),
        ).toEqual([
            "pack",
            "src/MyLibrary/MyLibrary.csproj",
            "-c",
            "Release",
            "--output",
            "/tmp/artifacts",
        ]);
    });
});
