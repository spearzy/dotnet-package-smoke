import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import {
    buildRestoreArgs,
    buildTestArgs,
    CommandResult,
    runDotnet,
} from "./dotnet";
import { Logger } from "./logger";
import { createNuGetConfig } from "./nugetConfig";

export type SmokeProjectFailureStage = "restore" | "test";

export interface SmokeProjectResult {
    projectPath: string;
    restoreSucceeded: boolean;
    testSucceeded: boolean;
    failureStage: SmokeProjectFailureStage | null;
    failureOutput: string;
}

function commandOutput(result: CommandResult): string {
    return `${result.stdout}\n${result.stderr}`.trim();
}

function outputPathArgs(workspaceDirectory: string, projectIndex: number): string[] {
    const projectWorkspace = path.join(workspaceDirectory, `smoke-${projectIndex}`);

    return [
        `-p:BaseOutputPath=${path.join(projectWorkspace, "bin")}${path.sep}`,
        `-p:BaseIntermediateOutputPath=${path.join(projectWorkspace, "obj")}${path.sep}`,
    ];
}

async function runSmokeProject(
    projectPath: string,
    projectIndex: number,
    workingDirectory: string,
    configuration: string,
    nugetConfigPath: string,
    workspaceDirectory: string,
    logger: Logger,
): Promise<SmokeProjectResult> {
    const outputArgs = outputPathArgs(workspaceDirectory, projectIndex);

    logger.info(`Restoring smoke project: ${projectPath}`);
    const restore = await runDotnet(
        [
            ...buildRestoreArgs(projectPath, nugetConfigPath, true),
            ...outputArgs,
        ],
        workingDirectory,
    );

    if (restore.exitCode !== 0) {
        return {
            projectPath,
            restoreSucceeded: false,
            testSucceeded: false,
            failureStage: "restore",
            failureOutput: commandOutput(restore),
        };
    }

    logger.info(`Testing smoke project: ${projectPath}`);
    const test = await runDotnet(
        [
            ...buildTestArgs(projectPath, configuration, true),
            ...outputArgs,
        ],
        workingDirectory,
    );

    if (test.exitCode !== 0) {
        return {
            projectPath,
            restoreSucceeded: true,
            testSucceeded: false,
            failureStage: "test",
            failureOutput: commandOutput(test),
        };
    }

    return {
        projectPath,
        restoreSucceeded: true,
        testSucceeded: true,
        failureStage: null,
        failureOutput: "",
    };
}

export async function runSmokeProjects(
    smokeProjects: string[],
    workingDirectory: string,
    configuration: string,
    localFeedDirectory: string,
    logger: Logger,
): Promise<SmokeProjectResult[]> {
    const workspaceDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "dotnet-package-smoke-projects-"));
    const nugetConfigPath = path.join(workspaceDirectory, "NuGet.config");
    const globalPackagesFolder = path.join(workspaceDirectory, "packages");

    try {
        await fs.writeFile(
            nugetConfigPath,
            createNuGetConfig(localFeedDirectory, globalPackagesFolder),
            "utf8",
        );

        const results: SmokeProjectResult[] = [];

        for (const [index, smokeProject] of smokeProjects.entries()) {
            results.push(
                await runSmokeProject(
                    smokeProject,
                    index,
                    workingDirectory,
                    configuration,
                    nugetConfigPath,
                    workspaceDirectory,
                    logger,
                ),
            );
        }

        return results;
    } finally {
        await fs.rm(workspaceDirectory, { recursive: true, force: true });
    }
}
