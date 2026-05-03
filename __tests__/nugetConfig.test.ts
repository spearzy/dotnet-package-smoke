import { describe, expect, it } from "vitest";
import { createNuGetConfig } from "../src/nugetConfig";

describe("createNuGetConfig", () => {
    it("creates a config with the local feed first and nuget.org second", () => {
        expect(createNuGetConfig("/tmp/feed", "/tmp/packages")).toContain(
            '<add key="dotnet-package-smoke-local" value="/tmp/feed" />',
        );
        expect(createNuGetConfig("/tmp/feed", "/tmp/packages")).toContain(
            '<add key="nuget.org" value="https://api.nuget.org/v3/index.json" />',
        );
    });

    it("uses an isolated global packages folder", () => {
        expect(createNuGetConfig("/tmp/feed", "/tmp/packages")).toContain(
            '<add key="globalPackagesFolder" value="/tmp/packages" />',
        );
    });

    it("escapes the local feed path for XML", () => {
        expect(createNuGetConfig("/tmp/a&b", "/tmp/packages")).toContain('value="/tmp/a&amp;b"');
    });
});
