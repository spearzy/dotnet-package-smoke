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

function uniqueValues(values: Array<string | null>): string[] {
    return Array.from(
        new Set(values.filter((value): value is string => value !== null)),
    );
}

function generatedConsumerFailed(
    consumer: PackageSmokeResult["generatedConsumers"][number],
): boolean {
    return !consumer.installSucceeded || !consumer.restoreSucceeded || !consumer.buildSucceeded;
}

function smokeProjectFailed(
    smokeProject: PackageSmokeResult["smokeProjects"][number],
): boolean {
    return !smokeProject.restoreSucceeded || !smokeProject.testSucceeded;
}

function resultLine(label: string, passed: number, failed: number): string {
    if (failed === 0) {
        return `✅ ${passed} ${label} passed`;
    }

    return `❌ ${passed} ${label} passed, ${failed} failed`;
}

export function createMarkdownSummary(result: PackageSmokeResult): string {
    const lines: string[] = [];
    const failedConsumers = result.generatedConsumers.filter(generatedConsumerFailed);
    const failedSmokeProjects = result.smokeProjects.filter(smokeProjectFailed);

    lines.push("# .NET Package Smoke Tests", "");
    lines.push("## Result", "");
    lines.push(`✅ ${result.packages.length} packages packed`);
    lines.push(
        resultLine(
            "generated consumer checks",
            result.generatedConsumers.length - failedConsumers.length,
            failedConsumers.length,
        ),
    );
    lines.push(
        resultLine(
            "smoke projects",
            result.smokeProjects.length - failedSmokeProjects.length,
            failedSmokeProjects.length,
        ),
    );

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

    lines.push("", "## Smoke Projects", "");

    if (result.smokeProjects.length === 0) {
        lines.push("Smoke project checks were skipped.");
    } else {
        lines.push("| Project | Restore | Test | Failed Stage |");
        lines.push("| --- | --- | --- | --- |");

        for (const smokeProject of result.smokeProjects) {
            lines.push(
                `| ${tableValue(smokeProject.projectPath)} | ${icon(
                    smokeProject.restoreSucceeded,
                )} | ${icon(smokeProject.testSucceeded)} | ${failureStage(
                    smokeProject.failureStage,
                )} |`,
            );
        }
    }

    lines.push("", "## Paths", "");
    lines.push(`- Local feed: ${result.localFeedDirectory}`);
    lines.push(`- Artifacts: ${result.artifactsDirectory}`);

    const retainedWorkspaces = uniqueValues([
        ...result.generatedConsumers.map((consumer) => consumer.retainedWorkspace),
        ...result.smokeProjects.map((smokeProject) => smokeProject.retainedWorkspace),
    ]);

    if (retainedWorkspaces.length > 0) {
        lines.push("", "## Retained Workspaces", "");

        for (const retainedWorkspace of retainedWorkspaces) {
            lines.push(`- ${retainedWorkspace}`);
        }
    }

    if (failedConsumers.length > 0 || failedSmokeProjects.length > 0) {
        lines.push("", "## Failure Details", "");

        for (const consumer of failedConsumers) {
            lines.push(`### Generated consumer ${consumer.targetFramework}`, "");
            lines.push(`Failed stage: ${failureStage(consumer.failureStage)}`, "");
            if (consumer.retainedWorkspace !== null) {
                lines.push(`Retained workspace: ${consumer.retainedWorkspace}`, "");
            }
            lines.push("```text");
            lines.push(consumer.failureOutput);
            lines.push("```", "");
        }

        for (const smokeProject of failedSmokeProjects) {
            lines.push(`### Smoke project ${smokeProject.projectPath}`, "");
            lines.push(`Failed stage: ${failureStage(smokeProject.failureStage)}`, "");
            if (smokeProject.retainedWorkspace !== null) {
                lines.push(`Retained workspace: ${smokeProject.retainedWorkspace}`, "");
            }
            lines.push("```text");
            lines.push(smokeProject.failureOutput);
            lines.push("```", "");
        }
    }

    return lines.join("\n");
}
