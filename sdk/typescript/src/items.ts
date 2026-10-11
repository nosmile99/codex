// based on item types from codex-rs/exec/src/exec_events.rs

import type { ContentBlock as McpContentBlock } from "@modelcontextprotocol/sdk/types.js";

/** The status of a command execution. */
export type CommandExecutionStatus = "in_progress" | "completed" | "failed" | "declined";

/** A command executed by the agent. */
export type CommandExecutionItem = {
  id: string;
  type: "command_execution";
  /** The command line executed by the agent. */
  command: string;
  /** Aggregated stdout and stderr captured while the command was running. */
  aggregated_output: string;
  /**
   * Always present on the wire; `null` while the command is still running.
   * Note this is *not* omitted — check `exit_code == null`, not
   * `exit_code === undefined`.
   */
  exit_code: number | null;
  /** Current status of the command execution. */
  status: CommandExecutionStatus;
};

/** Indicates the type of the file change. */
export type PatchChangeKind = "add" | "delete" | "update";

/** A set of file changes by the agent. */
export type FileUpdateChange = {
  path: string;
  kind: PatchChangeKind;
};

/** The status of a file change. */
export type PatchApplyStatus = "in_progress" | "completed" | "failed";

/** A set of file changes by the agent. Emitted once the patch succeeds or fails. */
export type FileChangeItem = {
  id: string;
  type: "file_change";
  /** Individual file changes that comprise the patch. */
  changes: FileUpdateChange[];
  /** Whether the patch ultimately succeeded or failed. */
  status: PatchApplyStatus;
};

/** The status of an MCP tool call. */
export type McpToolCallStatus = "in_progress" | "completed" | "failed";

/**
 * Represents a call to an MCP tool. The item starts when the invocation is dispatched
 * and completes when the MCP server reports success or failure.
 */
export type McpToolCallItem = {
  id: string;
  type: "mcp_tool_call";
  /** Name of the MCP server handling the request. */
  server: string;
  /** The tool invoked on the MCP server. */
  tool: string;
  /** Arguments forwarded to the tool invocation. */
  arguments: unknown;
  /**
   * Result payload returned by the MCP server for successful calls.
   * Always present on the wire; `null` until the call completes successfully.
   */
  result: {
    content: McpContentBlock[];
    _meta?: unknown;
    structured_content: unknown;
  } | null;
  /**
   * Error message reported for failed calls.
   * Always present on the wire; `null` until the call fails.
   */
  error: {
    message: string;
  } | null;
  /** Current status of the tool invocation. */
  status: McpToolCallStatus;
};

/** The status of a collab tool call. */
export type CollabToolCallStatus = "in_progress" | "completed" | "failed";

/** The collab tools that can appear in a collab tool call item. */
export type CollabTool = "spawn_agent" | "send_input" | "wait" | "close_agent";

/** The status of a collab agent. */
export type CollabAgentStatus =
  "pending_init" | "running" | "interrupted" | "completed" | "errored" | "shutdown" | "not_found";

/** Last known state of a collab agent. */
export type CollabAgentState = {
  status: CollabAgentStatus;
  /** Present when the agent reported a status message; null when not set. */
  message?: string | null;
};

/**
 * Represents a call to a collab tool (e.g. spawning a subagent). The item starts
 * when the collab tool is invoked and completes when it reports success or failure.
 *
 * The wire mapping is conditional: `SendMessage`, `FollowupTask`,
 * `InterruptAgent`, `ListAgents` and `Interrupted` statuses are never emitted,
 * and `ResumeAgent` is folded into `wait` — so the wire only ever carries
 * `spawn_agent` / `send_input` / `wait` / `close_agent` with
 * `in_progress` / `completed` / `failed`.
 */
export type CollabToolCallItem = {
  id: string;
  type: "collab_tool_call";
  /** The collab tool that was invoked. */
  tool: CollabTool;
  /** Thread that issued the call. */
  sender_thread_id: string;
  /** Threads the call was directed at. */
  receiver_thread_ids: string[];
  /** Prompt handed to the spawned agent, when applicable. */
  prompt?: string | null;
  /** Last known state of each involved agent, keyed by thread id. */
  agents_states: Record<string, CollabAgentState>;
  /** Current status of the collab tool call. */
  status: CollabToolCallStatus;
};

/** Response from the agent. Either natural-language text or JSON when structured output is requested. */
export type AgentMessageItem = {
  id: string;
  type: "agent_message";
  /** Either natural-language text or JSON when structured output is requested. */
  text: string;
};

/** Agent's reasoning summary. */
export type ReasoningItem = {
  id: string;
  type: "reasoning";
  text: string;
};

/** The web search action that produced this item. */
export type WebSearchAction =
  | { type: "search"; query?: string; queries?: string[] }
  | { type: "open_page"; url?: string }
  | { type: "find_in_page"; url?: string; pattern?: string }
  | { type: "other" };

/** Captures a web search request. Completes when results are returned to the agent. */
export type WebSearchItem = {
  id: string;
  type: "web_search";
  query: string;
  /** The search action that was performed. */
  action: WebSearchAction;
  /** Structured results returned by web search, when available. */
  results?: unknown[];
};

/** Describes a non-fatal error surfaced as an item. */
export type ErrorItem = {
  id: string;
  type: "error";
  message: string;
};

/** An item in the agent's to-do list. */
export type TodoItem = {
  text: string;
  completed: boolean;
};

/**
 * Tracks the agent's running to-do list. Starts when the plan is issued, updates as steps change,
 * and completes when the turn ends.
 */
export type TodoListItem = {
  id: string;
  type: "todo_list";
  items: TodoItem[];
};

/** Canonical union of thread items and their type-specific payloads. */
export type ThreadItem =
  | AgentMessageItem
  | ReasoningItem
  | CommandExecutionItem
  | FileChangeItem
  | McpToolCallItem
  | CollabToolCallItem
  | WebSearchItem
  | TodoListItem
  | ErrorItem;
