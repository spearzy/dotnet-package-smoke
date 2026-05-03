import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import {
    buildAddPackageArgs,
    buildBuildArgs,
    buildNewConsumerArgs,
    buildRestoreArgs,
    runDotnet,
} from "./dotnet";
import { ConsumerProjectType } from "./inputs";
import { Logger } from "./logger";
import { createNuGetConfig } from "./nugetConfig";
import { PackageFile } from "./packages";

export interface GeneratedConsumerResult {
    targetFramework: string;
    projectType: ConsumerProjectType;
    projectPath: string;
    packagesInstalled: PackageFile[];
    installSucceeded: boolean;
    restoreSucceeded: boolean;
    buildSucceeded: boolean;
}

function safeName(value: string): string {
    return value.replace(/[^A-Za-z0-9_]/g, "_");
}

function generatedConsumerProjectName(targetFramework: string): string {
    return `DotnetPackageSmokeConsumer_${safeName(targetFramework)}`;
}

async function runRequiredDotnetCommand(
    args: string[],
    cwd: string,
    failureMessage: string,
): Promise<void> {
    const result = await runDotnet(args, cwd);

    if (result.exitCode !== 0) {
        throw new Error(`${failureMessage}\n\n${result.stdout}\n${result.stderr}`);
    }
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

    logger.info(`Creating generated consumer for ${targetFramework}.`);

    await runRequiredDotnetCommand(
        buildNewConsumerArgs(projectType, projectName, projectDirectory, targetFramework),
        workspaceDirectory,
        `dotnet new failed for generated consumer ${targetFramework}.`,
    );

    for (const packageFile of packages) {
        logger.info(`Adding package ${packageFile.id} ${packageFile.version} to generated consumer ${targetFramework}.`);

        await runRequiredDotnetCommand(
            buildAddPackageArgs(projectPath, packageFile.id, packageFile.version, localFeedDirectory),
            workspaceDirectory,
            `dotnet add package failed for ${packageFile.id} ${packageFile.version} in generated consumer ${targetFramework}.`,
        );
    }

    logger.info(`Restoring generated consumer for ${targetFramework}.`);
    await runRequiredDotnetCommand(
        buildRestoreArgs(projectPath, nugetConfigPath, true),
        workspaceDirectory,
        `dotnet restore failed for generated consumer ${targetFramework}.`,
    );

    logger.info(`Building generated consumer for ${targetFramework}.`);
    await runRequiredDotnetCommand(
        buildBuildArgs(projectPath, configuration, true),
        workspaceDirectory,
        `dotnet build failed for generated consumer ${targetFramework}.`,
    );

    return {
        targetFramework,
        projectType,
        projectPath,
        packagesInstalled: packages,
        installSucceeded: true,
        restoreSucceeded: true,
        buildSucceeded: true,
    };
}

export async function runGeneratedConsumers(
    targetFrameworks: string[],
    projectType: ConsumerProjectType,
    configuration: string,
    localFeedDirectory: string,
    packages: PackageFile[],
    logger: Logger,
): Promise<GeneratedConsumerResult[]> {
    const workspaceDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "dotnet-package-smoke-consumers-"));
    const nugetConfigPath = path.join(workspaceDirectory, "NuGet.config");
    const globalPackagesFolder = path.join(workspaceDirectory, "packages");

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

        return results;
    } finally {
        await fs.rm(workspaceDirectory, { recursive: true, force: true });
    }
}
