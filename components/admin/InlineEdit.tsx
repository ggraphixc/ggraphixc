"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Click-to-edit cell: shows a value, turns into an input on click,
 * saves on Enter/blur, cancels on Escape.
 */
export default function InlineEdit({
  value,
  onSave,
  className = "",
  style,
  inputStyle
}: {
  value: string;
  onSave: (v: string) => void;
  className?: string;
  style?: React.CSSProperties;
  inputStyle?: React.CSSProperties;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      ref.current?.focus();
      ref.current?.select();
    }
  }, [editing]);

  function commit() {
    const v = draft.trim();
    if (v !== value) onSave(v);
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        ref={ref}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
        style={inputStyle}
        aria-label="Inline edit field"
      />
    );
  }

  return (
    <span
      className={`inline-edit ${className}`}
      style={style}
      title="Click to edit"
      role="button"
      tabIndex={0}
      onClick={() => {
        setDraft(value);
        setEditing(true);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setDraft(value);
          setEditing(true);
        }
      }}
    >
      {value || <em style={{ color: "var(--muted)", opacity: 0.6 }}>—</em>}
    </span>
  );
}
