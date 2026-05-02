import * as core from "@actions/core";

export interface ActionInputs {
    packageProjects: string[];
    generatedConsumers: boolean;
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
    const generatedConsumers = parseBooleanInput(
        core.getInput("generated-consumers"), "generated-consumers", true
    );

    if (packageProjects.length === 0) {
        throw new Error("Input 'package-projects' must include at least one project.");
    }

    return {
        packageProjects,
        generatedConsumers
    };
}
