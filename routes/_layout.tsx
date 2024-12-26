import { PageProps } from "$fresh/server.ts";
import { Navbar } from "../components/Navbar.tsx";
import Footer from "../components/Footer.tsx";
import { FreshContext } from "$fresh/server.ts";
import { Session } from "../core/sessions.ts";

const outlines = [];
for await (const entry of Deno.readDir("./outlines")) {
  if (entry.isFile && entry.name.endsWith(".md")) {
    outlines.push(entry.name.replace(".md", ""));
  }
}

export default async function Layout(req: Request, ctx: FreshContext) {

  // Get user information from session
  const session = ctx.state.session as Session;
  const user = session?.values?.[0] ? {
    id: session.values[0],
    login: session.values[1],
  } : undefined;

  return (
    <div class="min-h-screen flex flex-col" data-theme="retro">
      <Navbar outlines={outlines} user={user} />
      <main class="flex-grow">
        <ctx.Component />
      </main>
      <Footer />
    </div>
  );
}
