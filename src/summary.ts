import { PackageSmokeResult } from "./packageSmoke";

function icon(value: boolean): string {
    return value ? "✅" : "❌";
}

function tableValue(value: string): string {
    return value.replaceAll("|", "\\|").replaceAll("\n", " ");
}

function failureStage(value: string | null): string {
    return value === null ? "" : value;
}

export function createMarkdownSummary(result: PackageSmokeResult): string {
    const lines: string[] = [];

    lines.push("# .NET Package Smoke Tests", "");

    lines.push("## Packages", "");
    lines.push("| Package | Version | Path |");
    lines.push("| --- | --- | --- |");

    for (const packageFile of result.packages) {
        lines.push(
            `| ${tableValue(packageFile.id)} | ${tableValue(
                packageFile.version,
            )} | ${tableValue(packageFile.path)} |`,
        );
    }

    lines.push("", "## Generated Consumers", "");

    if (result.generatedConsumers.length === 0) {
        lines.push("Generated consumer checks were skipped.");
    } else {
        lines.push("| Target Framework | Project Type | Install | Restore | Build | Failed Stage |");
        lines.push("| --- | --- | --- | --- | --- | --- |");

        for (const consumer of result.generatedConsumers) {
            lines.push(
                `| ${tableValue(consumer.targetFramework)} | ${consumer.projectType} | ${icon(
                    consumer.installSucceeded,
                )} | ${icon(consumer.restoreSucceeded)} | ${icon(
                    consumer.buildSucceeded,
                )} | ${failureStage(consumer.failureStage)} |`,
            );
        }
    }

    lines.push("", "## Paths", "");
    lines.push(`- Local feed: ${result.localFeedDirectory}`);
    lines.push(`- Artifacts: ${result.artifactsDirectory}`);

    const failedConsumers = result.generatedConsumers.filter(
        (consumer) =>
            !consumer.installSucceeded ||
            !consumer.restoreSucceeded ||
            !consumer.buildSucceeded,
    );

    if (failedConsumers.length > 0) {
        lines.push("", "## Failure Details", "");

        for (const consumer of failedConsumers) {
            lines.push(`### Generated consumer ${consumer.targetFramework}`, "");
            lines.push(`Failed stage: ${failureStage(consumer.failureStage)}`, "");
            lines.push("```text");
            lines.push(consumer.failureOutput);
            lines.push("```", "");
        }
    }

    return lines.join("\n");
}
