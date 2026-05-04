import type { PackageFile } from "./packages.js";

export function createPackagesJson(packages: PackageFile[]): string {
    return JSON.stringify(packages);
}
