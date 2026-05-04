import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import {
    buildAddPackageArgs,
    buildBuildArgs,
    buildNewConsumerArgs,
    buildRestoreArgs,
    CommandResult,
    runDotnet,
} from "./dotnet.js";
import {
    classifyGeneratedConsumerFailure,
    type GeneratedConsumerFailureKind,
} from "./failureClassification.js";
import type { ConsumerMode, ConsumerProjectType } from "./inputs.js";
import { Logger } from "./logger.js";
import { createNuGetConfig } from "./nugetConfig.js";
import type { PackageFile } from "./packages.js";

export type GeneratedConsumerFailureStage = "create" | "install" | "restore" | "build";

export interface GeneratedConsumerResult {
    targetFramework: string;
    projectType: ConsumerProjectType;
    consumerMode: ConsumerMode;
    projectPath: string;
    packagesInstalled: PackageFile[];
    installSucceeded: boolean;
    restoreSucceeded: boolean;
    buildSucceeded: boolean;
    failureStage: GeneratedConsumerFailureStage | null;
    failureKind: GeneratedConsumerFailureKind | null;
    failureDetail: string | null;
    failureOutput: string;
    retainedWorkspace: string | null;
}

function safeName(value: string): string {
    return value.replace(/[^A-Za-z0-9_]/g, "_");
}

function packageScopeName(packages: PackageFile[]): string {
    if (packages.length === 1) {
        return safeName(packages[0].id);
    }

    return "combined";
}

function packageScopeLabel(packages: PackageFile[]): string {
    if (packages.length === 1) {
        const packageFile = packages[0];

        return `${packageFile.id} ${packageFile.version}`;
    }

    return `${packages.length} packages`;
}

function generatedConsumerProjectName(
    targetFramework: string,
    consumerMode: ConsumerMode,
    packages: PackageFile[],
): string {
    const baseName = `DotnetPackageSmokeConsumer_${safeName(targetFramework)}`;

    if (consumerMode === "combined") {
        return baseName;
    }

    return `${baseName}_${packageScopeName(packages)}`;
}

function generatedConsumerProjectDirectory(
    workspaceDirectory: string,
    targetFramework: string,
    consumerMode: ConsumerMode,
    packages: PackageFile[],
): string {
    if (consumerMode === "combined") {
        return path.join(workspaceDirectory, targetFramework);
    }

    return path.join(
        workspaceDirectory,
        targetFramework,
        packageScopeName(packages),
    );
}

function commandOutput(result: CommandResult): string {
    return `${result.stdout}\n${result.stderr}`.trim();
}

function failedResult(
    resultBase: Pick<
        GeneratedConsumerResult,
        | "targetFramework"
        | "projectType"
        | "consumerMode"
        | "projectPath"
        | "packagesInstalled"
        | "retainedWorkspace"
    >,
    stage: GeneratedConsumerFailureStage,
    output: string,
    state: Pick<
        GeneratedConsumerResult,
        "installSucceeded" | "restoreSucceeded" | "buildSucceeded"
    >,
): GeneratedConsumerResult {
    const classification = classifyGeneratedConsumerFailure(
        stage,
        output,
        resultBase.packagesInstalled,
    );

    return {
        ...resultBase,
        ...state,
        failureStage: stage,
        failureKind: classification.kind,
        failureDetail: classification.detail,
        failureOutput: output,
    };
}

