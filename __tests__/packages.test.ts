import { describe, expect, it } from "vitest";
import AdmZip from "adm-zip";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { findPackageFiles } from "../src/packages";

function writePackage(
    packagePath: string,
    id: string,
    version: string,
): void {
    const zip = new AdmZip();

    zip.addFile(
        `${id}.nuspec`,
        Buffer.from(
            `
      <package>
        <metadata>
          <id>${id}</id>
          <version>${version}</version>
        </metadata>
      </package>
      `,
            "utf8",
        ),
    );

    zip.writeZip(packagePath);
}

describe("findPackageFiles", () => {
    it("finds nupkg files and ignores symbol packages", async () => {
        const directory = await fs.mkdtemp(
            path.join(os.tmpdir(), "dotnet-package-smoke-"),
        );

        writePackage(
            path.join(directory, "MyLibrary.1.0.0.nupkg"),
            "MyLibrary",
            "1.0.0",
        );

        writePackage(
            path.join(directory, "MyLibrary.1.0.0.snupkg"),
            "MyLibrary",
            "1.0.0",
        );

        await fs.writeFile(path.join(directory, "notes.txt"), "");

        const packages = await findPackageFiles(directory);

        expect(packages).toEqual([
            {
                name: "MyLibrary.1.0.0.nupkg",
                path: path.join(directory, "MyLibrary.1.0.0.nupkg"),
                id: "MyLibrary",
                version: "1.0.0",
            },
        ]);
    });

    it("sorts package files by name", async () => {
        const directory = await fs.mkdtemp(
            path.join(os.tmpdir(), "dotnet-package-smoke-"),
        );

        writePackage(path.join(directory, "B.1.0.0.nupkg"), "B", "1.0.0");
        writePackage(path.join(directory, "A.1.0.0.nupkg"), "A", "1.0.0");

        const packages = await findPackageFiles(directory);

        expect(packages.map((packageFile) => packageFile.name)).toEqual([
            "A.1.0.0.nupkg",
            "B.1.0.0.nupkg",
        ]);
    });
});
