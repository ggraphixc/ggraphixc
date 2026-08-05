"use client";

import { useEffect, useRef } from "react";

/** Auto-dismissing toast for admin save/reorder feedback. */
export default function AdminToast({
  message,
  type = "ok",
  onClear
}: {
  message: string;
  type?: "ok" | "err";
  onClear: () => void;
}) {
  // Keep onClear in a ref so a new inline closure (per parent render)
  // never restarts the dismiss timer.
  const onClearRef = useRef(onClear);
  useEffect(() => {
    onClearRef.current = onClear;
  }, [onClear]);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => onClearRef.current(), 2600);
    return () => clearTimeout(t);
  }, [message]);

  if (!message) return null;
  return (
    <div role="status" className={`admin-toast ${type}`}>
      {message}
    </div>
  );
}
