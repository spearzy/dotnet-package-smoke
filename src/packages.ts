import * as fs from "node:fs/promises";
import * as path from "node:path";
import { extractPackageMetadata } from "./packageMetadata";

export interface PackageFile {
    name: string;
    path: string;
    id: string;
    version: string;
}


export async function findPackageFiles(
    artifactsDirectory: string,
): Promise<PackageFile[]> {
    const entries = await fs.readdir(artifactsDirectory, { withFileTypes: true });

    return entries
        .filter((entry) => entry.isFile())
        .filter((entry) => entry.name.toLowerCase().endsWith(".nupkg"))
        .filter((entry) => !entry.name.toLowerCase().endsWith(".snupkg"))
        .map((entry) => {
            const packagePath = path.join(artifactsDirectory, entry.name);
            const metadata = extractPackageMetadata(packagePath);

            return {
                name: entry.name,
                path: packagePath,
                id: metadata.id,
                version: metadata.version,
            };
        })
        .sort((left, right) => left.name.localeCompare(right.name));
}
