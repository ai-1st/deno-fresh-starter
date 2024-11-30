import { AppProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";

export default function App({ Component }: AppProps) {
  return (
    <html>
      <Head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>deno-fresh-starter</title>
        <link rel="stylesheet" href="/styles.css" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/sindresorhus/github-markdown-css@5.0.0/github-markdown.min.css" />
      </Head>
      <body>
        <Component />
      </body>
    </html>
  );
}
