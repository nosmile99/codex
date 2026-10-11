import { describe, expect, it } from "@jest/globals";

import type {
  CollabToolCallItem,
  CommandExecutionItem,
  CommandExecutionStatus,
  FileChangeItem,
  PatchApplyStatus,
  ThreadItem,
  WebSearchAction,
  WebSearchItem,
} from "../src/items";

/**
 * Wire-shaped fixtures taken from `codex exec --experimental-json` output.
 * The shapes must stay assignable to the SDK types; if `items.ts` drifts from
 * `codex-rs/exec/src/exec_events.rs` or
 * `codex-rs/exec/src/event_processor_with_jsonl_output.rs` again, this file
 * fails to compile. See https://github.com/openai/codex/issues/28318.
 */
describe("SDK item types match the exec JSONL wire format", () => {
  it("accepts collab_tool_call items in the ThreadItem union", () => {
    // Runtime shape from https://github.com/openai/codex/issues/28318.
    const wire: CollabToolCallItem = {
      id: "item_0",
      type: "collab_tool_call",
      tool: "spawn_agent",
      sender_thread_id: "019ecb5a-ce95-7653-9214-6d152cd7f5e3",
      receiver_thread_ids: ["019ecb5b-0644-7500-9f5e-317a21ad58a4"],
      agents_states: {
        "019ecb5b-0644-7500-9f5e-317a21ad58a4": {
          status: "pending_init",
          message: null,
        },
      },
      status: "completed",
    };
    const item: CollabToolCallItem = wire;
    const threadItem: ThreadItem = item;
    expect(threadItem.type).toBe("collab_tool_call");
  });

  it("accepts every collab agent/tool status the wire format emits", () => {
    const item: CollabToolCallItem = {
      id: "item_1",
      type: "collab_tool_call",
      tool: "wait",
      sender_thread_id: "thread-a",
      receiver_thread_ids: ["thread-b"],
      prompt: null,
      agents_states: {
        "thread-b": { status: "running" },
        "thread-c": { status: "not_found", message: "gone" },
      },
      status: "in_progress",
    };
    const threadItem: ThreadItem = item;
    expect(threadItem.type).toBe("collab_tool_call");
  });

  it("accepts the declined command execution status", () => {
    const statuses: CommandExecutionStatus[] = ["in_progress", "completed", "failed", "declined"];
    const item: CommandExecutionItem = {
      id: "item_2",
      type: "command_execution",
      command: "rm -rf /",
      aggregated_output: "",
      status: "declined",
    };
    expect(statuses).toContain(item.status);
  });

  it("accepts the in_progress patch apply status", () => {
    const statuses: PatchApplyStatus[] = ["in_progress", "completed", "failed"];
    const item: FileChangeItem = {
      id: "item_3",
      type: "file_change",
      changes: [{ path: "src/a.ts", kind: "update" }],
      status: "in_progress",
    };
    expect(statuses).toContain(item.status);
  });

  it("accepts web search actions and results", () => {
    const actions: WebSearchAction[] = [
      { type: "search", query: "codex sdk", queries: ["codex sdk", "codex api"] },
      { type: "open_page", url: "https://example.com" },
      { type: "find_in_page", url: "https://example.com", pattern: "sdk" },
      { type: "other" },
    ];
    const item: WebSearchItem = {
      id: "item_4",
      type: "web_search",
      query: "codex sdk",
      action: { type: "search", query: "codex sdk" },
      results: [{ title: "codex sdk", url: "https://example.com" }],
    };
    expect(actions).toHaveLength(4);
    expect(item.action.type).toBe("search");
  });
});
