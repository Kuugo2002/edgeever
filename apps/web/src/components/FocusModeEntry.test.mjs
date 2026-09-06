import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const editorPaneSource = readFileSync(new URL("./EditorPane.tsx", import.meta.url), "utf8");
const diagramEditorPaneSource = readFileSync(new URL("./DiagramEditorPane.tsx", import.meta.url), "utf8");

const expectDiscoverableFocusModeEntry = (source) => {
  const normalizedSource = source.replace(/\s+/g, " ");
  expect(normalizedSource).toContain('size="sm" variant={desktopFocusMode ? "soft" : "ghost"}');
  expect(normalizedSource).toContain('<span>{t(desktopFocusMode ? "editor.exitFocusMode" : "editor.focusMode")}</span>');
  expect(source).not.toContain('size="sm"\n                      variant="solid"');
};

describe("focus mode entry", () => {
  test("labels a restrained action in every desktop note editor instead of relying on an ambiguous icon", () => {
    expectDiscoverableFocusModeEntry(editorPaneSource);
    expectDiscoverableFocusModeEntry(diagramEditorPaneSource);
  });

  test("groups the standard editor entry with note view controls instead of top-level navigation", () => {
    const readingProtectionIconIndex = editorPaneSource.indexOf(
      '{desktopReadingProtection ? <Lock className="h-4 w-4" /> : <LockOpen className="h-4 w-4" />}',
    );
    const focusModeEntryIndex = editorPaneSource.indexOf(
      'title={t(desktopFocusMode ? "editor.exitFocusMode" : "editor.enterFocusMode")}',
    );
    expect(readingProtectionIconIndex).toBeGreaterThan(-1);
    expect(focusModeEntryIndex).toBeGreaterThan(readingProtectionIconIndex);
  });
});
