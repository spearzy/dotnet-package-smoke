import * as exec from "@actions/exec";
import { ConsumerProjectType } from "./inputs";

export interface CommandResult {
    exitCode: number;
    stdout: string;
    stderr: string;
}

export async function runDotnet(
    args: string[],
    cwd: string): Promise<CommandResult> {
    let stdout = "";
    let stderr = "";

    const exitCode = await exec.exec("dotnet", args, {
        cwd,
        ignoreReturnCode: true,
        listeners: {
            stdout: (data: Buffer) => {
                stdout += data.toString("utf8");
            },
            stderr: (data: Buffer) => {
                stderr += data.toString("utf8");
            },
        },
    });

    return {
        exitCode,
        stdout,
        stderr,
    };
}

export function buildRestoreArgs(
    project: string,
    configFile?: string,
    ignoreFailedSources = false,
): string[] {
    const args = ["restore", project];

    if (configFile !== undefined) {
        args.push("--configfile", configFile);
    }

    if (ignoreFailedSources) {
        args.push("--ignore-failed-sources");
    }

    return args;
}

export function buildBuildArgs(
    project: string,
    configuration: string,
    noRestore: boolean): string[] {
    const args = ["build", project, "-c", configuration];

    if (noRestore) {
        args.push("--no-restore");
    }

    return args;
}

export function buildTestArgs(
    project: string,
    configuration: string,
    noRestore: boolean): string[] {
    const args = ["test", project, "-c", configuration];

    if (noRestore) {
        args.push("--no-restore");
    }

    return args;
}

export function buildPackArgs(
    project: string,
    configuration: string,
    outputDirectory: string,
    alreadyRestored: boolean,
    alreadyBuilt: boolean,
    extraArgs: string[] = [],
): string[] {
    const args = ["pack", project, "-c", configuration, "--output", outputDirectory];

    if (alreadyBuilt) {
        args.push("--no-build");
    } else if (alreadyRestored) {
        args.push("--no-restore");
    }

    args.push(...extraArgs);

    return args;
}

export function buildNewConsumerArgs(
    projectType: ConsumerProjectType,
    projectName: string,
    outputDirectory: string,
    targetFramework: string,
): string[] {
    return [
        "new",
        projectType,
        "--name",
        projectName,
        "--output",
        outputDirectory,
        "--framework",
        targetFramework,
        "--no-restore",
    ];
}

export function buildAddPackageArgs(
    project: string,
    packageId: string,
    version: string,
    localFeedDirectory: string,
): string[] {
    return [
        "add",
        project,
        "package",
        packageId,
        "--version",
        version,
        "--source",
        localFeedDirectory,
        "--no-restore",
    ];
}
