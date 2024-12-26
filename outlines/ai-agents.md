# AI Agents

## Overview

We are developing an AI agent system designed to support the creation, deployment, and continuous enhancement of specialized AI agents. Each agent is tailored to perform specific tasks, with the initial implementation focused on a Professional English Text Rewriter.

The user interface prioritizes single request-response interactions rather than a conversational format. The primary goal is to refine input quality to ensure that outputs are accurate and usable on the first attempt.

Each agent's response is subject to quality control (QC) by the user or, in some cases, another agent. Depending on the result of this evaluation, the user may:

1. Mark the output as *accepted*, allowing the interaction to be added to the agent's knowledge base of successful responses.
2. Mark the output as *failed*, in which case the user can provide detailed feedback explaining what went wrong.

A specialized "Coach" agent is available in the system as a regular agent version with name "Coach". When feedback is provided, the system automatically finds the latest version of the Coach agent and uses it to analyze the execution and suggest improvements.

Agents are equipped with a set of predefined tools, such as web search, knowledge base access, code execution, and others, to enhance their functionality and support specific use cases.

## AI Agents

Each agent is defined by a system prompt. The system prompt fully defines the agent's behavior and capabilities, including any examples that guide its responses.

### Agent Versions

* Each agent has one or more versions
* Each version has a unique ULID
* Each version stores:
  * Name
  * System prompt
  * Changelog
  * Previous version ID (if not first version)
  * Hidden flag for archiving

### Agent Execution

* Agents are invoked with a user prompt
* Execution uses streaming LLM responses for real-time feedback
* Results are stored in tasks with:
  * Agent version ID
  * User prompt
  * Response stream
  * Optional parent task ID for follow-ups

### Feedback System

* Users can provide feedback on task results
* Feedback processing:
  1. System finds latest version of agent named "Coach"
  2. Creates a coaching prompt that includes:
     * Original agent name
     * Current instructions
     * Task execution (prompt and response)
     * User feedback
  3. Invokes Coach agent like any other agent
  4. Coach suggests improvements to the instructions
* When applying coach suggestions:
  * New agent version is created
  * Previous version is archived
  * Changelog records the feedback-driven improvement

### Implementation Details

* Use streaming for all LLM interactions
* Store task results with ULID identifiers
* Use TTL for temporary data (e.g., response streams)
* Keep version history for audit and rollback capability

## Architecture Decision Records (ADRs)

* Use Deno Fresh because it enables a quick development workflow - Windsurf generates code changes, and the page updates in the browser almost immediately
* Use SSR by default, as this is the philosophy of Deno Fresh
* Use DaisyUI and Tailwind for styling because these are easy to integrate with Fresh
* Use Vercel AI SDK for LLMs because I want to give it a try
* Use serverless key-value database to store state, see the db.md outline
* Center the user interface around "tasks" - each task is a single request-response interaction
* Use client polling to stream agent responses. This is OK since LLM generation produces a constant stream of tokens and 1-second polling until end of stream is fine 

## User Interface structure
* NavBar: Tasks, Agents, New Agent
* List of tasks with feedback option
* Task detail view with streaming response
* List of agent versions with Invoke/Archive/New Version actions
* Agent version creation form

## Data Structures

### Database Schema
```typescript
// Agent Version
PK: "AGENT_VERSION"
SK: "{versionId}"  // ULID
Data: {
  name: string,
  prompt: string,
  changelog: string,
  prevVersionId: string | null,
  hidden: boolean
}

// Agent Task
PK: "AGENT_TASK"
SK: "{userId}#{taskId}"  // ULID
Data: {
  agentVersionId: string,
  parentTaskId?: string,
  prompt: string,
  response: string,
  llmStreamId: string
}

// LLM Stream
PK: "LLMSTREAM#{llmStreamId}"
SK: "{sequenceNumber}"
Data: {
  output: string,
  error: string | null,
  isComplete: boolean
}
```

## Implementation Plan
* Phase 1: Core Infrastructure 
  * Set up Vercel AI SDK integration with Claude 3.5 via Bedrock
  * Implement DB schema for storing LLM outputs
  * Create streaming LLM invocation
  * Implement client-side polling
  * Build LLMStream component for real-time output display

* Phase 2: Agent Management 
  * Implement /agents/versions for version history
    * Show agents as cards with Robohash avatars
    * Use the Agent Version data structure
    * Each agent version has Archive/Invoke/New Version actions
    * Support showing/hiding archived versions
  * Create /agents/new for new agent version creation
    * Support creation from scratch or from existing version
    * Previous version is archived when creating new version
  * Implement /agents/tasks for task history
    * Show tasks in reverse chronological order
    * Display task prompt and streaming response
    * Show parent task ID for follow-up tasks
    * Link to agent version used for the task
    * Allow feedback submission

* Phase 3: Feedback System 
  * Add feedback form to task interface
  * Implement automatic coaching through Coach agent
  * Store coaching suggestions as new agent versions

* Phase 4: UI Improvements
  * Move navbar back to pure CSS using DaisyUI
  * Use textarea for the feedback
  * Coach should provide a link to open the new version of the agent
  * Navbar should overlay the elements of the invoke page
  * Navbar Agents menu should be just 2 top-level items "Agents" and "Tasks", with "New Agent" moved to the "Versions" page, and "Cleanup" moved to the "Tasks" page
  * Changelog should be implemented as an island with a collapsed "Change History" section. When expanded, it should load the full history using an API call. The API uses "prev" attribute of an agent version to recursively load previous versions. 
  * Agent version display should be consistent across all pages:
    * Reusable AgentVersion component in components/AgentVersion.tsx
    * Shows agent name, timestamp, robohash image, and changelog
    * Configurable image size (small/large) for different contexts
    * Optional "Invoke" and "New Version" buttons
    * Used in versions, invoke, and tasks pages
  * Task page improvements:
    * Shows agent version details using AgentVersion component
    * Displays task prompt and streaming LLM response
    * Includes feedback form with 5-row textarea
    * Creates new agent version when feedback is submitted
    * Redirects to versions page after feedback

* Phase 5: Multi-User Support
  * Google Authentication
  * Settings page to enter API keys
  * Share API keys with other users having a particular email domain

* Phase 6: Tool calling 
  * Add a tool to fetch content from a given URLs import { FirecrawlClient } from '@agentic/firecrawl'
  * Store tool invocations in the task data structure
  * Show the results of the Coach rewrite tool invocation as a link to the new version created
  * Instead of LLMStream, write directly into task and use versionstamp to track changes - if the versionstamp changes, the UI should update
   


