import { PageProps } from "$fresh/server.ts";
import Navbar from "../components/Navbar.tsx";
import Footer from "../components/Footer.tsx";
import { FreshContext } from "$fresh/server.ts";

export default async function Layout(req: Request, ctx: FreshContext) {
  const outlines = [];
  for await (const entry of Deno.readDir("./outlines")) {
    if (entry.isFile && entry.name.endsWith(".md")) {
      outlines.push(entry.name.replace(".md", ""));
    }
  }

  return (
    <div class="min-h-screen flex flex-col">
      <Navbar outlines={outlines} />
      <main class="flex-grow">
        <ctx.Component />
      </main>
      <Footer />
    </div>
  );
}
