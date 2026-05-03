import * as core from "@actions/core";
import { getInputs } from "./inputs";
import { resolveProjectGlobs } from "./glob";

async function main(): Promise<void> {
    const inputs = getInputs();

    core.info("dotnet-package-smoke is running.");
    core.info(`Generated consumers: ${inputs.generatedConsumers}`);

    const packageProjects = await resolveProjectGlobs(
        inputs.packageProjects,
        inputs.workingDirectory,
        "package-projects",
    );

    for (const project of packageProjects) {
        core.info(`Resolved package project: ${project}`);
    }

    core.setOutput("packages-packed", "0");
}



main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    core.setFailed(message);
});
