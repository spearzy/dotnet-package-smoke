import * as core from "@actions/core";
import { GeneratedConsumerResult } from "./generatedConsumers.js";
import { getInputs } from "./inputs.js";
import { runPackageSmoke } from "./packageSmoke.js";
import { SmokeProjectResult } from "./smokeRunner.js";
import { createMarkdownSummary } from "./summary.js";

function generatedConsumerFailed(consumer: GeneratedConsumerResult): boolean {
    return !consumer.installSucceeded || !consumer.restoreSucceeded || !consumer.buildSucceeded;
}

function smokeProjectFailed(smokeProject: SmokeProjectResult): boolean {
    return !smokeProject.restoreSucceeded || !smokeProject.testSucceeded;
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

function smokeProjectFailureMessage(smokeProjects: SmokeProjectResult[]): string {
    if (smokeProjects.length === 1) {
        const smokeProject = smokeProjects[0];
        const stage = smokeProject.failureStage ?? "unknown";

        return `Smoke project check failed for ${smokeProject.projectPath} during ${stage}.`;
    }

    const failuresByStage = smokeProjects.reduce<Record<string, number>>((counts, smokeProject) => {
        const stage = smokeProject.failureStage ?? "unknown";
        counts[stage] = (counts[stage] ?? 0) + 1;
        return counts;
    }, {});

    const stageSummary = Object.entries(failuresByStage)
        .map(([stage, count]) => `${stage}: ${count}`)
        .join(", ");

    return `${smokeProjects.length} smoke project checks failed (${stageSummary}).`;
}

async function main(): Promise<void> {
    const inputs = getInputs();
    const result = await runPackageSmoke(inputs, {
        info: (message) => core.info(message),
    });
    const failedGeneratedConsumers = result.generatedConsumers.filter(generatedConsumerFailed);
    const failedSmokeProjects = result.smokeProjects.filter(smokeProjectFailed);

    core.setOutput("packages-packed", result.packages.length.toString());
    core.setOutput("local-feed-directory", result.localFeedDirectory);
    core.setOutput("generated-consumers-tested", result.generatedConsumers.length.toString());
    core.setOutput(
        "generated-consumers-passed",
        (result.generatedConsumers.length - failedGeneratedConsumers.length).toString(),
    );
    core.setOutput("generated-consumers-failed", failedGeneratedConsumers.length.toString());
    core.setOutput("smoke-projects-tested", result.smokeProjects.length.toString());
    core.setOutput(
        "smoke-projects-passed",
        (result.smokeProjects.length - failedSmokeProjects.length).toString(),
    );
    core.setOutput("smoke-projects-failed", failedSmokeProjects.length.toString());

    await core.summary.addRaw(createMarkdownSummary(result)).write();

    const failureMessages: string[] = [];

    if (failedGeneratedConsumers.length > 0) {
        failureMessages.push(generatedConsumerFailureMessage(failedGeneratedConsumers));
    }

    if (failedSmokeProjects.length > 0) {
        failureMessages.push(smokeProjectFailureMessage(failedSmokeProjects));
    }

    if (failureMessages.length > 0) {
        throw new Error(failureMessages.join(" "));
    }
}

main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    core.setFailed(message);
});
