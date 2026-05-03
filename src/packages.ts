import * as fs from "node:fs/promises";
import * as path from "node:path";

export interface PackageFile {
    name: string;
    path: string;
}

export async function findPackageFiles(
    artifactsDirectory: string,
): Promise<PackageFile[]> {
    const entries = await fs.readdir(artifactsDirectory, { withFileTypes: true });

    return entries
        .filter((entry) => entry.isFile())
        .filter((entry) => entry.name.toLowerCase().endsWith(".nupkg"))
        .filter((entry) => !entry.name.toLowerCase().endsWith(".snupkg"))
        .map((entry) => ({
            name: entry.name,
            path: path.join(artifactsDirectory, entry.name),
        }))
        .sort((left, right) => left.name.localeCompare(right.name));
}
