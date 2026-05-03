import * as core from "@actions/core";
import { getInputs } from "./inputs";
import { runPackageSmoke } from "./packageSmoke";

async function main(): Promise<void> {
    const inputs = getInputs();
    const result = await runPackageSmoke(inputs, {
        info: (message) => core.info(message),
    });

    core.setOutput("packages-packed", result.packages.length.toString());
    core.setOutput("local-feed-directory", result.localFeedDirectory);
    core.setOutput("generated-consumers-tested", result.generatedConsumers.length.toString());
}

main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    core.setFailed(message);
});
