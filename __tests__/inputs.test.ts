import { describe, expect, it } from "vitest";
import { parseBooleanInput, parseListInput } from "../src/inputs";

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