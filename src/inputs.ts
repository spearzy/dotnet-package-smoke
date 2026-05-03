import * as core from "@actions/core";
import path from "node:path";

export interface ActionInputs {
    packageProjects: string[];
    generatedConsumers: boolean;
    workingDirectory: string;
    configuration: string;
    artifactsDirectory: string;
    restoreBeforePack: boolean;
    buildBeforePack: boolean;

}

export function parseListInput(value: string): string[] {
    return value
        .split(/[\n,]+/)
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
}

export function parseBooleanInput(
    value: string,
    inputName: string,
    defaultValue: boolean,
): boolean {
    const normalized = value.trim().toLowerCase();

    if (normalized.length === 0) {
        return defaultValue;
    }

    if (["true", "1", "yes", "y", "on"].includes(normalized)) {
        return true;
    }

    if (["false", "0", "no", "n", "off"].includes(normalized)) {
        return false;
    }

    throw new Error(
        `Input '${inputName}' must be a boolean value, but received '${value}'.`,
    );
}

export function getInputs(): ActionInputs {
    const packageProjects = parseListInput(core.getInput("package-projects", { required: true }));
    const workingDirectoryInput = core.getInput("working-directory") || ".";
    const generatedConsumers = parseBooleanInput(
        core.getInput("generated-consumers"), "generated-consumers", true
    );

    if (packageProjects.length === 0) {
        throw new Error("Input 'package-projects' must include at least one project.");
    }

    return {
        packageProjects,
        generatedConsumers,
        workingDirectory: path.resolve(workingDirectoryInput),
        configuration: core.getInput("configuration") || "Release",
        artifactsDirectory:
            core.getInput("artifacts-directory") || ".dotnet-package-smoke/artifacts",
        restoreBeforePack: parseBooleanInput(
            core.getInput("restore-before-pack"),
            "restore-before-pack",
            true,
        ),
        buildBeforePack: parseBooleanInput(
            core.getInput("build-before-pack"),
            "build-before-pack",
            true,
        ),

    };
}
