interface NavbarProps {
  outlines: string[];
}

export default function Navbar({ outlines }: NavbarProps) {
  return (
    <>
      <nav class="nav-wrapper">
        <div class="flex justify-between items-center">
          <a href="/" class="text-xl font-bold text-gray-800">
            Deno Fresh Starter
          </a>
          
          <input type="checkbox" id="menu-toggle" class="menu-toggle" />
          <label for="menu-toggle" class="nav-icon">
            <span></span>
            <span></span>
            <span></span>
          </label>

          <div class="menu-items flex flex-col md:flex-row">
            <a href="/">Home</a>
            <div class="relative group">
              <a href="#" class="inline-flex items-center">
                Examples
                <span class="ml-1">↓</span>
              </a>
              <div class="invisible group-hover:visible opacity-0 group-hover:opacity-100 absolute z-50 mt-1 left-0 w-48 md:left-auto md:right-0 md:w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 transition-all duration-300 flex flex-col">
                <div class="py-1 flex flex-col space-y-2">
                  <a href="/examples/joke">Joke</a>
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
                    <a href={`/examples/outlines/${outline}`} key={outline}>
                      {outline.charAt(0).toUpperCase() + outline.slice(1)}
                    </a>
                  ))}
                </div>
              </div>
            </div>
            <a href="/login">Login</a>
            <a href="/signup">Sign Up</a>
          </div>
        </div>
      </nav>
    </>
  );
}
