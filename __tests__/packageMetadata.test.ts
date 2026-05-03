import { describe, expect, it } from "vitest";
import AdmZip from "adm-zip";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { extractPackageMetadata } from "../src/packageMetadata";

async function createPackage(
    packageName: string,
    nuspecXml: string,
): Promise<string> {
    const directory = await fs.mkdtemp(
        path.join(os.tmpdir(), "dotnet-package-smoke-"),
    );

    const packagePath = path.join(directory, packageName);
    const zip = new AdmZip();

    zip.addFile("MyLibrary.nuspec", Buffer.from(nuspecXml, "utf8"));
    zip.writeZip(packagePath);

    return packagePath;
}

describe("extractPackageMetadata", () => {
    it("extracts package id and version from nuspec", async () => {
        const packagePath = await createPackage(
            "MyLibrary.1.2.3.nupkg",
            `
      <package>
        <metadata>
          <id>MyLibrary</id>
          <version>1.2.3</version>
        </metadata>
      </package>
      `,
        );

        expect(extractPackageMetadata(packagePath)).toEqual({
            id: "MyLibrary",
            version: "1.2.3",
        });
    });

    it("fails clearly when the package has no nuspec", async () => {
        const directory = await fs.mkdtemp(
            path.join(os.tmpdir(), "dotnet-package-smoke-"),
        );

        const packagePath = path.join(directory, "Broken.1.0.0.nupkg");
        const zip = new AdmZip();

        zip.addFile("readme.txt", Buffer.from("hello", "utf8"));
        zip.writeZip(packagePath);

        expect(() => extractPackageMetadata(packagePath)).toThrow(
            "no .nuspec file was found",
        );
    });
});
