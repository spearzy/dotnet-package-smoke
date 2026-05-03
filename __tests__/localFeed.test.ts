import { describe, expect, it } from "vitest";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { cleanLocalFeed, copyPackagesToLocalFeed } from "../src/localFeed";
import { PackageFile } from "../src/packages";

describe("local feed", () => {
    it("removes existing package files but keeps other files", async () => {
        const directory = await fs.mkdtemp(
            path.join(os.tmpdir(), "dotnet-package-smoke-"),
        );

        await fs.writeFile(path.join(directory, "Old.1.0.0.nupkg"), "");
        await fs.writeFile(path.join(directory, "Old.1.0.0.snupkg"), "");
        await fs.writeFile(path.join(directory, "notes.txt"), "");

        await cleanLocalFeed(directory);

        await expect(fs.access(path.join(directory, "Old.1.0.0.nupkg")))
            .rejects.toThrow();

        await expect(fs.access(path.join(directory, "Old.1.0.0.snupkg")))
            .rejects.toThrow();

        await expect(fs.access(path.join(directory, "notes.txt")))
            .resolves.toBeUndefined();
    });

    it("copies packages into the local feed directory", async () => {
        const sourceDirectory = await fs.mkdtemp(
            path.join(os.tmpdir(), "dotnet-package-smoke-source-"),
        );

        const feedDirectory = await fs.mkdtemp(
            path.join(os.tmpdir(), "dotnet-package-smoke-feed-"),
        );

        const sourcePackagePath = path.join(sourceDirectory, "MyLibrary.1.0.0.nupkg");

        await fs.writeFile(sourcePackagePath, "package contents");

        const packages: PackageFile[] = [
            {
                name: "MyLibrary.1.0.0.nupkg",
                path: sourcePackagePath,
                id: "MyLibrary",
                version: "1.0.0",
            },
        ];

        await copyPackagesToLocalFeed(packages, feedDirectory);

        await expect(
            fs.readFile(path.join(feedDirectory, "MyLibrary.1.0.0.nupkg"), "utf8"),
        ).resolves.toBe("package contents");
    });
});
