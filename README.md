# Deno Fresh Starter

This is an opinionated starter project for Deno Fresh with Tailwind CSS. The goal is to set the groundwork for developing fullstack apps using Cursor/Windsurf IDEs relying heavily on AI code generation. AI works best when given examples, so this is what the project is providing.

Initially started as a basic Deno Fresh template, this project has evolved to include a complete AI agent ecosystem implementation. This ecosystem demonstrates how to build and manage AI agents with a feedback-driven improvement system.

## AI Agent Ecosystem

The project includes a complete implementation of an AI agent system in the `/routes/agents` folder. Key features include:

### Core Concepts

1. **AI Agents**: Each agent is defined by a system prompt that fully specifies its behavior and capabilities. Agents can be created, versioned, and improved over time.

2. **Feedback System**: The ecosystem includes a sophisticated feedback mechanism:
   - Users can provide feedback on agent responses
   - A specialized "Coach" agent analyzes the feedback
   - The Coach suggests improvements to the agent's instructions
   - New versions are created with improved instructions

3. **Version Control**: 
   - Each agent maintains a linear version history
   - Only the most recent version is active
   - Each version stores:
     - Name
     - System prompt
     - Changelog
     - Previous version reference

4. **Task Management**:
   - Each agent interaction is tracked as a task
   - Tasks store the prompt, response, and any feedback
   - Responses are streamed in real-time
   - Task history is maintained for analysis

### Using Without Agents

If you want to use this template without the AI agent ecosystem - just remove the `/routes/agents` folder.

## Development Guidelines

* See [.windsurfrules](https://github.com/ai-1st/deno-fresh-starter/blob/main/.windsurfrules) for development guidelines for Windsurf editor.
* See [docs](https://github.com/ai-1st/deno-fresh-starter/tree/main/docs) for functionality description and design decisions.

Website: https://deno-fresh-starter.dev/

GitHub: https://github.com/ai-1st/deno-fresh-starter
