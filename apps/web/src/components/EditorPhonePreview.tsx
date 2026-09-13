import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useEditorTheme } from "@/components/ThemeProvider";
import { buildPhonePreviewHtml } from "@/lib/publish-layout";

type EditorPhonePreviewProps = {
  editor: Editor | null;
  title?: string;
  className?: string;
};

const formatPhoneTime = () =>
  new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date());

export const EditorPhonePreview = ({ editor, title, className }: EditorPhonePreviewProps) => {
  const { t } = useTranslation();
  const { editorTheme } = useEditorTheme();
  const [markup, setMarkup] = useState({ html: "", style: "", paper: false });
  const [clock, setClock] = useState(formatPhoneTime);

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
      setMarkup(buildPhonePreviewHtml(editor.getHTML(), title ?? "", editorTheme));
    };

    sync();
    editor.on("update", sync);
    editor.on("create", sync);
    return () => {
      editor.off("update", sync);
      editor.off("create", sync);
    };
  }, [editor, editorTheme, title]);

  return (
    <aside
      className={cn("edgeever-phone-stage sticky top-0 hidden xl:flex", className)}
      aria-label={t("editor.phonePreview")}
    >
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
