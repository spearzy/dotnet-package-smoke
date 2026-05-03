import * as fs from "node:fs/promises";
import * as path from "node:path";
import { PackageFile } from "./packages";

export async function cleanLocalFeed(directory: string): Promise<void> {
    await fs.mkdir(directory, { recursive: true });

    const entries = await fs.readdir(directory, { withFileTypes: true });

    await Promise.all(
        entries
            .filter((entry) => entry.isFile() && /\.(s)?nupkg$/i.test(entry.name))
            .map((entry) => fs.unlink(path.join(directory, entry.name))),
    );
}

export async function copyPackagesToLocalFeed(
    packages: PackageFile[],
    localFeedDirectory: string,
): Promise<void> {
    await fs.mkdir(localFeedDirectory, { recursive: true });

    for (const packageFile of packages) {
        await fs.copyFile(
            packageFile.path,
            path.join(localFeedDirectory, packageFile.name),
        );
    }
}
