import * as path from "node:path";
import {
    buildBuildArgs,
    buildPackArgs,
    buildRestoreArgs,
    runDotnet,
} from "./dotnet";
import { GeneratedConsumerResult, runGeneratedConsumers } from "./generatedConsumers";
import { resolveProjectGlobs } from "./glob";
import { ActionInputs } from "./inputs";
import { Logger } from "./logger";
import { cleanLocalFeed, copyPackagesToLocalFeed } from "./localFeed";
import { cleanPackageFiles, findPackageFiles, PackageFile } from "./packages";
import { runSmokeProjects, SmokeProjectResult } from "./smokeRunner";

export interface PackageSmokeResult {
    packages: PackageFile[];
    packageProjects: string[];
    generatedConsumers: GeneratedConsumerResult[];
    smokeProjects: SmokeProjectResult[];
    artifactsDirectory: string;
    localFeedDirectory: string;
}

function resolveOutputDirectory(
    workingDirectory: string,
    outputDirectory: string,
): string {
    return path.isAbsolute(outputDirectory)
        ? outputDirectory
        : path.join(workingDirectory, outputDirectory);
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

async function packProject(
    project: string,
    inputs: ActionInputs,
    artifactsDirectory: string,
    logger: Logger,
): Promise<void> {
    logger.info(`Packing project: ${project}`);

    if (inputs.restoreBeforePack) {
        await runRequiredDotnetCommand(
            buildRestoreArgs(project),
            inputs.workingDirectory,
            `dotnet restore failed for ${project}.`,
        );
    }

    if (inputs.buildBeforePack) {
        await runRequiredDotnetCommand(
            buildBuildArgs(project, inputs.configuration, inputs.restoreBeforePack),
            inputs.workingDirectory,
            `dotnet build failed for ${project}.`,
        );
    }

    await runRequiredDotnetCommand(
        buildPackArgs(
            project,
            inputs.configuration,
            artifactsDirectory,
            inputs.restoreBeforePack,
            inputs.buildBeforePack,
            inputs.packArguments,
        ),
        inputs.workingDirectory,
        `dotnet pack failed for ${project}.`,
    );
}

export async function runPackageSmoke(
    inputs: ActionInputs,
    logger: Logger,
): Promise<PackageSmokeResult> {
    logger.info("dotnet-package-smoke is running.");
    logger.info(`Generated consumers: ${inputs.generatedConsumers}`);
    logger.info(`Configuration: ${inputs.configuration}`);
    logger.info(`Artifacts directory: ${inputs.artifactsDirectory}`);
    logger.info(`Restore before pack: ${inputs.restoreBeforePack}`);
    logger.info(`Build before pack: ${inputs.buildBeforePack}`);

    const packageProjects = await resolveProjectGlobs(
        inputs.packageProjects,
        inputs.workingDirectory,
        "package-projects",
    );

    const smokeProjectPaths = inputs.smokeProjects.length > 0
        ? await resolveProjectGlobs(
            inputs.smokeProjects,
            inputs.workingDirectory,
            "smoke-projects",
        )
        : [];

    const artifactsDirectory = resolveOutputDirectory(
        inputs.workingDirectory,
        inputs.artifactsDirectory,
    );

    const localFeedDirectory = resolveOutputDirectory(
        inputs.workingDirectory,
        inputs.localFeedDirectory,
    );

    await cleanPackageFiles(artifactsDirectory);
    await cleanLocalFeed(localFeedDirectory);

    for (const project of packageProjects) {
        await packProject(project, inputs, artifactsDirectory, logger);
    }

    const packages = await findPackageFiles(artifactsDirectory);

    if (packages.length === 0) {
        throw new Error(
            `dotnet pack completed, but no .nupkg files were found in ${artifactsDirectory}.`,
        );
    }

    for (const packageFile of packages) {
        logger.info(
            `Package created: ${packageFile.id} ${packageFile.version} (${packageFile.path})`,
        );
    }

    await copyPackagesToLocalFeed(packages, localFeedDirectory);
    logger.info(`Local NuGet feed: ${localFeedDirectory}`);

    const generatedConsumers = inputs.generatedConsumers
        ? await runGeneratedConsumers(
            inputs.consumerTargetFrameworks,
            inputs.consumerProjectType,
            inputs.configuration,
            localFeedDirectory,
            packages,
            logger,
        )
        : [];

    const smokeProjects = smokeProjectPaths.length > 0
        ? await runSmokeProjects(
            smokeProjectPaths,
            inputs.workingDirectory,
            inputs.configuration,
            localFeedDirectory,
            logger,
        )
        : [];

    return {
        packages,
        packageProjects,
        generatedConsumers,
        smokeProjects,
        artifactsDirectory,
        localFeedDirectory,
    };
}
