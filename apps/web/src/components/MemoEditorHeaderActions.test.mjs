import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const actionsSource = readFileSync(new URL("./MemoEditorHeaderActions.tsx", import.meta.url), "utf8");
const editorSource = readFileSync(new URL("./EditorPane.tsx", import.meta.url), "utf8");
const diagramSource = readFileSync(new URL("./DiagramEditorPane.tsx", import.meta.url), "utf8");

describe("shared memo editor header actions", () => {
  test("owns every action shared by text and diagram notes", () => {
    expect(actionsSource).toContain("<Search");
    expect(actionsSource).toContain("<GitHubRepositoryLink");
    expect(actionsSource).toContain("<SystemInfoDialog");
    expect(actionsSource).toContain("{companionDiscoveryHub}");
    expect(actionsSource).toContain("<ExecutionCenterButton");
    expect(actionsSource).toContain("<ThemeToggle />");
    expect(actionsSource).toContain("<MoreHorizontal");
  });

  test("is reused by both editors while text-only actions remain explicit slots", () => {
    expect(editorSource).toContain("<MemoEditorHeaderActions");
    expect(diagramSource).toContain("<MemoEditorHeaderActions");
    expect(editorSource).toContain("textNoteActions={(\n");
    expect(editorSource).toContain("textNoteMenuItems=");
    expect(diagramSource).not.toContain("textNoteActions=");
    expect(diagramSource).not.toContain("<WeChatIcon");
  });
});
