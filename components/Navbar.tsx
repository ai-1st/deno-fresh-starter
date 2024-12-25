/** 
 * Main navigation component using DaisyUI CSS framework
 * Provides navigation links and dropdown menus for site sections
 */

interface NavbarProps {
  outlines: string[];
  user?: {
    id: string;
    login: string;
  };
}

export function Navbar({ outlines, user }: NavbarProps) {
  return (
    <div class="navbar bg-base-100 shadow-lg">
      <div class="navbar-start">
        <div class="dropdown">
          <label tabIndex={0} class="btn btn-ghost lg:hidden">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
            </svg>
          </label>
          <ul tabIndex={0} class="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
            <li><a href="/">Home</a></li>
            <li>
              <a>Examples</a>
              <ul class="p-2">
                <li><a href="/examples/joke">Joke</a></li>
              </ul>
            </li>
            <li>
              <a>Agents</a>
              <ul class="p-2">
                <li><a href="/agents/versions">Versions</a></li>
                <li><a href="/agents/new">New Agent</a></li>
                <li><a href="/agents/tasks">Tasks</a></li>
                <li><a href="/agents/cleanup" class="text-error">Cleanup</a></li>
              </ul>
            </li>
            <li>
              <a>Outlines</a>
              <ul class="p-2">
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
            </li>
          </ul>
        </div>
        <a href="/" class="btn btn-ghost normal-case text-xl">Deno Fresh Starter</a>
      </div>
      
      <div class="navbar-center hidden lg:flex">
        <ul class="menu menu-horizontal px-1">
          <li><a href="/">Home</a></li>
          <li>
            <details>
              <summary>Examples</summary>
              <ul class="p-2 bg-base-100 rounded-t-none">
                <li><a href="/examples/joke">Joke</a></li>
              </ul>
            </details>
          </li>
          <li>
            <details>
              <summary>Agents</summary>
              <ul class="p-2 bg-base-100 rounded-t-none">
                <li><a href="/agents/versions">Versions</a></li>
                <li><a href="/agents/new">New Agent</a></li>
                <li><a href="/agents/tasks">Tasks</a></li>
                <li><a href="/agents/cleanup" class="text-error">Cleanup</a></li>
              </ul>
            </details>
          </li>
          <li>
            <details>
              <summary>Outlines</summary>
              <ul class="p-2 bg-base-100 rounded-t-none">
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
      </div>
      
      <div class="navbar-end">
        {user ? (
          <div class="dropdown dropdown-end">
            <label tabIndex={0} class="btn btn-ghost">
              {user.login}
              <svg class="w-4 h-4 ml-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </label>
            <ul tabIndex={0} class="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
              <li><a href="/user/invites">Invites</a></li>
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
