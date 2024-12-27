import { Handlers, PageProps } from "$fresh/server.ts";
import Markdown from "../../../components/Markdown.tsx";

interface OutlineProps {
  content: string;
}

export const handler: Handlers<OutlineProps> = {
  async GET(_req, ctx) {
    try {
      const name = ctx.params.name;
      let content;
      
      if (name === '.windsurfrules') {
        content = await Deno.readTextFile('./.windsurfrules');
      } else {
        content = await Deno.readTextFile(`./docs/${name}.md`);
      }
      
      return ctx.render({ content });
    } catch (e) {
      if (e instanceof Deno.errors.NotFound) {
        return ctx.renderNotFound();
      }
      throw e;
    }
  },
};

export default function OutlinePage({ data }: PageProps<OutlineProps>) {
  return (
    <div class="min-h-screen">
      <Markdown content={data.content} />
    </div>
  );
}
