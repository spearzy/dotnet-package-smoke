import type { GeneratedConsumerFailureStage } from "./generatedConsumers.js";
import type { PackageFile } from "./packages.js";

export type GeneratedConsumerFailureKind =
    | "package-not-found"
    | "dependency-not-found"
    | "target-framework-incompatible"
    | "restore-source-unavailable"
    | "build-error"
    | "error";

export interface GeneratedConsumerFailureClassification {
    kind: GeneratedConsumerFailureKind;
    detail: string | null;
}

export function generatedConsumerFailureKindLabel(
    kind: GeneratedConsumerFailureKind | null,
): string {
    switch (kind) {
        case "package-not-found":
            return "Package not found";
        case "dependency-not-found":
            return "Dependency not found";
        case "target-framework-incompatible":
            return "Target framework incompatible";
        case "restore-source-unavailable":
            return "Restore source unavailable";
        case "build-error":
            return "Build error";
        case "error":
        case null:
            return "Error";
    }
}

export function classifyGeneratedConsumerFailure(
    stage: GeneratedConsumerFailureStage,
    output: string,
    packages: PackageFile[],
): GeneratedConsumerFailureClassification {
    if (isTargetFrameworkIncompatible(output)) {
        return {
            kind: "target-framework-incompatible",
            detail: "The package is not compatible with the generated consumer target framework.",
        };
    }

    if (isRestoreSourceUnavailable(output)) {
        return {
            kind: "restore-source-unavailable",
            detail: "A package source could not be reached during restore.",
        };
    }

    const missingPackageId = findMissingPackageId(output);

    if (missingPackageId !== null) {
        if (stage === "install" || isProducedPackage(missingPackageId, packages)) {
            return {
                kind: "package-not-found",
                detail: `The produced package '${missingPackageId}' could not be found in the local feed.`,
            };
        }

        return {
            kind: "dependency-not-found",
            detail: `The package dependency '${missingPackageId}' could not be found during restore.`,
        };
    }

    if (stage === "build") {
        return {
            kind: "build-error",
            detail: "The generated consumer restored successfully but failed to build.",
        };
    }

    return {
        kind: "error",
        detail: null,
    };
}

function isProducedPackage(packageId: string, packages: PackageFile[]): boolean {
    return packages.some(
        (packageFile) => packageFile.id.toLowerCase() === packageId.toLowerCase(),
    );
}

function isTargetFrameworkIncompatible(output: string): boolean {
    return /NU1202\b/i.test(output) || /not compatible with/i.test(output);
}

function isRestoreSourceUnavailable(output: string): boolean {
    return /NU1301\b/i.test(output) ||
        /NU1801\b/i.test(output) ||
        /Unable to load the service index/i.test(output);
}

function findMissingPackageId(output: string): string | null {
    const match = output.match(/NU110[12]:\s+Unable to find package\s+([^\r\n]+)/i);
    const firstToken = match?.[1].trim().split(/\s+/)[0];

    return firstToken?.replace(/[.,;:]$/, "") ?? null;
}
