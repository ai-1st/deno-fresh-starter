/**
 * Test route for trying out Tavily search integration.
 * Sends a test query and displays results.
 */

import { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import { llmInvoke } from "../../core/ai.ts";

interface TestSearchData {
  result: string;
}

const query = "What are the latest developments in Deno Fresh framework with exact dates?"

export default function TestSearch({ data }: PageProps<TestSearchData>) {
  return (
    <>
      <Head>
        <title>Test Search</title>
      </Head>
      <div class="p-4 mx-auto max-w-screen-md">
        <h1 class="text-2xl font-bold mb-4">Test Search</h1>
        <div class="bg-gray-100 p-4 rounded">
          <h2 class="font-semibold mb-2">Search Query:</h2>
          <p class="mb-4">{query}</p>
          <h2 class="font-semibold mb-2">Response:</h2>
          <div class="whitespace-pre-wrap">{data.result}</div>
        </div>
      </div>
    </>
  );
}

export const handler: Handlers<TestSearchData> = {
  async GET(_req, ctx) {
    try {
      const system = "You are a helpful AI assistant. Use the search tool to find recent information and provide accurate, up-to-date answers.";
      const result = await llmInvoke(system, query);

      return ctx.render({ result });
    } catch (error) {
      console.error("Generation error:", error);
      return ctx.render({ result: `Error: ${error.message}` });
    }
  }
};
