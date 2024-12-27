/**
 * Main navigation sidebar component
 * Provides app navigation and user profile section
 * @param {Object} props - Component props
 * @param {Object} props.user - User object containing id and login if authenticated
 */
export default function Sidebar({ user, docs }) {
  return (
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

            <li>
              <details>
                <summary class="flex gap-4">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd" />
                  </svg>
                  Docs
                </summary>
                <ul>
                  <li>
                    <a href="/examples/docs/.windsurfrules">Windsurf Rules</a>
                  </li>
                  {docs.map((outline) => (
                    <li key={outline}>
                      <a href={`/examples/docs/${outline}`}>
                        {outline.charAt(0).toUpperCase() + outline.slice(1)}
                      </a>
                    </li>
                  ))}
                </ul>
              </details>
            </li>
          </ul>

          {user ? (
            <div class="mt-auto pt-4">
              <div class="flex items-center gap-2 px-4">
                <div class="avatar">
                  {user.picture ? (
                    <div class="w-8 rounded-full">
                      <img src={user.picture} alt={user.name} />
                    </div>
                  ) : (
                    <div class="bg-neutral-focus text-neutral-content rounded-full w-8">
                      <span class="text-xs">{user.name[0].toUpperCase()}</span>
                    </div>
                  )}
                </div>
                <div class="flex flex-col">
                  <span class="text-sm font-medium">{user.name}</span>
                  <span class="text-xs text-base-content/60">{user.email}</span>
                  <a href="/logout" class="text-xs text-error">Sign out</a>
                </div>
              </div>
            </div>
          ) : (
            <div class="mt-auto pt-4">
              <a 
                href="/api/auth/google" 
                class="btn btn-outline gap-2 w-full"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                  <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                  <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                  <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
                </svg>
                Sign in with Google
              </a>
            </div>
          )}
        </div>
      </div>
    
    );
}
