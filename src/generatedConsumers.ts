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
} from "./dotnet";
import { ConsumerProjectType } from "./inputs";
import { Logger } from "./logger";
import { createNuGetConfig } from "./nugetConfig";
import { PackageFile } from "./packages";

export type GeneratedConsumerFailureStage = "create" | "install" | "restore" | "build";

export interface GeneratedConsumerResult {
    targetFramework: string;
    projectType: ConsumerProjectType;
    projectPath: string;
    packagesInstalled: PackageFile[];
    installSucceeded: boolean;
    restoreSucceeded: boolean;
    buildSucceeded: boolean;
    failureStage: GeneratedConsumerFailureStage | null;
    failureOutput: string;
    retainedWorkspace: string | null;
}

function safeName(value: string): string {
    return value.replace(/[^A-Za-z0-9_]/g, "_");
}

function generatedConsumerProjectName(targetFramework: string): string {
    return `DotnetPackageSmokeConsumer_${safeName(targetFramework)}`;
}

function commandOutput(result: CommandResult): string {
    return `${result.stdout}\n${result.stderr}`.trim();
}

async function createGeneratedConsumer(
    targetFramework: string,
    projectType: ConsumerProjectType,
    configuration: string,
    workspaceDirectory: string,
    nugetConfigPath: string,
    localFeedDirectory: string,
    packages: PackageFile[],
    logger: Logger,
): Promise<GeneratedConsumerResult> {
    const projectName = generatedConsumerProjectName(targetFramework);
    const projectDirectory = path.join(workspaceDirectory, targetFramework);
    const projectPath = path.join(projectDirectory, `${projectName}.csproj`);
    const resultBase = {
        targetFramework,
        projectType,
        projectPath,
        packagesInstalled: packages,
        retainedWorkspace: null,
    };

    logger.info(`Creating generated consumer for ${targetFramework}.`);

    const create = await runDotnet(
        buildNewConsumerArgs(projectType, projectName, projectDirectory, targetFramework),
        workspaceDirectory,
    );
    if (create.exitCode !== 0) {
        return {
            ...resultBase,
            installSucceeded: false,
            restoreSucceeded: false,
            buildSucceeded: false,
            failureStage: "create",
            failureOutput: commandOutput(create),
        };
    }

    for (const packageFile of packages) {
        logger.info(`Adding package ${packageFile.id} ${packageFile.version} to generated consumer ${targetFramework}.`);

        const add = await runDotnet(
            buildAddPackageArgs(projectPath, packageFile.id, packageFile.version, localFeedDirectory),
            workspaceDirectory,
        );

        if (add.exitCode !== 0) {
            return {
                ...resultBase,
                installSucceeded: false,
                restoreSucceeded: false,
                buildSucceeded: false,
                failureStage: "install",
                failureOutput: commandOutput(add),
            };
        }
    }

    logger.info(`Restoring generated consumer for ${targetFramework}.`);
    const restore = await runDotnet(
        buildRestoreArgs(projectPath, nugetConfigPath, true),
        workspaceDirectory,
    );
    if (restore.exitCode !== 0) {
        return {
            ...resultBase,
            installSucceeded: true,
            restoreSucceeded: false,
            buildSucceeded: false,
            failureStage: "restore",
            failureOutput: commandOutput(restore),
        };
    }

    logger.info(`Building generated consumer for ${targetFramework}.`);
    const build = await runDotnet(
        buildBuildArgs(projectPath, configuration, true),
        workspaceDirectory,
    );
    if (build.exitCode !== 0) {
        return {
            ...resultBase,
            installSucceeded: true,
            restoreSucceeded: true,
            buildSucceeded: false,
            failureStage: "build",
            failureOutput: commandOutput(build),
        };
    }

    return {
        ...resultBase,
        installSucceeded: true,
        restoreSucceeded: true,
        buildSucceeded: true,
        failureStage: null,
        failureOutput: "",
    };
}

export async function runGeneratedConsumers(
    targetFrameworks: string[],
    projectType: ConsumerProjectType,
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

        for (const targetFramework of targetFrameworks) {
            results.push(
                await createGeneratedConsumer(
                    targetFramework,
                    projectType,
                    configuration,
                    workspaceDirectory,
                    nugetConfigPath,
                    localFeedDirectory,
                    packages,
                    logger,
                ),
            );
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
