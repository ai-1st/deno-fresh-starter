Markdown Renderer using Svelte, TailwindCSS, and Marked
January 30, 2022•343 words

Markdown Renderer using Svelte, TailwindCSS, and Marked
Here's an example of a simple markdown renderer using Svelte, TailwindCSS, and Marked

Step 1 - Create a Svelte project
The two easiest options are either using Vite or using Rich Harris's default Svelte template

npm init vite@latest -- --template svelte-js
npx degit sveltejs/template

Step 2 - Install Marked
Install Marked, a popular JavaScript package that converts markdown strings to HTML

npm install marked

Step 3 - Install Tailwind
There are two options here as well, you can run through the Tailwind official guide or use the svelte-add npm package

Install Tailwind into Svelte: https://tailwindcss.com/docs/guides/sveltekit
npx svelte-add tailwindcss

Step 4 - Install and configure @tailwindcss/typography
Install the Typography package which has built-in support for styling Markdown

npm install @tailwindcss/typography

Inside your tailwind.config.js file, add the following line into the plugins block

// tailwind.config.js
module.exports = {
  theme: {
    // ...
  },
  plugins: [
    require('@tailwindcss/typography'),
    // ...
  ],
}

Step 5 - Load all of the packages from package.json
Run a npm install to load all of the missing Svelte and/or Tailwind packages from package.json into the node_modules folder.

Step 6 - Render some content!
In the @tailwindcss/typography library, the class prose is a wrapper class that applies styles to your markdown content.

In the example below, note a few things:

Create a wrapper element around your html render with this class on it to enable automatic default styles.
If you'd like to see some content, create an element with markup text in it in the form of a string, and feed it to {@html} in the marked library's parse() function.

# Marked Implementation

We'll use Marked instead of GFM for markdown rendering because:
1. Better compatibility with Deno
2. More active maintenance
3. Simpler API
4. Smaller bundle size

## Implementation Steps

1. Update deno.json imports:
```json
{
  "imports": {
    "marked": "https://esm.sh/marked@12.0.0"
  }
}
```

2. Update Markdown component:
```tsx
import { Marked } from "marked";

interface MarkdownProps {
  content: string;
  class?: string;
}

export default function Markdown({ content, class: className = "" }: MarkdownProps) {
  const marked = new Marked();
  const html = marked.parse(content);

  return (
    <div 
      class={`markdown-body ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
```

3. Update _app.tsx to use GitHub markdown styles:
```tsx
<Head>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/sindresorhus/github-markdown-css@5.0.0/github-markdown.min.css" />
</Head>

<script>
  import { marked } from "marked";

  const content = 
  `
  # Welcome to my Markdown site! 

  _Here's a list of my favorite fruits:_

    | Fruit | Rating |
    | --- | --- |
    | Banana | 10 |
    | Apple | 10 |
    | Cherry | 10 |
    `;
</script>

<main class="m-5">
  <article class="prose">
    {@html marked.parse(content)}
  </article>
</main>