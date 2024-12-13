// DO NOT EDIT. This file is generated by Fresh.
// This file SHOULD be checked into source version control.
// This file is automatically updated during development when running `dev.ts`.

import * as $_404 from "./routes/_404.tsx";
import * as $_app from "./routes/_app.tsx";
import * as $_layout from "./routes/_layout.tsx";
import * as $_middleware from "./routes/_middleware.ts";
import * as $diag from "./routes/diag.tsx";
import * as $examples_joke from "./routes/examples/joke.tsx";
import * as $examples_outlines_name_ from "./routes/examples/outlines/[name].tsx";
import * as $index from "./routes/index.tsx";
import * as $logout from "./routes/logout.ts";
import * as $signin from "./routes/signin.tsx";
import * as $signup from "./routes/signup.tsx";
import * as $user_middleware from "./routes/user/_middleware.ts";
import * as $user_index from "./routes/user/index.tsx";
import * as $user_invites from "./routes/user/invites.tsx";
import * as $CopyLinkButton from "./islands/CopyLinkButton.tsx";
import * as $Joke from "./islands/Joke.tsx";
import * as $Navbar from "./islands/Navbar.tsx";
import type { Manifest } from "$fresh/server.ts";

const manifest = {
  routes: {
    "./routes/_404.tsx": $_404,
    "./routes/_app.tsx": $_app,
    "./routes/_layout.tsx": $_layout,
    "./routes/_middleware.ts": $_middleware,
    "./routes/diag.tsx": $diag,
    "./routes/examples/joke.tsx": $examples_joke,
    "./routes/examples/outlines/[name].tsx": $examples_outlines_name_,
    "./routes/index.tsx": $index,
    "./routes/logout.ts": $logout,
    "./routes/signin.tsx": $signin,
    "./routes/signup.tsx": $signup,
    "./routes/user/_middleware.ts": $user_middleware,
    "./routes/user/index.tsx": $user_index,
    "./routes/user/invites.tsx": $user_invites,
  },
  islands: {
    "./islands/CopyLinkButton.tsx": $CopyLinkButton,
    "./islands/Joke.tsx": $Joke,
    "./islands/Navbar.tsx": $Navbar,
  },
  baseUrl: import.meta.url,
} satisfies Manifest;

export default manifest;
