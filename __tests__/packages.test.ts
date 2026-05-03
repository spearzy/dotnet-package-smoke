import { describe, expect, it } from "vitest";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { findPackageFiles } from "../src/packages";

describe("findPackageFiles", () => {
    it("finds nupkg files and ignores symbol packages", async () => {
        const directory = await fs.mkdtemp(
            path.join(os.tmpdir(), "dotnet-package-smoke-"),
        );

        await fs.writeFile(path.join(directory, "MyLibrary.1.0.0.nupkg"), "");
        await fs.writeFile(path.join(directory, "MyLibrary.1.0.0.snupkg"), "");
        await fs.writeFile(path.join(directory, "notes.txt"), "");

        const packages = await findPackageFiles(directory);

        expect(packages).toEqual([
            {
                name: "MyLibrary.1.0.0.nupkg",
                path: path.join(directory, "MyLibrary.1.0.0.nupkg"),
            },
        ]);
    });

    it("sorts package files by name", async () => {
        const directory = await fs.mkdtemp(
            path.join(os.tmpdir(), "dotnet-package-smoke-"),
        );

        await fs.writeFile(path.join(directory, "B.1.0.0.nupkg"), "");
        await fs.writeFile(path.join(directory, "A.1.0.0.nupkg"), "");

        const packages = await findPackageFiles(directory);

        expect(packages.map((packageFile) => packageFile.name)).toEqual([
            "A.1.0.0.nupkg",
            "B.1.0.0.nupkg",
        ]);
    });
});
