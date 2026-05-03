import { describe, expect, it } from "vitest";
import * as path from "node:path";
import { buildGlobPatterns } from "../src/glob";

describe("buildGlobPatterns", () => {
    it("resolves relative patterns from the working directory", () => {
        const workingDirectory = path.resolve("/repo");

        expect(
            buildGlobPatterns(["src/**/*.csproj"], workingDirectory),
        ).toEqual([path.join(workingDirectory, "src/**/*.csproj")]);
    });

    it("preserves negated patterns", () => {
        const workingDirectory = path.resolve("/repo");

        expect(
            buildGlobPatterns(["src/**/*.csproj", "!src/**/*.Tests.csproj"], workingDirectory),
        ).toEqual([
            path.join(workingDirectory, "src/**/*.csproj"),
            `!${path.join(workingDirectory, "src/**/*.Tests.csproj")}`,
        ]);
    });
});
