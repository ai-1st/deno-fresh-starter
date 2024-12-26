import { Handlers, PageProps } from "$fresh/server.ts";
import Markdown from "../components/Markdown.tsx";

interface HomeProps {
  readme: string;
}

export const handler: Handlers<HomeProps> = {
  async GET(req, ctx) {
    const readme = await Deno.readTextFile("./README.md");
    return ctx.render({ readme });
  },
};

export default function Home({ data }: PageProps<HomeProps>) {
  return (
    <div class="min-h-screen">
      <Markdown content={data.readme} />
    </div>
  );
}
