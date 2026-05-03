import { describe, expect, it } from "vitest";
import {
    parseArgumentInput,
    parseBooleanInput,
    parseConsumerProjectType,
    parseListInput,
} from "../src/inputs";

describe("parseListInput", () => {
    it("parses a single value", () => {
        expect(parseListInput("src/MyLibrary/MyLibrary.csproj")).toEqual([
            "src/MyLibrary/MyLibrary.csproj",
        ]);
    });

    it("parses multiline values", () => {
        expect(
            parseListInput(`
        src/MyLibrary/MyLibrary.csproj
        src/MyLibrary.Extensions/MyLibrary.Extensions.csproj
      `),
        ).toEqual([
            "src/MyLibrary/MyLibrary.csproj",
            "src/MyLibrary.Extensions/MyLibrary.Extensions.csproj",
        ]);
    });

    it("parses comma-separated values", () => {
        expect(
            parseListInput(
                "src/MyLibrary/MyLibrary.csproj, src/MyLibrary.Extensions/MyLibrary.Extensions.csproj",
            ),
        ).toEqual([
            "src/MyLibrary/MyLibrary.csproj",
            "src/MyLibrary.Extensions/MyLibrary.Extensions.csproj",
        ]);
    });

    it("ignores empty entries", () => {
        expect(
            parseListInput(`
        src/MyLibrary/MyLibrary.csproj

        ,
        src/MyLibrary.Extensions/MyLibrary.Extensions.csproj
      `),
        ).toEqual([
            "src/MyLibrary/MyLibrary.csproj",
            "src/MyLibrary.Extensions/MyLibrary.Extensions.csproj",
        ]);
    });
});

describe("parseBooleanInput", () => {
    it("uses the default for an empty value", () => {
        expect(parseBooleanInput("", "generated-consumers", true)).toBe(true);
        expect(parseBooleanInput("", "generated-consumers", false)).toBe(false);
    });

    it("parses true-like values", () => {
        for (const value of ["true", "TRUE", "1", "yes", "y", "on"]) {
            expect(parseBooleanInput(value, "generated-consumers", false)).toBe(true);
        }
    });

    it("parses false-like values", () => {
        for (const value of ["false", "FALSE", "0", "no", "n", "off"]) {
            expect(parseBooleanInput(value, "generated-consumers", true)).toBe(false);
        }
    });

    it("rejects invalid boolean values", () => {
        expect(() =>
            parseBooleanInput("maybe", "generated-consumers", true),
        ).toThrow("Input 'generated-consumers' must be a boolean value");
    });
});

describe("parseArgumentInput", () => {
    it("uses an empty array for an empty value", () => {
        expect(parseArgumentInput("", "pack-arguments")).toEqual([]);
    });

    it("parses simple whitespace-separated arguments", () => {
        expect(
            parseArgumentInput(
                "--include-symbols -p:ContinuousIntegrationBuild=true",
                "pack-arguments",
            ),
        ).toEqual([
            "--include-symbols",
            "-p:ContinuousIntegrationBuild=true",
        ]);
    });

    it("keeps quoted values as one argument", () => {
        expect(
            parseArgumentInput(
                '--include-symbols -p:PackageReleaseNotes="Fixed restore issue"',
                "pack-arguments",
            ),
        ).toEqual([
            "--include-symbols",
            "-p:PackageReleaseNotes=Fixed restore issue",
        ]);
    });

    it("supports single quoted values", () => {
        expect(
            parseArgumentInput(
                "-p:Description='My Library package'",
                "pack-arguments",
            ),
        ).toEqual(["-p:Description=My Library package"]);
    });

    it("supports escaped characters", () => {
        expect(
            parseArgumentInput(
                '--property:PackageReleaseNotes="Contains \\"quoted\\" text"',
                "pack-arguments",
            ),
        ).toEqual(["--property:PackageReleaseNotes=Contains \"quoted\" text"]);
    });

    it("rejects unterminated quoted values", () => {
        expect(() =>
            parseArgumentInput(
                '-p:PackageReleaseNotes="Missing end quote',
                "pack-arguments",
            ),
        ).toThrow("Input 'pack-arguments' contains an unterminated quoted value.");
    });
});

describe("parseConsumerProjectType", () => {
    it("uses classlib by default", () => {
        expect(parseConsumerProjectType("")).toBe("classlib");
    });

    it("parses supported project types", () => {
        expect(parseConsumerProjectType("classlib")).toBe("classlib");
        expect(parseConsumerProjectType("console")).toBe("console");
    });

    it("rejects unsupported project types", () => {
        expect(() => parseConsumerProjectType("web")).toThrow(
            "Input 'consumer-project-type' must be one of: classlib, console.",
        );
    });
});
