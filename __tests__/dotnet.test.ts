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

    it("builds pack args with --no-build when the project was already built", () => {
        expect(
            buildPackArgs(
                "src/MyLibrary/MyLibrary.csproj",
                "Release",
                "/tmp/artifacts",
                true,
                true,
            ),
        ).toEqual([
            "pack",
            "src/MyLibrary/MyLibrary.csproj",
            "-c",
            "Release",
            "--output",
            "/tmp/artifacts",
            "--no-build",
        ]);
    });

    it("builds pack args with --no-restore when the project was restored but not built", () => {
        expect(
            buildPackArgs(
                "src/MyLibrary/MyLibrary.csproj",
                "Release",
                "/tmp/artifacts",
                true,
                false,
            ),
        ).toEqual([
            "pack",
            "src/MyLibrary/MyLibrary.csproj",
            "-c",
            "Release",
            "--output",
            "/tmp/artifacts",
            "--no-restore",
        ]);
    });

});
