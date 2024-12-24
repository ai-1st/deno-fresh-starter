/**
 * Island component that displays text with an expand/collapse button.
 * Shows first 100 characters by default, with option to show full text.
 */

import { useState } from "preact/hooks";

interface ExpandableTextProps {
  /** The full text to display */
  text: string;
  /** Number of characters to show initially */
  previewLength?: number;
  /** CSS class for the container */
  className?: string;
}

export default function ExpandableText({ 
  text, 
  previewLength = 100,
  className = ""
}: ExpandableTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Only show expand button if text is longer than preview length
  const needsExpand = text.length > previewLength;
  const displayText = isExpanded ? text : text.slice(0, previewLength);

  return (
    <div class={`relative ${className}`}>
      <pre class="whitespace-pre-wrap">
        {displayText}
        {!isExpanded && needsExpand && "..."}
      </pre>
      {needsExpand && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          class="text-primary hover:text-primary-focus text-sm mt-1"
        >
          {isExpanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}
