"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { continueDeliveries, type BroadcastState } from "@/app/actions/broadcast";

export default function ContinueSendingButton() {
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<BroadcastState | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  async function run() {
    setBusy(true);
    setRes(null);
    startTransition(async () => {
      const r = await continueDeliveries();
      setRes(r);
      setBusy(false);
      // Refresh the server page so the jobs list shows fresh progress.
      router.refresh();
    });
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
      <button type="button" className="btn btn-outline btn-sm" onClick={run} disabled={busy}>
        <i className="fa-solid fa-play" style={{ marginRight: 6 }} />
        {busy ? "Sending…" : "Continue sending"}
      </button>
      {res && (
        <span style={{ fontSize: 12.5, color: res.queued ? "var(--accent)" : "var(--muted)" }}>
          {res.message}
        </span>
      )}
    </div>
  );
}
