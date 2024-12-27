import Footer from "../components/Footer.tsx";
import { FreshContext } from "$fresh/server.ts";
import { Session } from "../core/sessions.ts";
import Sidebar from "../components/Sidebar.tsx";

const docs = [];
for await (const entry of Deno.readDir("./docs")) {
  if (entry.isFile && entry.name.endsWith(".md")) {
    docs.push(entry.name.replace(".md", ""));
  }
}

export default async function Layout(req: Request, ctx: FreshContext) {

  // Get user information from context
  const user = ctx.state.user;

  return (
    <div class="drawer lg:drawer-open min-h-screen" data-theme="retro">
      <input id="drawer" type="checkbox" class="drawer-toggle" />
      
      <div class="drawer-content flex flex-col">
        {/* Navbar */}
        <div class="w-full navbar bg-base-100 lg:hidden">
          <div class="flex-none">
            <label for="drawer" class="btn btn-square btn-ghost drawer-button">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-5 h-5 stroke-current">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </label>
          </div>
          <div class="flex-1">
            <a href="/" class="btn btn-ghost normal-case text-xl">Deno Fresh Starter</a>
          </div>
        </div>

        {/* Main content */}
        <main class="flex-grow p-4">
          <ctx.Component />
        </main>
        
        <Footer />
      </div>

      {/* Sidebar */}
      <Sidebar user={user} docs={docs} />
      </div>
  );
}