import { PageProps } from "$fresh/server.ts";
// import { Navbar } from "../components/Navbar.tsx";
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
      <div class="drawer-side z-40">
        <label for="drawer" class="drawer-overlay"></label>
        <div class="menu p-4 w-80 min-h-full bg-base-200 text-base-content">
          {/* Sidebar content */}
          <div class="font-title inline-flex text-lg md:text-2xl mb-8">
            <span class="text-primary lowercase">Deno Fresh</span>
            <span class="text-base-content lowercase">Starter</span>
          </div>

          <ul class="menu menu-lg gap-2">
            <li><a href="/" class="flex gap-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              Home
            </a></li>
            
            <li><a href="/agents/versions" class="flex gap-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
              Agents
            </a></li>

            <li><a href="/agents/tasks" class="flex gap-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd" />
              </svg>
              Tasks
            </a></li>

            <div class="divider"></div>

            <li>
              <details>
                <summary class="flex gap-4">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd" />
                  </svg>
                  Outlines
                </summary>
                <ul>
                  <li>
                    <a href="/examples/outlines/.windsurfrules">Windsurf Rules</a>
                  </li>
                  {outlines.map((outline) => (
                    <li key={outline}>
                      <a href={`/examples/outlines/${outline}`}>
                        {outline.charAt(0).toUpperCase() + outline.slice(1)}
                      </a>
                    </li>
                  ))}
                </ul>
              </details>
            </li>
          </ul>

          {user && (
            <div class="mt-auto pt-4 border-t">
              <div class="flex items-center gap-2 px-4">
                <div class="avatar placeholder">
                  <div class="bg-neutral-focus text-neutral-content rounded-full w-8">
                    <span class="text-xs">{user.login[0].toUpperCase()}</span>
                  </div>
                </div>
                <div class="flex flex-col">
                  <span class="text-sm font-medium">{user.login}</span>
                  <a href="/auth/logout" class="text-xs text-error">Sign out</a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
