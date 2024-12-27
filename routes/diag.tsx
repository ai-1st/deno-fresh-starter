import { Handlers, PageProps } from "$fresh/server.ts";
import { db } from "$db";

interface DiagData {
  coachVersions: Array<{
    id: string;
    name: string;
    prompt: string;
    timestamp: string;
    previousVersion?: string;
    changelog?: string;
  }>;
}

export const handler: Handlers<DiagData> = {
  async GET(_req, ctx) {
    // Query all agent versions named "Coach"
    const coachVersions = await db.query({
      pk: "AGENT_VERSION",
      limit: 100
    });

    const filteredCoachVersions = coachVersions
      .filter(version => version.data.name === "Coach")
      .map(version => ({
        id: version.sk,
        name: version.data.name,
        prompt: version.data.prompt,
        timestamp: version.data.timestamp,
        previousVersion: version.data.previousVersion,
        changelog: version.data.changelog
      }));

    return ctx.render({ coachVersions: filteredCoachVersions });
  },
};

export default function DiagPage({ data }: PageProps<DiagData>) {
  return (
    <div class="p-4">
      <h1 class="text-2xl font-bold mb-4">Diagnostic: Coach Versions</h1>
      <div class="space-y-6">
        {data.coachVersions.map((version) => (
          <div key={version.id} class="bg-white shadow-md rounded-lg p-4">
            <div class="grid grid-cols-4 gap-4 mb-4">
              <div>
                <strong>Version ID:</strong>
                <p class="font-mono text-sm">{version.id}</p>
              </div>
              <div>
                <strong>Name:</strong>
                <p>{version.name}</p>
              </div>
              <div>
                <strong>Timestamp:</strong>
                <p>{version.timestamp}</p>
              </div>
              <div>
                <strong>Previous Version:</strong>
                <p>{version.previousVersion || 'N/A'}</p>
              </div>
            </div>
            <div>
              <strong>Instructions:</strong>
              <pre class="bg-gray-100 p-3 rounded-md text-sm overflow-x-auto whitespace-pre-wrap break-words">
                {version.prompt}
              </pre>
            </div>
            {version.changelog && (
              <div class="mt-4">
                <strong>Changelog:</strong>
                <p class="text-sm">{version.changelog}</p>
              </div>
            )}
          </div>
        ))}
      </div>
      <p class="mt-4 text-sm text-gray-600">
        Total Coach Versions: {data.coachVersions.length}
      </p>
    </div>
  );
}
