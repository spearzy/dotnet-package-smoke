import * as exec from "@actions/exec";

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

export function buildRestoreArgs(project: string): string[] {
    return ["restore", project];
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

export function buildPackArgs(
    project: string,
    configuration: string,
    outputDirectory: string,
    alreadyRestored: boolean,
    alreadyBuilt: boolean): string[] {
    const args = ["pack", project, "-c", configuration, "--output", outputDirectory];

    if (alreadyBuilt) {
        args.push("--no-build");
    } else if (alreadyRestored) {
        args.push("--no-restore");
    }

    return args;
}

