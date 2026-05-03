import * as core from "@actions/core";
import path from "node:path";

export type ConsumerProjectType = "classlib" | "console";

export interface ActionInputs {
    packageProjects: string[];
    generatedConsumers: boolean;
    consumerTargetFrameworks: string[];
    consumerProjectType: ConsumerProjectType;
    smokeProjects: string[];
    workingDirectory: string;
    configuration: string;
    artifactsDirectory: string;
    restoreBeforePack: boolean;
    buildBeforePack: boolean;
    packArguments: string[];
    localFeedDirectory: string;
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

export function parseArgumentInput(value: string, inputName: string): string[] {
    const args: string[] = [];
    let current = "";
    let quote: "'" | "\"" | null = null;
    let escaping = false;

    for (const character of value.trim()) {
        // A backslash means "take the next character literally". This lets
        // users include quotes inside quoted values, for example \"text\".
        if (escaping) {
            current += character;
            escaping = false;
            continue;
        }

        if (character === "\\") {
            escaping = true;
            continue;
        }

        // While inside quotes, whitespace is just part of the argument. The
        // matching quote ends the quoted section and is not included.
        if (quote !== null) {
            if (character === quote) {
                quote = null;
            } else {
                current += character;
            }
            continue;
        }

        // Opening quotes are used for grouping only. We strip the quote
        // characters before passing the final argument array to dotnet.
        if (character === "'" || character === "\"") {
            quote = character;
            continue;
        }

        // Outside quotes, whitespace ends the current argument. Multiple spaces
        // are harmless because we only push when there is something buffered.
        if (/\s/.test(character)) {
            if (current.length > 0) {
                args.push(current);
                current = "";
            }
            continue;
        }

        current += character;
    }

    // These checks catch typos early so users get a clear input error instead
    // of a confusing dotnet pack failure.
    if (escaping) {
        throw new Error(`Input '${inputName}' cannot end with an escape character.`);
    }

    if (quote !== null) {
        throw new Error(`Input '${inputName}' contains an unterminated quoted value.`);
    }

    if (current.length > 0) {
        args.push(current);
    }

    return args;
}

export function parseConsumerProjectType(value: string): ConsumerProjectType {
    const normalized = value.trim().toLowerCase();

    if (normalized.length === 0 || normalized === "classlib") {
        return "classlib";
    }

    if (normalized === "console") {
        return "console";
    }

    throw new Error("Input 'consumer-project-type' must be one of: classlib, console.");
}

export function getInputs(): ActionInputs {
    const packageProjects = parseListInput(core.getInput("package-projects", { required: true }));
    const workingDirectoryInput = core.getInput("working-directory") || ".";
    const generatedConsumers = parseBooleanInput(
        core.getInput("generated-consumers"), "generated-consumers", true
    );
    const smokeProjects = parseListInput(core.getInput("smoke-projects"));

    if (packageProjects.length === 0) {
        throw new Error("Input 'package-projects' must include at least one project.");
    }

    if (!generatedConsumers && smokeProjects.length === 0) {
        throw new Error(
            "At least one validation mode must be enabled: generated-consumers must be true or smoke-projects must include at least one project.",
        );
    }

    return {
        packageProjects,
        generatedConsumers,
        consumerTargetFrameworks: parseListInput(core.getInput("consumer-target-frameworks") || "net8.0"),
        consumerProjectType: parseConsumerProjectType(core.getInput("consumer-project-type")),
        smokeProjects,
        workingDirectory: path.resolve(workingDirectoryInput),
        configuration: core.getInput("configuration") || "Release",
        artifactsDirectory:
            core.getInput("artifacts-directory") || ".dotnet-package-smoke/artifacts",
        localFeedDirectory:
            core.getInput("local-feed-directory") || ".dotnet-package-smoke/feed",
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
        packArguments: parseArgumentInput(
            core.getInput("pack-arguments"),
            "pack-arguments",
        ),
    };
}
