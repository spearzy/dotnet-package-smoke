import AdmZip from "adm-zip";
import { XMLParser } from "fast-xml-parser";

export interface PackageMetadata {
    id: string;
    version: string;
}

function firstString(value: unknown): string | undefined {
    if (typeof value === "string" || typeof value === "number") {
        return String(value);
    }

    if (Array.isArray(value)) {
        return firstString(value[0]);
    }

    return undefined;
}

export function extractPackageMetadata(packagePath: string): PackageMetadata {
    try {
        const zip = new AdmZip(packagePath);

        const nuspecEntries = zip
            .getEntries()
            .filter(
                (entry) =>
                    !entry.isDirectory &&
                    entry.entryName.toLowerCase().endsWith(".nuspec"),
            );

        if (nuspecEntries.length === 0) {
            throw new Error("no .nuspec file was found");
        }

        const nuspecXml = nuspecEntries[0].getData().toString("utf8");

        const parser = new XMLParser({
            ignoreAttributes: false,
            removeNSPrefix: true,
            trimValues: true,
        });

        const parsed = parser.parse(nuspecXml) as {
            package?: {
                metadata?: {
                    id?: unknown;
                    version?: unknown;
                };
            };
        };

        const id = firstString(parsed.package?.metadata?.id)?.trim();
        const version = firstString(parsed.package?.metadata?.version)?.trim();

        if (id === undefined || id.length === 0) {
            throw new Error("the .nuspec metadata does not contain a package id");
        }

        if (version === undefined || version.length === 0) {
            throw new Error("the .nuspec metadata does not contain a package version");
        }

        return { id, version };
    } catch (error: unknown) {
        const detail = error instanceof Error ? error.message : String(error);

        throw new Error(
            `Failed to extract package metadata from '${packagePath}': ${detail}.`,
        );
    }
}
