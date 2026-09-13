import { useCallback, useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useEditorTheme, useMermaidTheme } from "@/components/ThemeProvider";
import { embedMermaidForPreview } from "@/lib/phone-preview-mermaid";
import { Switch } from "@/components/ui/switch";
import { buildPhonePreviewHtml } from "@/lib/publish-layout";
import {
  readEditorPhonePreviewFollowPreference,
  writeEditorPhonePreviewFollowPreference,
} from "@/lib/app-helpers";

type EditorPhonePreviewProps = {
  editor: Editor | null;
  title?: string;
  scrollContainer?: HTMLDivElement | null;
  className?: string;
};

const formatPhoneTime = () =>
  new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date());

const BLOCK_SELECTOR =
  "p, h1, h2, h3, li, blockquote, pre, img, table, hr, figure, [data-edgeever-theme-block]";

export const collectPhonePreviewBlocks = (root: Element, skipTitle = "") => {
  const blocks = [...root.querySelectorAll<HTMLElement>(BLOCK_SELECTOR)].filter((element) => {
    if (element.matches("[data-ee-publish-chrome]") || element.closest("[data-ee-publish-chrome]")) {
      return false;
    }
    const parentBlock = element.parentElement?.closest(BLOCK_SELECTOR);
    if (parentBlock && parentBlock !== element && root.contains(parentBlock)) {
      return false;
    }
    return true;
  });

  const trimmedTitle = skipTitle.trim();
  if (trimmedTitle && blocks[0]?.tagName === "H1" && blocks[0].textContent?.trim() === trimmedTitle) {
    return blocks.slice(1);
  }
  return blocks;
};

const fingerprint = (element: HTMLElement) =>
  `${element.tagName}:${(element.innerText || element.getAttribute("src") || "").replace(/\s+/g, " ").trim().slice(0, 48)}`;

const blockAtReadLine = (blocks: HTMLElement[], viewportTop: number) =>
  blocks.find((element) => element.getBoundingClientRect().bottom > viewportTop + 8) ?? blocks[0] ?? null;

const matchPreviewBlock = (editorBlocks: HTMLElement[], previewBlocks: HTMLElement[], source: HTMLElement) => {
  const index = editorBlocks.indexOf(source);
  if (index >= 0 && previewBlocks[index]) return previewBlocks[index];
  const key = fingerprint(source);
  return previewBlocks.find((element) => fingerprint(element) === key) ?? null;
};

const alignElement = (scroller: HTMLElement, target: HTMLElement, viewportTop: number) => {
  const delta = target.getBoundingClientRect().top - viewportTop;
  if (Math.abs(delta) < 4) return;
  scroller.scrollTop += delta;
};

