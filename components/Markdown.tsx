import { Marked } from "marked";

interface MarkdownProps {
  content: string;
  class?: string;
}

export default function Markdown({ content, class: className = "" }: MarkdownProps) {
  const marked = new Marked();
  const html = marked.parse(content);

  return (
    <article class="prose max-w-none bg-base-200 p-6 rounded-box shadow-md border border-primary">
      <div 
        class={`${className}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </article>
  );
}