async function createGeneratedConsumer(
    targetFramework: string,
    projectType: ConsumerProjectType,
    consumerMode: ConsumerMode,
    configuration: string,
    workspaceDirectory: string,
    nugetConfigPath: string,
    localFeedDirectory: string,
    packages: PackageFile[],
    logger: Logger,
): Promise<GeneratedConsumerResult> {
    const projectName = generatedConsumerProjectName(targetFramework, consumerMode, packages);
    const projectDirectory = generatedConsumerProjectDirectory(
        workspaceDirectory,
        targetFramework,
        consumerMode,
        packages,
    );
    const projectPath = path.join(projectDirectory, `${projectName}.csproj`);
    const resultBase = {
        targetFramework,
        projectType,
        consumerMode,
        projectPath,
        packagesInstalled: packages,
        retainedWorkspace: null,
    };

    logger.info(
        `Creating generated consumer for ${targetFramework} (${packageScopeLabel(packages)}).`,
    );

    const create = await runDotnet(
        buildNewConsumerArgs(projectType, projectName, projectDirectory, targetFramework),
        workspaceDirectory,
    );
    if (create.exitCode !== 0) {
        return failedResult(resultBase, "create", commandOutput(create), {
            installSucceeded: false,
            restoreSucceeded: false,
            buildSucceeded: false,
        });
    }

    for (const packageFile of packages) {
        logger.info(
            `Adding package ${packageFile.id} ${packageFile.version} to generated consumer ${targetFramework}.`,
        );

        const add = await runDotnet(
            buildAddPackageArgs(projectPath, packageFile.id, packageFile.version, localFeedDirectory),
            workspaceDirectory,
        );

        if (add.exitCode !== 0) {
            return failedResult(resultBase, "install", commandOutput(add), {
                installSucceeded: false,
                restoreSucceeded: false,
                buildSucceeded: false,
            });
        }
    }

    logger.info(`Restoring generated consumer for ${targetFramework}.`);
    const restore = await runDotnet(
        buildRestoreArgs(projectPath, nugetConfigPath, true),
        workspaceDirectory,
    );
    if (restore.exitCode !== 0) {
        return failedResult(resultBase, "restore", commandOutput(restore), {
            installSucceeded: true,
            restoreSucceeded: false,
            buildSucceeded: false,
        });
    }

    logger.info(`Building generated consumer for ${targetFramework}.`);
    const build = await runDotnet(
        buildBuildArgs(projectPath, configuration, true),
        workspaceDirectory,
    );
    if (build.exitCode !== 0) {
        return failedResult(resultBase, "build", commandOutput(build), {
            installSucceeded: true,
            restoreSucceeded: true,
            buildSucceeded: false,
        });
    }

    return {
        ...resultBase,
        installSucceeded: true,
        restoreSucceeded: true,
        buildSucceeded: true,
        failureStage: null,
        failureKind: null,
        failureDetail: null,
        failureOutput: "",
    };
}

export async function runGeneratedConsumers(
    targetFrameworks: string[],
    projectType: ConsumerProjectType,
    consumerMode: ConsumerMode,
    configuration: string,
    localFeedDirectory: string,
    packages: PackageFile[],
    retainOnFailure: boolean,
    logger: Logger,
): Promise<GeneratedConsumerResult[]> {
    const workspaceDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "dotnet-package-smoke-consumers-"));
    const nugetConfigPath = path.join(workspaceDirectory, "NuGet.config");
    const globalPackagesFolder = path.join(workspaceDirectory, "packages");
    let retainWorkspace = false;

    try {
        await fs.writeFile(
            nugetConfigPath,
            createNuGetConfig(localFeedDirectory, globalPackagesFolder),
            "utf8",
        );

        const results: GeneratedConsumerResult[] = [];
        const packageGroups = consumerMode === "combined"
            ? [packages]
            : packages.map((packageFile) => [packageFile]);

        for (const targetFramework of targetFrameworks) {
            for (const packageGroup of packageGroups) {
                results.push(
                    await createGeneratedConsumer(
                        targetFramework,
                        projectType,
                        consumerMode,
                        configuration,
                        workspaceDirectory,
                        nugetConfigPath,
                        localFeedDirectory,
                        packageGroup,
                        logger,
                    ),
                );
            }
        }

        retainWorkspace = retainOnFailure && results.some(
            (result) =>
                !result.installSucceeded ||
                !result.restoreSucceeded ||
                !result.buildSucceeded,
        );

        if (!retainWorkspace) {
            return results;
        }

        logger.info(`Retaining generated consumer workspace: ${workspaceDirectory}`);

        return results.map((result) => {
            if (result.installSucceeded && result.restoreSucceeded && result.buildSucceeded) {
                return result;
            }

            return {
                ...result,
                retainedWorkspace: workspaceDirectory,
            };
        });
    } finally {
        if (!retainWorkspace) {
            await fs.rm(workspaceDirectory, { recursive: true, force: true });
        }
    }
}
