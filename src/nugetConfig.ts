function xmlEscape(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

export function createNuGetConfig(
    localFeedDirectory: string,
    globalPackagesFolder: string,
): string {
    return [
        "<?xml version=\"1.0\" encoding=\"utf-8\"?>",
        "<configuration>",
        "  <config>",
        `    <add key="globalPackagesFolder" value="${xmlEscape(globalPackagesFolder)}" />`,
        "  </config>",
        "  <packageSources>",
        "    <clear />",
        `    <add key="dotnet-package-smoke-local" value="${xmlEscape(localFeedDirectory)}" />`,
        "    <add key=\"nuget.org\" value=\"https://api.nuget.org/v3/index.json\" />",
        "  </packageSources>",
        "</configuration>",
        "",
    ].join("\n");
}
