import { Head } from "$fresh/runtime.ts";

export default function Error404() {
  return (
    <>
      <Head>
        <title>404 - Page not found</title>
      </Head>
      <div class="min-h-screen hero bg-base-200">
        <div class="hero-content text-center">
          <div class="max-w-md">
            <img
              class="mx-auto mb-8"
              src="/logo.svg"
              width="128"
              height="128"
              alt="the Fresh logo: a sliced lemon dripping with juice"
            />
            <h1 class="text-5xl font-bold text-error">404</h1>
            <p class="py-6 text-xl">
              Oops! The page you were looking for doesn't exist.
            </p>
            <a href="/" class="btn btn-primary">
              Go back home
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
