# Deno Fresh Starter

This is an opinionated starter project for Deno Fresh with Tailwind CSS. The goal is to set the groundwork for developing fullstack apps using Cursor/Tailwind IDEs relying heavily on AI code generation. AI works best when given examples, so this is what the project is providing.

Once you get ready to release your first version, ask AI to remove or disable the example code.

Website: https://deno-fresh-starter.dev/

GitHub: https://github.com/ai-1st/deno-fresh-starter

### Opinions

If you don't like any of these, you can always fork this repo and make your own.

* Use TypeScript rather than JavaScript
* Send HTML over HTTP rather than JSON
* Use browser page reloads and server redirects rather than client-side navigation
* Use ULIDs rather than UUIDs
* Use SSE rather than WebSocket or polling

DB opinions:

* Use platform-native databases rather than a single database solution
* Use composite keys rather than simple keys
* Use optimistic rather than pessimistic locking
* Use atomic operations rather than distributed transactions
* Use SSE streams rather than NDJSON or paginated responses

### Features

* Login/Logout forms
* Protected routes
* Hamburger menu
* Islands
	+ Joke island
	+ Barcode scanner island
    + Log island

### Usage

Make sure to install Deno: https://deno.land/manual/getting_started/installation

Then start the project:

```
deno task start
```

This will watch the project directory and restart as necessary.
