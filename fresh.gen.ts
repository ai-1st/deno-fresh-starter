// DO NOT EDIT. This file is generated by Fresh.
// This file SHOULD be checked into source version control.
// This file is automatically updated during development when running `dev.ts`.

import * as $_404 from "./routes/_404.tsx";
import * as $_app from "./routes/_app.tsx";
import * as $_layout from "./routes/_layout.tsx";
import * as $_middleware from "./routes/_middleware.ts";
import * as $agents_api_task_taskId from "./routes/agents/api/task/:taskId.ts";
import * as $agents_api_version_versionId_ from "./routes/agents/api/version/[versionId].ts";
import * as $agents_cleanup from "./routes/agents/cleanup.tsx";
import * as $agents_feedback from "./routes/agents/feedback.ts";
import * as $agents_invoke from "./routes/agents/invoke.tsx";
import * as $agents_new from "./routes/agents/new.tsx";
import * as $agents_tasks from "./routes/agents/tasks.tsx";
import * as $agents_versions from "./routes/agents/versions.tsx";
import * as $api_auth_callback from "./routes/api/auth/callback.ts";
import * as $api_auth_google from "./routes/api/auth/google.ts";
import * as $diag from "./routes/diag.tsx";
import * as $examples_daisyui from "./routes/examples/daisyui.tsx";
import * as $examples_joke from "./routes/examples/joke.tsx";
import * as $examples_outlines_name from "./routes/examples/outlines/:name.tsx";
import * as $index from "./routes/index.tsx";
import * as $invite_accept_id_ from "./routes/invite/accept/[id].tsx";
import * as $logout from "./routes/logout.ts";
import * as $privacy from "./routes/privacy.tsx";
import * as $signin from "./routes/signin.tsx";
import * as $signup from "./routes/signup.tsx";
import * as $terms from "./routes/terms.tsx";
import * as $user_middleware from "./routes/user/_middleware.ts";
import * as $user_index from "./routes/user/index.tsx";
import * as $user_invites from "./routes/user/invites.tsx";
import * as $Changelog from "./islands/Changelog.tsx";
import * as $CopyLinkButton from "./islands/CopyLinkButton.tsx";
import * as $ExpandableText from "./islands/ExpandableText.tsx";
import * as $Joke from "./islands/Joke.tsx";
import * as $LLMStream from "./islands/LLMStream.tsx";
import * as $QRCode from "./islands/QRCode.tsx";
import type { Manifest } from "$fresh/server.ts";

const manifest = {
  routes: {
    "./routes/_404.tsx": $_404,
    "./routes/_app.tsx": $_app,
    "./routes/_layout.tsx": $_layout,
    "./routes/_middleware.ts": $_middleware,
    "./routes/agents/api/task/:taskId.ts": $agents_api_task_taskId,
    "./routes/agents/api/version/[versionId].ts":
      $agents_api_version_versionId_,
    "./routes/agents/cleanup.tsx": $agents_cleanup,
    "./routes/agents/feedback.ts": $agents_feedback,
    "./routes/agents/invoke.tsx": $agents_invoke,
    "./routes/agents/new.tsx": $agents_new,
    "./routes/agents/tasks.tsx": $agents_tasks,
    "./routes/agents/versions.tsx": $agents_versions,
    "./routes/api/auth/callback.ts": $api_auth_callback,
    "./routes/api/auth/google.ts": $api_auth_google,
    "./routes/diag.tsx": $diag,
    "./routes/examples/daisyui.tsx": $examples_daisyui,
    "./routes/examples/joke.tsx": $examples_joke,
    "./routes/examples/outlines/:name.tsx": $examples_outlines_name,
    "./routes/index.tsx": $index,
    "./routes/invite/accept/[id].tsx": $invite_accept_id_,
    "./routes/logout.ts": $logout,
    "./routes/privacy.tsx": $privacy,
    "./routes/signin.tsx": $signin,
    "./routes/signup.tsx": $signup,
    "./routes/terms.tsx": $terms,
    "./routes/user/_middleware.ts": $user_middleware,
    "./routes/user/index.tsx": $user_index,
    "./routes/user/invites.tsx": $user_invites,
  },
  islands: {
    "./islands/Changelog.tsx": $Changelog,
    "./islands/CopyLinkButton.tsx": $CopyLinkButton,
    "./islands/ExpandableText.tsx": $ExpandableText,
    "./islands/Joke.tsx": $Joke,
    "./islands/LLMStream.tsx": $LLMStream,
    "./islands/QRCode.tsx": $QRCode,
  },
  baseUrl: import.meta.url,
} satisfies Manifest;

export default manifest;
