import { describe, expect, it } from "vitest";
import { createPackagesJson } from "../src/outputs";

describe("createPackagesJson", () => {
    it("serialises package metadata for downstream workflow steps", () => {
        const packagesJson = createPackagesJson([
            {
                name: "MyLibrary.1.0.0.nupkg",
                path: "/tmp/artifacts/MyLibrary.1.0.0.nupkg",
                id: "MyLibrary",
                version: "1.0.0",
            },
            {
                name: "MyLibrary.Extensions.1.0.0.nupkg",
                path: "/tmp/artifacts/MyLibrary.Extensions.1.0.0.nupkg",
                id: "MyLibrary.Extensions",
                version: "1.0.0",
            },
        ]);

        expect(JSON.parse(packagesJson)).toEqual([
            {
                name: "MyLibrary.1.0.0.nupkg",
                path: "/tmp/artifacts/MyLibrary.1.0.0.nupkg",
                id: "MyLibrary",
                version: "1.0.0",
            },
            {
                name: "MyLibrary.Extensions.1.0.0.nupkg",
                path: "/tmp/artifacts/MyLibrary.Extensions.1.0.0.nupkg",
                id: "MyLibrary.Extensions",
                version: "1.0.0",
            },
        ]);
    });
});