export const EditorPhonePreview = ({ editor, title, scrollContainer, className }: EditorPhonePreviewProps) => {
  const { t } = useTranslation();
  const { editorTheme } = useEditorTheme();
  const { mermaidTheme } = useMermaidTheme();
  const previewSyncGeneration = useRef(0);
  const [markup, setMarkup] = useState({ html: "", style: "", paper: false });
  const [clock, setClock] = useState(formatPhoneTime);
  const [follow, setFollow] = useState(readEditorPhonePreviewFollowPreference);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const syncingRef = useRef(false);

  useEffect(() => {
    const tick = () => setClock(formatPhoneTime());
    const timer = window.setInterval(tick, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!editor || editor.isDestroyed) {
      setMarkup({ html: "", style: "", paper: false });
      return;
    }

    const sync = () => {
      if (editor.isDestroyed) return;
      const generation = ++previewSyncGeneration.current;
      const nextMarkup = buildPhonePreviewHtml(editor.getHTML(), title ?? "", editorTheme);
      const holder = document.createElement("div");
      holder.innerHTML = nextMarkup.html;
      void embedMermaidForPreview(holder, editor, mermaidTheme).then(() => {
        if (generation !== previewSyncGeneration.current) return;
        setMarkup({
          ...nextMarkup,
          html: holder.innerHTML,
        });
      });
    };

    sync();
    editor.on("update", sync);
    editor.on("create", sync);
    return () => {
      editor.off("update", sync);
      editor.off("create", sync);
    };
  }, [editor, editorTheme, mermaidTheme, title]);

  const handleFollowChange = (enabled: boolean) => {
    setFollow(enabled);
    writeEditorPhonePreviewFollowPreference(enabled);
  };

  const syncFromEditor = useCallback(() => {
    if (!follow || syncingRef.current || !editor || editor.isDestroyed) return;
    const preview = previewRef.current;
    const editorRoot = editor.view.dom;
    if (!preview || !scrollContainer) return;

    const editorBlocks = collectPhonePreviewBlocks(editorRoot);
    const previewBlocks = collectPhonePreviewBlocks(preview, title);
    if (editorBlocks.length === 0 || previewBlocks.length === 0) return;

    const source = blockAtReadLine(editorBlocks, scrollContainer.getBoundingClientRect().top + 72);
    if (!source) return;
    const dest = matchPreviewBlock(editorBlocks, previewBlocks, source);
    if (!dest) return;

    syncingRef.current = true;
    alignElement(preview, dest, preview.getBoundingClientRect().top + 52);
    window.requestAnimationFrame(() => {
      syncingRef.current = false;
    });
  }, [editor, follow, scrollContainer, title]);

  const syncFromPreview = useCallback(() => {
    if (!follow || syncingRef.current || !editor || editor.isDestroyed) return;
    const preview = previewRef.current;
    const editorRoot = editor.view.dom;
    if (!preview || !scrollContainer) return;

    const editorBlocks = collectPhonePreviewBlocks(editorRoot);
    const previewBlocks = collectPhonePreviewBlocks(preview, title);
    if (editorBlocks.length === 0 || previewBlocks.length === 0) return;

    const source = blockAtReadLine(previewBlocks, preview.getBoundingClientRect().top + 52);
    if (!source) return;
    const dest = matchPreviewBlock(previewBlocks, editorBlocks, source);
    if (!dest) return;

    syncingRef.current = true;
    alignElement(scrollContainer, dest, scrollContainer.getBoundingClientRect().top + 72);
    window.requestAnimationFrame(() => {
      syncingRef.current = false;
    });
  }, [editor, follow, scrollContainer, title]);

  useEffect(() => {
    if (!follow) return;
    const frame = window.requestAnimationFrame(syncFromEditor);
    return () => window.cancelAnimationFrame(frame);
  }, [follow, markup.html, syncFromEditor]);

  useEffect(() => {
    if (!follow || !scrollContainer) return;
    scrollContainer.addEventListener("scroll", syncFromEditor, { passive: true });
    return () => scrollContainer.removeEventListener("scroll", syncFromEditor);
  }, [follow, scrollContainer, syncFromEditor]);

  useEffect(() => {
    const preview = previewRef.current;
    if (!follow || !preview) return;
    preview.addEventListener("scroll", syncFromPreview, { passive: true });
    return () => preview.removeEventListener("scroll", syncFromPreview);
  }, [follow, markup.html, syncFromPreview]);

  useEffect(() => {
    if (!follow || !editor || editor.isDestroyed) return;
    editor.on("selectionUpdate", syncFromEditor);
    return () => {
      editor.off("selectionUpdate", syncFromEditor);
    };
  }, [editor, follow, syncFromEditor]);

  return (
    <aside
      className={cn("edgeever-phone-stage sticky top-0 hidden xl:flex", className)}
      aria-label={t("editor.phonePreview")}
    >
      <label className="mb-3 flex w-full items-center justify-end gap-2 px-5 text-xs text-slate-500">
        <span>{t("editor.phonePreviewFollow")}</span>
        <Switch
          checked={follow}
          aria-label={t("editor.phonePreviewFollow")}
          onCheckedChange={handleFollowChange}
        />
      </label>
      <div className="edgeever-phone-device">
        <span className="edgeever-phone-device__silent" aria-hidden="true" />
        <span className="edgeever-phone-device__vol-up" aria-hidden="true" />
        <span className="edgeever-phone-device__vol-down" aria-hidden="true" />
        <span className="edgeever-phone-device__power" aria-hidden="true" />
        <div className="edgeever-phone-device__screen">
          <div className="edgeever-phone-device__island" aria-hidden="true">
            <span className="edgeever-phone-device__lens" />
            <span className="edgeever-phone-device__lens edgeever-phone-device__lens--wide" />
          </div>
          <div className="edgeever-phone-device__status" aria-hidden="true">
            <span className="edgeever-phone-device__time">{clock}</span>
            <span className="edgeever-phone-device__status-icons">
              <svg viewBox="0 0 17 12" width="17" height="12" aria-hidden="true">
                <rect x="0" y="8" width="3" height="4" rx="0.6" fill="currentColor" />
                <rect x="4.5" y="5.5" width="3" height="6.5" rx="0.6" fill="currentColor" />
                <rect x="9" y="3" width="3" height="9" rx="0.6" fill="currentColor" />
                <rect x="13.5" y="0" width="3" height="12" rx="0.6" fill="currentColor" />
              </svg>
              <svg viewBox="0 0 16 12" width="16" height="12" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M8 10.15a1.15 1.15 0 1 0 0 2.3 1.15 1.15 0 0 0 0-2.3Zm0-3.45c1.46 0 2.8.58 3.78 1.53l-1.15 1.16a3.2 3.2 0 0 0-5.26 0L4.22 8.23A5.25 5.25 0 0 1 8 6.7Zm0-3.4c2.46 0 4.7 1 6.37 2.62L13.2 7.08A7.15 7.15 0 0 0 8 4.95a7.15 7.15 0 0 0-5.2 2.13L1.63 5.92A9.55 9.55 0 0 1 8 3.3Z"
                />
              </svg>
              <svg viewBox="0 0 27 13" width="25" height="12" aria-hidden="true">
                <rect x="0.7" y="0.7" width="22" height="11.6" rx="2.6" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.35" />
                <rect x="2.3" y="2.3" width="17" height="8.4" rx="1.5" fill="currentColor" />
                <path d="M24.3 4.15v4.7c.95-.5 1.45-1.25 1.45-2.35s-.5-1.85-1.45-2.35Z" fill="currentColor" opacity="0.35" />
              </svg>
            </span>
          </div>
          <div
            className={cn("edgeever-phone-preview", markup.paper ? "edgeever-phone-preview--article" : "edgeever-phone-preview--editor")}
            ref={(node) => {
              previewRef.current = node;
              if (node) node.setAttribute("style", markup.style);
            }}
          >
            {markup.html ? (
              <div
                className={markup.paper ? "edgeever-phone-article" : "ProseMirror"}
                dangerouslySetInnerHTML={{ __html: markup.html }}
              />
            ) : (
              <p className="pt-10 text-center text-sm text-slate-400">{t("editor.phonePreviewEmpty")}</p>
            )}
          </div>
          <div className="edgeever-phone-device__home" aria-hidden="true" />
        </div>
      </div>
    </aside>
  );
};
