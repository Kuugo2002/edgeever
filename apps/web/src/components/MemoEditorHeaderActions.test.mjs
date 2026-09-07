import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const actionsSource = readFileSync(new URL("./MemoEditorHeaderActions.tsx", import.meta.url), "utf8");
const editorSource = readFileSync(new URL("./EditorPane.tsx", import.meta.url), "utf8");
const diagramSource = readFileSync(new URL("./DiagramEditorPane.tsx", import.meta.url), "utf8");
const densitySource = readFileSync(new URL("./MemoEditorChromeDensity.ts", import.meta.url), "utf8");
const editorToolbarSource = readFileSync(new URL("./EditorToolbar.tsx", import.meta.url), "utf8");
const diagramToolbarSource = readFileSync(new URL("./DiagramToolbar.tsx", import.meta.url), "utf8");

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

  test("applies one shared compact density standard to both editors", () => {
    expect(editorSource).toContain("MEMO_EDITOR_TOP_ROW_CLASS_NAME");
    expect(diagramSource).toContain("MEMO_EDITOR_TOP_ROW_CLASS_NAME");
    expect(editorToolbarSource).toContain("MEMO_EDITOR_TOOLBAR_PADDING_CLASS_NAME");
    expect(diagramToolbarSource).toContain("MEMO_EDITOR_TOOLBAR_PADDING_CLASS_NAME");
    expect(densitySource).toContain("sm:min-h-10 sm:px-5 sm:py-1");
    expect(densitySource).toContain("min-[1600px]:min-h-11");
    expect(densitySource).toContain("min-[1600px]:flex");
  });
});
