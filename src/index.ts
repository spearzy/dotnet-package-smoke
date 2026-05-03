import * as core from "@actions/core";
import { getInputs } from "./inputs";
import { resolveProjectGlobs } from "./glob";
import { runDotnet } from "./dotnet";

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

    const dotnetInfo = await runDotnet(["--info"], inputs.workingDirectory);

    if (dotnetInfo.exitCode !== 0) {
        throw new Error("dotnet --info failed. Make sure the .NET SDK is installed.");
    }

    core.info("dotnet SDK is available.");


    core.setOutput("packages-packed", "0");
}



main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    core.setFailed(message);
});
