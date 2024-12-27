/**
 * Collapsible changelog component that loads version history on demand
 * Uses recursive previousVersion attribute to build the full version history
 */

import { useState } from "preact/hooks";
import TextWithCopyButton from "./TextWithCopyButton.tsx";

interface Version {
  id: string;
  name: string;
  prompt: string;
  timestamp: string;
  previousVersion?: string;
  changelog?: string;
}

interface ChangelogProps {
  initialVersion: Version;
}

export default function Changelog({ initialVersion }: ChangelogProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [versions, setVersions] = useState<Version[]>([initialVersion]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);

  const loadHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const history: Version[] = [initialVersion];
      let currentVersion = initialVersion;
      
      while (currentVersion.previousVersion) {
        const response = await fetch(`/agents/api/version/${currentVersion.previousVersion}`);
        if (!response.ok) {
          if (response.status === 404) {
            console.warn(`Previous version not found: ${currentVersion.previousVersion}`);
            break;
          }
          throw new Error(`Failed to fetch version: ${response.statusText}`);
        }
        
        const version = await response.json();
        history.push(version);
        currentVersion = version;
      }
      
      setVersions(history);
      setHasLoadedHistory(true);
    } catch (error) {
      console.error('Failed to load version history:', error);
      setError('Failed to load version history. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = () => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);
    if (newExpandedState && !hasLoadedHistory) {
      loadHistory();
    }
  };

  return (
    <div class="mt-4">
      <button
        onClick={handleToggle}
        class="flex items-center space-x-2"
      >
        <span class={`transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
          ▶
        </span>
        <span class="font-medium">Change History</span>
        {isLoading && <span class="ml-2 animate-spin">⌛</span>}
      </button>

      {error && (
        <div class="mt-2 text-red-500 text-sm">{error}</div>
      )}

      {isExpanded && (
        <div class="mt-2 ml-[5px] space-y-4 pl-6 border-l-2 border-gray-500">
          {versions.map((version, index) => (
            <div key={version.id} class="relative">
              <div class="absolute -left-[33px] top-2 w-4 h-4 rounded-full bg-gray-500" />
              <div class="pt-1">
                <div class="font-medium">{version.name}</div>
                <div class="text-sm text-gray-500">
                  {new Date(version.timestamp).toLocaleString()}
                </div>
                {version.changelog && (
                  <div class="mt-1 text-gray-600">{version.changelog}</div>
                )}
                <div class="mt-2">
                  <TextWithCopyButton text={version.prompt} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
