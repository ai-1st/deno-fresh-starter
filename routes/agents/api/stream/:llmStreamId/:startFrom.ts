import { Handlers } from "$fresh/server.ts";
import { db } from "$db";

export const handler: Handlers = {
  async GET(req, ctx) {
    try {
      const { llmStreamId, startFrom } = ctx.params;
      const sequence = parseInt(startFrom);

      // Query all chunks after the given sequence number
      const chunks = await db.query({
        pk: `LLMSTREAM#${llmStreamId}`,
        sk: startFrom.padStart(6, '0'),
        limit: 100
      });

      console.log(chunks);

      if (chunks.length === 0) {
        return new Response(
          JSON.stringify({ 
            text: "",
            sequence: sequence,
            isComplete: false 
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      }

      const latestChunk = chunks[chunks.length - 1];
      
      return new Response(
        JSON.stringify({
          text: chunks.map(chunk => chunk.data?.output || "").join(""),
          error: latestChunk.data?.error,
          sequence: parseInt(latestChunk.sk) + 1,
          isComplete: latestChunk.data?.isComplete || false
        }),
        { headers: { "Content-Type": "application/json" } }
      );

    } catch (error) {
      console.error("Stream API error:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  }
};
