import * as glob from "@actions/glob";
import * as path from "node:path";

export function buildGlobPatterns(
    patterns: string[],
    workingDirectory: string,
): string[] {
    return patterns.map((pattern) => {
        const isNegated = pattern.startsWith("!");
        const body = isNegated ? pattern.slice(1) : pattern;
        const resolved = path.isAbsolute(body)
            ? body
            : path.join(workingDirectory, body);

        return `${isNegated ? "!" : ""}${resolved}`;
    });
}

export async function resolveProjectGlobs(
    patterns: string[],
    workingDirectory: string,
    inputName: string,
): Promise<string[]> {
    if (patterns.length === 0) {
        throw new Error(`Input '${inputName}' did not contain any project paths or globs.`);
    }

    const resolvedPatterns = buildGlobPatterns(patterns, workingDirectory).join("\n");
    const globber = await glob.create(resolvedPatterns, {
        followSymbolicLinks: true,
        implicitDescendants: false,
    });

    const matches = await globber.glob();

    const projects = Array.from(
        new Set(matches.filter((file) => file.toLowerCase().endsWith(".csproj"))),
    ).sort();

    if (projects.length === 0) {
        throw new Error(
            `No .csproj files matched input '${inputName}'. Patterns: ${patterns.join(", ")}`,
        );
    }

    return projects;
}
