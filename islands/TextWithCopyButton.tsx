import { useCallback, useState } from "preact/hooks";

interface TextWithCopyButtonProps {
  text: string;
  label?: string;
}

/**
 * A component that displays text with a copy button.
 * The text will take up as much space as needed.
 */
export default function TextWithCopyButton({ 
  text, 
  label
}: TextWithCopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <div class="bg-white rounded relative">
      {label && (
        <div class="px-4 py-2 border-b border-base-300 font-medium">
          {label}
        </div>
      )}
      <p class="p-4 whitespace-pre-wrap break-words">
        {text}
      </p>
      <button
        onClick={handleCopy}
        class={`btn btn-sm absolute -mt-2 top-2 right-2 ${
          copied ? "btn-success" : "btn-ghost"
        }`}
        aria-label={copied ? "Copied!" : "Copy to clipboard"}
      >
        {copied ? "✓ Copied!" : "Copy"}
      </button>
    </div>
  );
}
