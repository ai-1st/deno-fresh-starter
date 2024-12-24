import { useState, useCallback } from "preact/hooks";

interface NavbarProps {
  outlines: string[];
  user?: {
    id: string;
    login: string;
  };
}

export default function Navbar({ outlines, user }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");

  const handleNavigation = useCallback((e: MouseEvent) => {
    const target = e.currentTarget as HTMLAnchorElement;
    if (target.href && !target.href.includes("#")) {
      e.preventDefault();
      setLoading(true);
      setLoadingText(target.textContent || "Loading...");
      window.location.href = target.href;
    }
  }, []);

  return (
    <nav class="nav-wrapper">
      <div class="flex justify-between items-center relative">
        <a href="/" class="text-xl font-bold text-gray-800" onClick={handleNavigation}>
          Deno Fresh Starter
        </a>

        <input 
          type="checkbox" 
          id="menu-toggle" 
          class="menu-toggle"
          checked={isMenuOpen}
          onChange={(e) => setIsMenuOpen(e.currentTarget.checked)} 
        />
        <label for="menu-toggle" class="nav-icon">
          <span></span>
          <span></span>
          <span></span>
        </label>

        <div class={`menu-items ${isMenuOpen ? 'show' : ''}`}>
          <a href="/" onClick={handleNavigation}>Home</a>
          <div class="relative group">
            <a href="#" class="inline-flex items-center">
              Examples
              <span class="ml-1">↓</span>
            </a>
            <div class="invisible group-hover:visible opacity-0 group-hover:opacity-100 absolute z-50 mt-1 left-0 w-48 md:left-auto md:right-0 md:w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 transition-all duration-300 flex flex-col">
              <div class="py-1 flex flex-col space-y-2">
                <a href="/examples/joke" onClick={handleNavigation}>Joke</a>
              </div>
            </div>
          </div>
          <div class="relative group">
            <a href="#" class="inline-flex items-center">
              Agents
              <span class="ml-1">↓</span>
            </a>
            <div class="invisible group-hover:visible opacity-0 group-hover:opacity-100 absolute z-50 mt-1 left-0 w-48 md:left-auto md:right-0 md:w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 transition-all duration-300 flex flex-col">
              <div class="py-1 flex flex-col space-y-2">
                <a href="/agents/versions" onClick={handleNavigation}>Versions</a>
                <a href="/agents/new" onClick={handleNavigation}>New Agent</a>
                <a href="/agents/tasks" onClick={handleNavigation}>Tasks</a>
                <a href="/agents/cleanup" onClick={handleNavigation} class="text-red-600 hover:text-red-800">Cleanup</a>
              </div>
            </div>
          </div>
          <div class="relative group">
            <a href="#" class="inline-flex items-center">
              Outlines
              <span class="ml-1">↓</span>
            </a>
            <div class="invisible group-hover:visible opacity-0 group-hover:opacity-100 absolute z-50 mt-1 left-0 w-48 md:left-auto md:right-0 md:w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 transition-all duration-300 flex flex-col">
              <div class="py-1 flex flex-col space-y-2">
                {outlines.map((outline) => (
                  <a 
                    href={`/examples/outlines/${outline}`} 
                    key={outline}
                    onClick={handleNavigation}
                  >
                    {outline.charAt(0).toUpperCase() + outline.slice(1)}
                  </a>
                ))}
              </div>
            </div>
          </div>
          {user ? (
            <>
              <div class="relative group">
                <a href="#" class="inline-flex items-center">
                  {user.login}
                  <span class="ml-1">↓</span>
                </a>
                <div class="invisible group-hover:visible opacity-0 group-hover:opacity-100 absolute z-50 mt-1 left-0 w-48 md:left-auto md:right-0 md:w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 transition-all duration-300 flex flex-col">
                  <div class="py-1 flex flex-col space-y-2">
                    <a href="/user/invites" onClick={handleNavigation}>Invites</a>
                    <a href="/logout" class="text-red-600 hover:text-red-800" onClick={handleNavigation}>Log Out</a>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <a href="/signin" onClick={handleNavigation}>Sign In</a>
              <a href="/signup" onClick={handleNavigation}>Sign Up</a>
            </>
          )}
        </div>

        {loading && (
          <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[200]">
            <div class="bg-white rounded-lg p-4 flex items-center space-x-3">
              <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
              <span>{loadingText}</span>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
