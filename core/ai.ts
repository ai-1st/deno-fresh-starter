import { generateText, streamText } from 'https://esm.sh/ai';
import { createAmazonBedrock } from 'https://esm.sh/@ai-sdk/amazon-bedrock';
import { TavilyClient } from "https://esm.sh/@agentic/tavily";
import { createAISDKTools } from 'https://esm.sh/@agentic/ai-sdk'

const bedrock = createAmazonBedrock({
    region: Deno.env.get('AWS_REGION'),
    accessKeyId: Deno.env.get('AWS_ACCESS_KEY_ID'),
    secretAccessKey: Deno.env.get('AWS_SECRET_ACCESS_KEY'),
});

const model = bedrock("us.anthropic.claude-3-5-sonnet-20241022-v2:0");

const tavily = new TavilyClient({
  apiKey: Deno.env.get("TAVILY_API_KEY")
});

const tools = createAISDKTools(tavily);



export interface StreamMessage {
  role: "assistant" | "user" | "system";
  content: string;
}

export interface StreamChunk {
  data?: string;
  error?: string;
  sequence: number;
  last: boolean;
}

const CHUNK_SIZE = 100;

export async function llmInvoke(system: string, prompt: string): Promise<string> {
  try {
    const result = await generateText({
      model,
      system,
      prompt,
      tools,
      maxSteps: 5, 
    });
    
    console.log("Generation result:", result);
    const text = result.text;
    return text;
  } catch (error) {
    console.error("Error in llmInvoke:");
    console.error("Error message:", error.message);
    console.error("Full error:", error);
    console.error("Stack trace:", error.stack);
    if (error.cause) {
      console.error("Error cause:", error.cause);
    }
    throw error; // Re-throw to let caller handle it
  }
}

/**
 * Stream text completion with tool support.
 * Enables AI to perform web searches using Tavily during generation.
 */
export async function* llmStream(system: string, prompt: string): AsyncGenerator<StreamChunk> {
  let sequence = 1;
  try {
    console.log("Prompt:", prompt);
    const { textStream } = streamText({
      model,
      prompt,
      system,
      tools,
      maxSteps: 5, 
    });

    let sequence = 1;
    let bigChunk = "";
    for await (const chunk of textStream) {
      if (chunk) {
        bigChunk += chunk;
        if (bigChunk.length > CHUNK_SIZE) {
          yield { data: bigChunk, sequence: sequence++, last: false };  
          bigChunk = "";
        }
      }
    }
    yield { data: bigChunk, sequence: sequence++, last: true }; 
  } catch (error) {
    console.error("Streaming error:", error);
    yield { error: error.message, sequence: sequence++, last: true };
  }
}

/**
 * Coach agent that improves system prompts based on feedback.
 * @param currentPrompt Current system prompt
 * @param taskPrompt Original task prompt
 * @param response Agent's response
 * @param feedback User feedback
 * @returns Stream of improved system prompt
 */
export async function* llmCoach(
  currentPrompt: string,
  taskPrompt: string,
  response: string,
  feedback: string
): AsyncGenerator<{ data?: string; error?: string; sequence: number; last: boolean }> {
  const system = `You are an AI coach that helps improve agent system prompts based on task execution feedback.
Review the agent execution and feedback, then generate an improved system prompt.
Do not explain or add commentary - output only the improved system prompt.
Preserve any examples from the original prompt but improve them if needed.
Make your changes focused on addressing the specific feedback while maintaining the agent's core functionality.`;

  const prompt = `Current system prompt:
${currentPrompt}

Task execution:
Prompt: ${taskPrompt}
Response: ${response}

Feedback: ${feedback}

Generate improved system prompt:`;

  yield* llmStream(system, prompt);
}
