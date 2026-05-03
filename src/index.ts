import * as core from "@actions/core";
import { GeneratedConsumerResult } from "./generatedConsumers";
import { getInputs } from "./inputs";
import { runPackageSmoke } from "./packageSmoke";
import { createMarkdownSummary } from "./summary";

function generatedConsumerFailed(consumer: GeneratedConsumerResult): boolean {
    return !consumer.installSucceeded || !consumer.restoreSucceeded || !consumer.buildSucceeded;
}

function generatedConsumerFailureMessage(consumers: GeneratedConsumerResult[]): string {
    if (consumers.length === 1) {
        const consumer = consumers[0];
        const stage = consumer.failureStage ?? "unknown";

        return `Generated consumer check failed for ${consumer.targetFramework} during ${stage}.`;
    }

    const failuresByStage = consumers.reduce<Record<string, number>>((counts, consumer) => {
        const stage = consumer.failureStage ?? "unknown";
        counts[stage] = (counts[stage] ?? 0) + 1;
        return counts;
    }, {});

    const stageSummary = Object.entries(failuresByStage)
        .map(([stage, count]) => `${stage}: ${count}`)
        .join(", ");

    return `${consumers.length} generated consumer checks failed (${stageSummary}).`;
}

async function main(): Promise<void> {
    const inputs = getInputs();
    const result = await runPackageSmoke(inputs, {
        info: (message) => core.info(message),
    });
    const failedGeneratedConsumers = result.generatedConsumers.filter(generatedConsumerFailed);

    core.setOutput("packages-packed", result.packages.length.toString());
    core.setOutput("local-feed-directory", result.localFeedDirectory);
    core.setOutput("generated-consumers-tested", result.generatedConsumers.length.toString());
    core.setOutput(
        "generated-consumers-passed",
        (result.generatedConsumers.length - failedGeneratedConsumers.length).toString(),
    );
    core.setOutput("generated-consumers-failed", failedGeneratedConsumers.length.toString());

    await core.summary.addRaw(createMarkdownSummary(result)).write();

    if (failedGeneratedConsumers.length > 0) {
        throw new Error(generatedConsumerFailureMessage(failedGeneratedConsumers));
    }
}

main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    core.setFailed(message);
});
