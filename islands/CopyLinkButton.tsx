import { useCallback, useState } from "preact/hooks";

interface CopyLinkButtonProps {
  url: string;
}

export default function CopyLinkButton({ url }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleClick = useCallback(() => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [url]);

  return (
    <button
      onClick={handleClick}
      class={`px-3 py-1 rounded text-sm transition-colors ${
        copied 
          ? "bg-green-100 text-green-800" 
          : "bg-gray-100 text-gray-800 hover:bg-gray-200"
      }`}
    >
      {copied ? "Copied!" : "Copy Link"}
    </button>
  );
}
