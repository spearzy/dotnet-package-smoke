import * as core from "@actions/core";
import { getInputs } from "./inputs";
import { resolveProjectGlobs } from "./glob";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import {
    buildBuildArgs,
    buildPackArgs,
    buildRestoreArgs,
    runDotnet,
} from "./dotnet";

function resolveOutputDirectory(
    workingDirectory: string,
    outputDirectory: string,
): string {
    return path.isAbsolute(outputDirectory)
        ? outputDirectory
        : path.join(workingDirectory, outputDirectory);
}

async function cleanPackageFiles(directory: string): Promise<void> {
    await fs.mkdir(directory, { recursive: true });

    const entries = await fs.readdir(directory, { withFileTypes: true });

    await Promise.all(
        entries
            .filter((entry) => entry.isFile() && /\.(s)?nupkg$/i.test(entry.name))
            .map((entry) => fs.unlink(path.join(directory, entry.name))),
    );
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


async function main(): Promise<void> {
    const inputs = getInputs();

    core.info("dotnet-package-smoke is running.");
    core.info(`Generated consumers: ${inputs.generatedConsumers}`);

    const packageProjects = await resolveProjectGlobs(
        inputs.packageProjects,
        inputs.workingDirectory,
        "package-projects",
    );

    const artifactsDirectory = resolveOutputDirectory(
        inputs.workingDirectory,
        inputs.artifactsDirectory,
    );

    await cleanPackageFiles(artifactsDirectory);

    for (const project of packageProjects) {
        core.info(`Packing project: ${project}`);

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
            ),
            inputs.workingDirectory,
            `dotnet pack failed for ${project}.`,
        );
    }

    core.info(`Packages written to: ${artifactsDirectory}`);


    for (const project of packageProjects) {
        core.info(`Resolved package project: ${project}`);
    }

    const dotnetInfo = await runDotnet(["--info"], inputs.workingDirectory);

    if (dotnetInfo.exitCode !== 0) {
        throw new Error("dotnet --info failed. Make sure the .NET SDK is installed.");
    }

    core.info("dotnet SDK is available.");
    core.info(`Configuration: ${inputs.configuration}`);
    core.info(`Artifacts directory: ${inputs.artifactsDirectory}`);
    core.info(`Restore before pack: ${inputs.restoreBeforePack}`);
    core.info(`Build before pack: ${inputs.buildBeforePack}`);

    core.setOutput("packages-packed", "0");
}



main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    core.setFailed(message);
});
