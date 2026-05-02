import * as core from "@actions/core";
import { getInputs } from "./inputs";

async function main(): Promise<void> {
    const inputs = getInputs();

    core.info("dotnet-package-smoke is running.");
    core.info(`Generated consumers: ${inputs.generatedConsumers}`);

    for (const project of inputs.packageProjects) {
        core.info(`Package project: ${project}`);
    }

    core.setOutput("packages-packed", "0");
}


main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    core.setFailed(message);
});
