/**
 * Reusable component for displaying agent version details
 * Shows version name, timestamp, robohash image, and changelog
 */

import Changelog from "../islands/Changelog.tsx";

export interface AgentVersionData {
  id: string;
  name: string;
  prompt: string;
  timestamp: string;
  previousVersion?: string;
  changelog?: string;
  hidden?: boolean;
}

interface AgentVersionProps {
  version: AgentVersionData;
  showInvoke?: boolean;
  showNewVersion?: boolean;
}

export function AgentVersion({ 
  version, 
  showInvoke = true, 
  showNewVersion = true,
}: AgentVersionProps) {
  return (
    <div class="border rounded p-4">
      <div class="flex gap-4">
        <div class="flex-none">
          <img
            src={`https://robohash.org/${version.id}.png?set=set2`}
            alt={version.name}
            class="w-16 h-16 sm:w-48 sm:h-48 rounded-lg shadow-md"
          />
        </div>
        <div class="flex-grow">
          <div class="flex justify-between items-start">
            <div>
              <h2 class="text-xl font-semibold">{version.name}</h2>
              <div class="text-sm text-gray-500">
                {new Date(version.timestamp).toLocaleString()}
              </div>
              <div class="flex gap-2 mt-2 mb-4">
                {showInvoke && (
                  <a
                    href={`/agents/invoke?id=${version.id}`}
                    class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Invoke
                  </a>
                )}
                {showNewVersion && (
                  <a
                    href={`/agents/new?fromVersion=${version.id}`}
                    class="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    New Version
                  </a>
                )}
              </div>
            </div>
          </div>

          <Changelog initialVersion={version} />
        </div>
      </div>
    </div>
  );
}
