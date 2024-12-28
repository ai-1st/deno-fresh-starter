# AI Agents Technical Documentation

## Implementation Details

### Database Schema
```typescript
// Agent Version
PK: "AGENT_VERSION"
SK: "{versionId}"  // ULID
Data: {
  name: string;
  prompt: string;
  previousVersion?: string;
  changelog?: string;
  timestamp: string;
  hidden?: boolean;
}

// Tasks
PK: "AGENT_TASK"
SK: "{userEmail}#{taskId}"  // ULID
Data: {
  agentVersionId: string;
  prompt: string;
  timestamp: string;
  isComplete: boolean;
  error?: string;
  parentTaskId?: string;
}

// Task Stream Parts
PK: "TASK_STREAM#{taskId}"
SK: "{partNumber}"  // Padded sequential number
Data: StreamPart;  // See StreamPart interface

// Agent Name to Version Mapping
PK: "AGENTS_BY_NAME/{userEmail}"
SK: "{agentName}"
Data: string;  // Latest version ID
```

### Architecture Decision Records (ADRs)

* Use Deno Fresh because it enables a quick development workflow - Windsurf generates code changes, and the page updates in the browser almost immediately
* Use SSR by default, as this is the philosophy of Deno Fresh
* Use DaisyUI and Tailwind for styling because these are easy to integrate with Fresh
* Use Vercel AI SDK for LLMs because I want to give it a try
* Use serverless key-value database to store state
* Center the user interface around "tasks" - each task is a single request-response interaction
* Use client polling to stream agent responses. This is OK since LLM generation produces a constant stream of tokens and 1-second polling until end of stream is fine 

### User Interface Structure

* NavBar: Tasks, Agents, New Agent
* List of tasks with feedback option
* Task detail view with streaming response
* List of agent versions with Invoke/Archive/New Version actions
* Agent version creation form

### Implementation Notes

* Use streaming for all LLM interactions
* Store task results with ULID identifiers
* Use TTL for temporary data (e.g., response streams)
* Keep version history for audit and rollback capability
