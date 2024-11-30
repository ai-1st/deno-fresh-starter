import { Marked } from "marked";

interface MarkdownProps {
  content: string;
  class?: string;
}

export default function Markdown({ content, class: className = "" }: MarkdownProps) {
  const marked = new Marked();
  const html = marked.parse(content);

  return (
    <article class="prose max-w-none bg-gradient-to-b from-blue-100 to-blue-200 p-6">
      <div 
        class={`${className}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </article>
  );
}
