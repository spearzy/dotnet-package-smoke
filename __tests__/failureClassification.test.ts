import { describe, expect, it } from "vitest";
import {
    classifyGeneratedConsumerFailure,
    generatedConsumerFailureKindLabel,
} from "../src/failureClassification";
import type { PackageFile } from "../src/packages";

const packages: PackageFile[] = [
    {
        name: "MyLibrary.Extensions.1.0.0.nupkg",
        path: "/tmp/artifacts/MyLibrary.Extensions.1.0.0.nupkg",
        id: "MyLibrary.Extensions",
        version: "1.0.0",
    },
];

describe("classifyGeneratedConsumerFailure", () => {
    it("classifies produced package lookup failures", () => {
        expect(
            classifyGeneratedConsumerFailure(
                "install",
                "NU1101: Unable to find package MyLibrary.Extensions. No packages exist with this id in source(s): local",
                packages,
            ),
        ).toEqual({
            kind: "package-not-found",
            detail: "The produced package 'MyLibrary.Extensions' could not be found in the local feed.",
        });
    });

    it("classifies dependency lookup failures", () => {
        expect(
            classifyGeneratedConsumerFailure(
                "restore",
                "NU1101: Unable to find package MyLibrary.Dependency. No packages exist with this id in source(s): local",
                packages,
            ),
        ).toEqual({
            kind: "dependency-not-found",
            detail: "The package dependency 'MyLibrary.Dependency' could not be found during restore.",
        });
    });

    it("classifies incompatible target frameworks", () => {
        expect(
            classifyGeneratedConsumerFailure(
                "restore",
                "NU1202: Package MyLibrary.Extensions 1.0.0 is not compatible with net8.0",
                packages,
            ),
        ).toEqual({
            kind: "target-framework-incompatible",
            detail: "The package is not compatible with the generated consumer target framework.",
        });
    });

    it("classifies unavailable restore sources", () => {
        expect(
            classifyGeneratedConsumerFailure(
                "restore",
                "NU1301: Unable to load the service index for source https://api.nuget.org/v3/index.json.",
                packages,
            ),
        ).toEqual({
            kind: "restore-source-unavailable",
            detail: "A package source could not be reached during restore.",
        });
    });

    it("classifies generated consumer build failures", () => {
        expect(
            classifyGeneratedConsumerFailure(
                "build",
                "CS0246: The type or namespace name 'MissingType' could not be found",
                packages,
            ),
        ).toEqual({
            kind: "build-error",
            detail: "The generated consumer restored successfully but failed to build.",
        });
    });

    it("uses an error fallback without adding fake detail", () => {
        expect(
            classifyGeneratedConsumerFailure("create", "template failed", packages),
        ).toEqual({
            kind: "error",
            detail: null,
        });
    });
});

describe("generatedConsumerFailureKindLabel", () => {
    it("formats error types for summaries", () => {
        expect(generatedConsumerFailureKindLabel("package-not-found")).toBe("Package not found");
        expect(generatedConsumerFailureKindLabel("error")).toBe("Error");
        expect(generatedConsumerFailureKindLabel(null)).toBe("Error");
    });
});
